import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import {
    getRoute,
    subscribeToDriverLocation,
    getDriverLocation,
    RouteResult,
    Coordinates,
} from '../services/mapbox.service';
import { useSmoothedLocation } from '../hooks/useSmoothedLocation';
import { SIMULATED_DRIVER_ID } from '../constants/orderTracking';
import type { DriverLocation } from '../types/driver.types';
import type { OrderStatus } from '../types/database.types';

interface Order {
    id: string;
    driver_id: string | null;
    delivery_lat: number;
    delivery_lng: number;
    status: OrderStatus;
}

export function useDriverTracking(order: Order | null, cameraRef: React.RefObject<any>) {
    const [rawDriverLocation, setRawDriverLocation] = useState<DriverLocation | null>(null);
    const [route, setRoute] = useState<RouteResult | null>(null);
    const unsubDriverRef = useRef<(() => void) | null>(null);

    const refreshRoute = useCallback(async (origin: Coordinates, destination: Coordinates) => {
        const result = await getRoute(origin, destination);
        if (result) setRoute(result);
    }, []);

    // Subscribe to driver location updates
    useEffect(() => {
        if (!order) return;

        const driverIdToTrack = order.driver_id ?? SIMULATED_DRIVER_ID;

        (async () => {
            const loc = await getDriverLocation(driverIdToTrack);
            if (loc) {
                setRawDriverLocation(loc);
                await refreshRoute(
                    { lat: loc.lat, lng: loc.lng },
                    { lat: order.delivery_lat, lng: order.delivery_lng }
                );
            }
        })();

        unsubDriverRef.current?.();
        unsubDriverRef.current = subscribeToDriverLocation(driverIdToTrack, async (loc) => {
            setRawDriverLocation(loc);
            await refreshRoute(
                { lat: loc.lat, lng: loc.lng },
                { lat: order.delivery_lat, lng: order.delivery_lng }
            );
        });

        return () => unsubDriverRef.current?.();
    }, [order?.id, order?.driver_id]);

    // Smooth the raw driver location
    const smoothedLocation = useSmoothedLocation(
        rawDriverLocation ? { lat: rawDriverLocation.lat, lng: rawDriverLocation.lng } : null,
        1800
    );

    // Fly camera to driver position on native
    useEffect(() => {
        if (!smoothedLocation || Platform.OS === 'web') return;
        cameraRef.current?.setCamera({
            centerCoordinate: [smoothedLocation.lng, smoothedLocation.lat],
            zoomLevel: 14,
            animationDuration: 1000,
            animationMode: 'flyTo',
        });
    }, [smoothedLocation?.lat, smoothedLocation?.lng]);

    // Derived values
    const currentStatus = order?.status ?? 'placed';
    const isDriverVisible =
        smoothedLocation !== null &&
        currentStatus !== 'delivered' &&
        currentStatus !== 'cancelled';

    const mapCenter: [number, number] = smoothedLocation
        ? [smoothedLocation.lng, smoothedLocation.lat]
        : order
        ? [order.delivery_lng, order.delivery_lat]
        : [3.3792, 6.5244];

    const deliveryCoords: [number, number] = order
        ? [order.delivery_lng, order.delivery_lat]
        : [3.3792, 6.5244];

    const driverCoords: [number, number] | null = smoothedLocation
        ? [smoothedLocation.lng, smoothedLocation.lat]
        : null;

    return { route, smoothedLocation, isDriverVisible, mapCenter, deliveryCoords, driverCoords };
}