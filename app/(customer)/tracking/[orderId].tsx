import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../services/supabase';
import {
    getRoute,
    subscribeToDriverLocation,
    getDriverLocation,
    formatETA,
    formatDistance,
    RouteResult,
    Coordinates,
} from '../../../services/mapbox.service';
import { useSmoothedLocation } from '../../../hooks/useSmoothedLocation';
import useOrderStore from '../../../store/useOrderStore';
import colors from '../../../constants/colors';
import type { OrderWithItems } from '../../../types/order.types';
import type { DriverLocation } from '../../../types/driver.types';
import type { OrderStatus } from '../../../types/database.types';

const SIMULATED_DRIVER_ID = '9b1a9bee-6fca-4384-967d-1907e2bfc29d';

// Lazy-load MapboxGL only on native
let MapboxGL: typeof import('@rnmapbox/maps').default | null = null;
if (Platform.OS !== 'web') {
    MapboxGL = require('@rnmapbox/maps').default;
    MapboxGL!.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);
}

// Web fallback
const WebMap: React.FC<{
    center: [number, number];
    driverCoords: [number, number] | null;
    deliveryCoords: [number, number];
}> = ({ center, driverCoords, deliveryCoords }) => {
    const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN!;
    const [lng, lat] = center;
    const pins =
        `pin-s-home+22C55E(${deliveryCoords[0]},${deliveryCoords[1]})` +
        (driverCoords ? `,pin-s-bicycle+7C3AED(${driverCoords[0]},${driverCoords[1]})` : '');
    const src = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${pins}/${lng},${lat},14,0/600x300@2x?access_token=${TOKEN}`;
    return (
        <View style={tw`flex-1 bg-[${colors.surfaceElevated}] overflow-hidden`}>
            {/* @ts-ignore */}
            <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="map" />
        </View>
    );
};

// Status config
const STATUS_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
    { key: 'placed',     label: 'Order Placed', icon: 'receipt-outline' },
    { key: 'confirmed',  label: 'Confirmed',    icon: 'checkmark-circle-outline' },
    { key: 'preparing',  label: 'Preparing',    icon: 'restaurant-outline' },
    { key: 'picked_up',  label: 'Picked Up',    icon: 'bag-handle-outline' },
    { key: 'on_the_way', label: 'On the Way',   icon: 'bicycle-outline' },
    { key: 'delivered',  label: 'Delivered',    icon: 'home-outline' },
];

const STATUS_COLOR: Record<OrderStatus, string> = {
    placed:     colors.statusPlaced,
    confirmed:  colors.statusConfirmed,
    preparing:  colors.statusPreparing,
    picked_up:  colors.statusPickedUp,
    on_the_way: colors.statusOnTheWay,
    delivered:  colors.statusDelivered,
    cancelled:  colors.statusCancelled,
};

function stepIndex(status: OrderStatus): number {
    const idx = STATUS_STEPS.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
}

export default function OrderTrackingScreen() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const router = useRouter();
    const { activeOrder, setActiveOrder, updateActiveOrderStatus } = useOrderStore();

    const [order, setOrder] = useState<OrderWithItems | null>(activeOrder);
    const [rawDriverLocation, setRawDriverLocation] = useState<DriverLocation | null>(null);
    const [route, setRoute] = useState<RouteResult | null>(null);
    const [driverProfile, setDriverProfile] = useState<{
        full_name: string;
        avatar_url: string | null;
        phone: string | null;
    } | null>(null);
    const [loading, setLoading] = useState(!activeOrder);

    const cameraRef = useRef<any>(null);
    const unsubDriverRef = useRef<(() => void) | null>(null);
    const unsubOrderRef = useRef<(() => void) | null>(null);

    // Smooth interpolated driver position
    const smoothedLocation = useSmoothedLocation(
        rawDriverLocation ? { lat: rawDriverLocation.lat, lng: rawDriverLocation.lng } : null,
        1800 // animate over 1.8s between 2s GPS updates
    );

    // Fetch order
    useEffect(() => {
        if (activeOrder?.id === orderId) {
            setOrder(activeOrder);
            setLoading(false);
            return;
        }
        (async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`*, order_items (*, menu_items (*)), restaurants (*)`)
                .eq('id', orderId)
                .single();
            if (!error && data) {
                setOrder(data as OrderWithItems);
                setActiveOrder(data as OrderWithItems);
            }
            setLoading(false);
        })();
    }, [orderId]);

    // Realtime: order status
    useEffect(() => {
        if (!orderId) return;
        const channel = supabase
            .channel(`order_status:${orderId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`,
            }, (payload) => {
                const updated = payload.new as { status: OrderStatus; driver_id: string | null };
                updateActiveOrderStatus(updated.status);
                setOrder((prev) =>
                    prev ? { ...prev, status: updated.status, driver_id: updated.driver_id } : prev
                );
            })
            .subscribe();
        unsubOrderRef.current = () => supabase.removeChannel(channel);
        return () => unsubOrderRef.current?.();
    }, [orderId]);

    // Driver location subscription — starts immediately with simulated driver ID
    useEffect(() => {
        if (!order) return;

        const driverIdToTrack = order.driver_id ?? SIMULATED_DRIVER_ID;

        // Fetch initial position
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

        // Subscribe to live updates
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

    // Pan camera to follow smoothed driver position
    useEffect(() => {
        if (!smoothedLocation || Platform.OS === 'web') return;
        cameraRef.current?.setCamera({
            centerCoordinate: [smoothedLocation.lng, smoothedLocation.lat],
            zoomLevel: 14,
            animationDuration: 1000,
            animationMode: 'flyTo',
        });
    }, [smoothedLocation?.lat, smoothedLocation?.lng]);

    // Fetch driver profile
    useEffect(() => {
        if (!order?.driver_id) return;
        (async () => {
            const { data } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, phone')
                .eq('id', order.driver_id!)
                .single();
            if (data) setDriverProfile(data);
        })();
    }, [order?.driver_id]);

    const refreshRoute = useCallback(async (origin: Coordinates, destination: Coordinates) => {
        const result = await getRoute(origin, destination);
        if (result) setRoute(result);
    }, []);

    // Derived
    const currentStatus: OrderStatus = order?.status ?? 'placed';
    const currentStepIdx = stepIndex(currentStatus);
    const accentColor = STATUS_COLOR[currentStatus] ?? colors.primary;
    const isDriverVisible = smoothedLocation !== null
        && currentStatus !== 'delivered'
        && currentStatus !== 'cancelled';

    // Use smoothed location for map rendering
    const mapCenter: [number, number] = smoothedLocation
        ? [smoothedLocation.lng, smoothedLocation.lat]
        : order ? [order.delivery_lng, order.delivery_lat] : [3.3792, 6.5244];

    const deliveryCoords: [number, number] = order
        ? [order.delivery_lng, order.delivery_lat]
        : [3.3792, 6.5244];

    const driverCoords: [number, number] | null = smoothedLocation
        ? [smoothedLocation.lng, smoothedLocation.lat]
        : null;

    // GeoJSON for smooth ShapeSource driver marker
    const driverGeoJSON = smoothedLocation ? {
        type: 'FeatureCollection' as const,
        features: [{
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [smoothedLocation.lng, smoothedLocation.lat],
            },
            properties: {},
        }],
    } : null;

    if (loading) {
        return (
            <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center`}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center px-6`}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={tw`text-[${colors.textPrimary}] text-lg mt-3`}>Order not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={tw`mt-4`}>
                    <Text style={tw`text-[${colors.primary}] font-semibold`}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-[${colors.background}]`}>

            {/* Map */}
            <View style={tw`h-[42%]`}>
                {Platform.OS === 'web' ? (
                    <WebMap
                        center={mapCenter}
                        driverCoords={driverCoords}
                        deliveryCoords={deliveryCoords}
                    />
                ) : MapboxGL ? (
                    <MapboxGL.MapView
                        style={tw`flex-1`}
                        styleURL={MapboxGL.StyleURL.Dark}
                        logoEnabled={false}
                        attributionEnabled={false}
                        compassEnabled={false}
                    >
                        <MapboxGL.Camera
                            ref={cameraRef}
                            centerCoordinate={mapCenter}
                            zoomLevel={14}
                            animationMode="flyTo"
                            animationDuration={1000}
                        />

                        {/* Route line */}
                        {route && (
                            <MapboxGL.ShapeSource
                                id="routeSource"
                                shape={{
                                    type: 'Feature',
                                    geometry: { type: 'LineString', coordinates: route.coordinates },
                                    properties: {},
                                }}
                            >
                                <MapboxGL.LineLayer
                                    id="routeLine"
                                    style={{
                                        lineColor: accentColor,
                                        lineWidth: 4,
                                        lineOpacity: 0.85,
                                        lineCap: 'round',
                                        lineJoin: 'round',
                                    }}
                                />
                            </MapboxGL.ShapeSource>
                        )}

                        {/* Driver marker — ShapeSource for smooth animation */}
                        {isDriverVisible && driverGeoJSON && (
                            <MapboxGL.ShapeSource
                                id="driverSource"
                                shape={driverGeoJSON}
                            >
                                <MapboxGL.CircleLayer
                                    id="driverCircle"
                                    style={{
                                        circleRadius: 20,
                                        circleColor: colors.primary,
                                        circleStrokeWidth: 2.5,
                                        circleStrokeColor: '#FFFFFF',
                                        circlePitchAlignment: 'map',
                                    }}
                                />
                                <MapboxGL.SymbolLayer
                                    id="driverIcon"
                                    style={{
                                        iconImage: 'bicycle-15',
                                        iconSize: 1.3,
                                        iconColor: '#FFFFFF',
                                        iconAllowOverlap: true,
                                        iconIgnorePlacement: true,
                                    }}
                                />
                            </MapboxGL.ShapeSource>
                        )}

                        {/* Delivery pin */}
                        <MapboxGL.PointAnnotation
                            id="deliveryPin"
                            coordinate={[order.delivery_lng, order.delivery_lat]}
                        >
                            <View style={tw`w-9 h-9 rounded-full bg-[${colors.success}] items-center justify-center border-2 border-white`}>
                                <Ionicons name="home" size={16} color={colors.white} />
                            </View>
                        </MapboxGL.PointAnnotation>
                    </MapboxGL.MapView>
                ) : null}

                {/* Back button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={tw`absolute top-12 left-4 w-9 h-9 rounded-full bg-[${colors.surface}] items-center justify-center`}
                >
                    <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* Bottom panel */}
            <ScrollView
                style={tw`flex-1 bg-[${colors.surface}] rounded-t-3xl -mt-4`}
                contentContainerStyle={tw`pb-10`}
                showsVerticalScrollIndicator={false}
            >
                <View style={tw`items-center pt-3 pb-1`}>
                    <View style={tw`w-10 h-1 rounded-full bg-[${colors.border}]`} />
                </View>

                {/* ETA + status badge */}
                <View style={tw`flex-row items-center justify-between px-5 pt-4 pb-2`}>
                    <View>
                        <Text style={tw`text-[${colors.textSecondary}] text-xs mb-0.5`}>
                            Estimated arrival
                        </Text>
                        <Text style={tw`text-[${colors.textPrimary}] text-2xl font-bold`}>
                            {route ? formatETA(route.durationSeconds) : '—'}
                        </Text>
                        {route && (
                            <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`}>
                                {formatDistance(route.distanceMeters)} away
                            </Text>
                        )}
                    </View>
                    <View style={[tw`px-3 py-1.5 rounded-full`, { backgroundColor: `${accentColor}22` }]}>
                        <Text style={[tw`text-sm font-semibold capitalize`, { color: accentColor }]}>
                            {currentStatus.replace(/_/g, ' ')}
                        </Text>
                    </View>
                </View>

                {/* Driver card */}
                {driverProfile && order.driver_id && (
                    <View style={tw`mx-5 mt-3 p-4 rounded-2xl bg-[${colors.surfaceElevated}] flex-row items-center`}>
                        {driverProfile.avatar_url ? (
                            <Image source={{ uri: driverProfile.avatar_url }} style={tw`w-12 h-12 rounded-full`} />
                        ) : (
                            <View style={tw`w-12 h-12 rounded-full bg-[${colors.primaryDark}] items-center justify-center`}>
                                <Ionicons name="person" size={24} color={colors.white} />
                            </View>
                        )}
                        <View style={tw`flex-1 ml-3`}>
                            <Text style={tw`text-[${colors.textPrimary}] font-semibold text-base`}>
                                {driverProfile.full_name}
                            </Text>
                            <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`}>
                                Your delivery driver
                            </Text>
                        </View>
                        {driverProfile.phone && (
                            <TouchableOpacity style={tw`w-10 h-10 rounded-full bg-[${colors.primary}] items-center justify-center`}>
                                <Ionicons name="call" size={18} color={colors.white} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Status timeline */}
                <View style={tw`mx-5 mt-5`}>
                    <Text style={tw`text-[${colors.textPrimary}] font-semibold text-base mb-4`}>
                        Order Progress
                    </Text>
                    {STATUS_STEPS.map((step, idx) => {
                        const isCompleted = idx < currentStepIdx;
                        const isActive = idx === currentStepIdx;
                        const isUpcoming = idx > currentStepIdx;
                        const dotColor = isCompleted || isActive ? accentColor : colors.border;
                        const lineColor = isCompleted ? accentColor : colors.border;
                        const isLast = idx === STATUS_STEPS.length - 1;
                        return (
                            <View key={step.key} style={tw`flex-row`}>
                                <View style={tw`items-center mr-4`}>
                                    <View style={[
                                        tw`w-8 h-8 rounded-full items-center justify-center`,
                                        {
                                            backgroundColor: isUpcoming ? colors.surfaceElevated : `${dotColor}22`,
                                            borderWidth: isActive ? 2 : 0,
                                            borderColor: dotColor,
                                        },
                                    ]}>
                                        <Ionicons
                                            name={step.icon as any}
                                            size={16}
                                            color={isUpcoming ? colors.textMuted : dotColor}
                                        />
                                    </View>
                                    {!isLast && (
                                        <View style={[
                                            tw`w-0.5 flex-1 my-1`,
                                            { backgroundColor: lineColor, minHeight: 20 },
                                        ]} />
                                    )}
                                </View>
                                <View style={tw`flex-1 pb-5 justify-center`}>
                                    <Text style={[tw`font-medium`, {
                                        color: isUpcoming ? colors.textMuted : isActive ? colors.textPrimary : colors.textSecondary,
                                        fontSize: isActive ? 15 : 14,
                                    }]}>
                                        {step.label}
                                    </Text>
                                    {isActive && (
                                        <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`}>
                                            In progress...
                                        </Text>
                                    )}
                                    {isCompleted && (
                                        <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`}>
                                            Done ✓
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Order summary */}
                <View style={tw`mx-5 mt-2`}>
                    <Text style={tw`text-[${colors.textPrimary}] font-semibold text-base mb-3`}>
                        {order.restaurants?.name}
                    </Text>
                    {order.order_items?.map((item) => (
                        <View key={item.id} style={tw`flex-row justify-between py-1.5`}>
                            <Text style={tw`text-[${colors.textSecondary}] text-sm`}>
                                {item.quantity}× {item.menu_items?.name}
                            </Text>
                            <Text style={tw`text-[${colors.textSecondary}] text-sm`}>
                                ₦{(item.unit_price * item.quantity).toLocaleString()}
                            </Text>
                        </View>
                    ))}
                    <View style={tw`flex-row justify-between pt-3 mt-1 border-t border-[${colors.border}]`}>
                        <Text style={tw`text-[${colors.textPrimary}] font-semibold`}>Total</Text>
                        <Text style={tw`text-[${colors.textPrimary}] font-semibold`}>
                            ₦{order.total_amount.toLocaleString()}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}