import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { upsertDriverLocation } from '../services/driver.service';

interface Coords {
    lat: number;
    lng: number;
}

interface Options {
    driverId: string | undefined;
    initialCoords?: Coords | null;
    enabled?: boolean;
}

interface Result {
    coords: Coords | null;
}

/**
 * Watches the device GPS and broadcasts the position to Supabase
 * every 3 seconds / 5 meters. Returns the current coords.
 */
export function useDriverLocation({ driverId, initialCoords, enabled = true }: Options): Result {
    const [coords, setCoords] = useState<Coords | null>(initialCoords ?? null);
    const watchRef = useRef<any>(null);

    useEffect(() => {
        if (!driverId || !enabled || Platform.OS === 'web') return;

        let Location: any;
        try {
            Location = require('expo-location');
        } catch {
            return;
        }

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            watchRef.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 3000,
                    distanceInterval: 5,
                },
                async (loc: any) => {
                    const next: Coords = {
                        lat: loc.coords.latitude,
                        lng: loc.coords.longitude,
                    };
                    setCoords(next);
                    await upsertDriverLocation(driverId, next.lat, next.lng, true);
                }
            );
        })();

        return () => watchRef.current?.remove();
    }, [driverId, enabled]);

    return { coords };
}