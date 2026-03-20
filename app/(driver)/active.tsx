import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Alert,
} from 'react-native';
import { Text } from '../../components/ui/AppText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { supabase } from '../../services/supabase';
import { getRoute, formatETA, formatDistance, RouteResult } from '../../services/mapbox.service';
import { updateDeliveryStatus } from '../../services/driver.service';
import { useDriverLocation } from '../../hooks/useDriverLocation';
import { useOrder } from '../../hooks/useOrder';
import { useSmoothedLocation } from '../../hooks/useSmoothedLocation';
import useAuthStore from '../../store/useAuthStore';
import useDriverStore from '../../store/useDriverStore';
import DeliveryMap from '../../components/maps/DeliveryMap';
import colors from '../../constants/colors';
import type { OrderStatus } from '../../types/database.types';
import ErrorBoundary from '../../components/ErrorBoundary';

const NEXT_STATUS: Partial<Record<OrderStatus, { status: 'picked_up' | 'on_the_way' | 'delivered'; label: string; icon: string; color: string }>> = {
    confirmed:  { status: 'picked_up',  label: 'Mark as Picked Up',  icon: 'bag-handle-outline',  color: colors.statusPickedUp },
    preparing:  { status: 'picked_up',  label: 'Mark as Picked Up',  icon: 'bag-handle-outline',  color: colors.statusPickedUp },
    picked_up:  { status: 'on_the_way', label: 'Start Delivery',     icon: 'bicycle-outline',     color: colors.statusOnTheWay },
    on_the_way: { status: 'delivered',  label: 'Mark as Delivered',  icon: 'checkmark-circle-outline', color: colors.statusDelivered },
};

const STATUS_COLOR: Partial<Record<OrderStatus, string>> = {
    confirmed:  colors.statusConfirmed,
    preparing:  colors.statusPreparing,
    picked_up:  colors.statusPickedUp,
    on_the_way: colors.statusOnTheWay,
    delivered:  colors.statusDelivered,
};

export default function DriverActiveScreen() {
    const router = useRouter();
    const { profile } = useAuthStore();
    const { activeDelivery, setActiveDelivery, currentLocation, setCurrentLocation } = useDriverStore();
    const [activeOrderId, setActiveOrderId] = useState<string | undefined>(activeDelivery?.id);

    useEffect(() => {
        if (activeDelivery) { setActiveOrderId(activeDelivery.id); return; }
        if (!profile?.id) return;
        (async () => {
            const { data } = await supabase
                .from('orders')
                .select(`*, order_items (*, menu_items (*)), restaurants (*)`)
                .eq('driver_id', profile.id)
                .in('status', ['confirmed', 'preparing', 'picked_up', 'on_the_way'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (data) { setActiveDelivery(data); setActiveOrderId(data.id); }
        })();
    }, [profile?.id]);

    const { order, loading, setOrder } = useOrder(activeOrderId, activeDelivery);

    const { coords: driverCoords } = useDriverLocation({
        driverId: profile?.id,
        initialCoords: currentLocation,
        enabled: true,
    });

    useEffect(() => { if (driverCoords) setCurrentLocation(driverCoords); }, [driverCoords]);

    const smoothedDriver = useSmoothedLocation(driverCoords, 1500);

    const [route, setRoute] = useState<RouteResult | null>(null);
    const cameraRef = useRef<any>(null);

    const refreshRoute = useCallback(async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
) => {
    if (Platform.OS === 'web') return;
    const result = await getRoute(origin, destination);
    if (result) setRoute(result);
}, []);

    useEffect(() => {
    if (!order || !driverCoords) return;
    if (!driverCoords.lat || !driverCoords.lng) return;
    if (!order.delivery_lat || !order.delivery_lng) return;
    refreshRoute(driverCoords, { lat: order.delivery_lat, lng: order.delivery_lng });
}, [order?.id, driverCoords?.lat]);

    useEffect(() => {
        if (!smoothedDriver || Platform.OS === 'web') return;
        cameraRef.current?.setCamera({
            centerCoordinate: [smoothedDriver.lng, smoothedDriver.lat],
            zoomLevel: 15,
            animationDuration: 1000,
            animationMode: 'flyTo',
        });
    }, [smoothedDriver?.lat, smoothedDriver?.lng]);

    const [updatingStatus, setUpdatingStatus] = useState(false);

    const handleUpdateStatus = async () => {
    if (!order) return;
    const next = NEXT_STATUS[order.status];
    if (!next) return;

    setUpdatingStatus(true);
    const { error } = await updateDeliveryStatus(order.id, next.status);
    if (error) {
        Alert.alert('Error', 'Could not update status. Try again.');
    } else {
        setOrder((prev) => prev ? { ...prev, status: next.status } : prev);
        if (next.status === 'delivered') {
            setActiveDelivery(null);
            setTimeout(() => router.replace('/(driver)'), 8000);
        }
    }
    setUpdatingStatus(false);
};

    const currentStatus = order?.status ?? 'confirmed';
    const accentColor = STATUS_COLOR[currentStatus] ?? colors.primary;
    const nextAction = NEXT_STATUS[currentStatus];

    const mapCenter: [number, number] = smoothedDriver
        ? [smoothedDriver.lng, smoothedDriver.lat]
        : order ? [order.delivery_lng, order.delivery_lat] : [3.3792, 6.5244];

    if (loading) return (
        <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center`}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );

    if (!order) return (
        <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center px-8`}>
            <View style={tw`w-20 h-20 rounded-full bg-[${colors.surfaceElevated}] items-center justify-center mb-4`}>
                <Ionicons name="bicycle-outline" size={36} color={colors.textMuted} />
            </View>
            <Text weight='bold' style={tw`text-[${colors.textPrimary}] text-xl mb-2`}>No Active Delivery</Text>
            <Text style={tw`text-[${colors.textSecondary}] text-sm text-center mb-6`}>
                Accept an order from the requests screen to start delivering.
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(driver)')} style={tw`bg-[${colors.primary}] px-8 py-3 rounded-xl`}>
                <Text weight='bold' style={tw`text-white`}>View Requests</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ErrorBoundary onGoBack={() => router.back()}>
        <View style={tw`flex-1 bg-[${colors.background}]`}>
            <View style={tw`h-[45%]`}>
                <DeliveryMap
                    cameraRef={cameraRef}
                    center={mapCenter}
                    zoomLevel={15}
                    routeCoordinates={route?.coordinates ?? null}
                    routeColor={accentColor}
                    routeWidth={5}
                    driverCoordinate={smoothedDriver ? [smoothedDriver.lng, smoothedDriver.lat] : null}
                    showDriver={!!smoothedDriver}
                    driverColor={colors.primary}
                    restaurantCoordinate={order.restaurants ? [order.restaurants.lng, order.restaurants.lat] : null}
                    deliveryCoordinate={[order.delivery_lng, order.delivery_lat]}
                />

                <TouchableOpacity onPress={() => router.back()} style={tw`absolute top-12 left-4 w-9 h-9 rounded-full bg-[${colors.surface}] items-center justify-center`}>
                    <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>

                {route && (
                    <View style={tw`absolute top-12 right-4 bg-[${colors.surface}] px-3 py-2 rounded-xl`}>
                        <Text weight='bold' style={tw`text-[${colors.textPrimary}] text-sm`}>{formatETA(route.durationSeconds)}</Text>
                        <Text style={tw`text-[${colors.textSecondary}] text-xs text-center`}>{formatDistance(route.distanceMeters)}</Text>
                    </View>
                )}
            </View>

            <ScrollView style={tw`flex-1 bg-[${colors.surface}] rounded-t-3xl -mt-4`} contentContainerStyle={tw`pb-10`} showsVerticalScrollIndicator={false}>
                <View style={tw`items-center pt-3 pb-1`}>
                    <View style={tw`w-10 h-1 rounded-full bg-[${colors.border}]`} />
                </View>

                <View style={tw`flex-row items-center justify-between px-5 pt-4 pb-3`}>
                    <Text weight='bold' style={tw`text-[${colors.textPrimary}] text-xl`}>Active Delivery</Text>
                    <View style={[tw`px-3 py-1.5 rounded-full`, { backgroundColor: `${accentColor}22` }]}>
                        <Text weight='bold' style={[tw`text-xs capitalize`, { color: accentColor }]}>{currentStatus.replace(/_/g, ' ')}</Text>
                    </View>
                </View>

                <View style={tw`mx-5 mb-4 p-4 rounded-2xl bg-[${colors.surfaceElevated}]`}>
                    <View style={tw`flex-row items-center gap-3 mb-3`}>
                        <View style={tw`w-9 h-9 rounded-full bg-[${colors.warning}22] items-center justify-center`}>
                            <Ionicons name="restaurant" size={18} color={colors.warning} />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[${colors.textSecondary}] text-xs`}>Pick up from</Text>
                            <Text weight='semiBold' style={tw`text-[${colors.textPrimary}] text-sm`}>{order.restaurants?.name}</Text>
                        </View>
                    </View>
                    <View style={tw`ml-4 w-0.5 h-4 bg-[${colors.border}] mb-3`} />
                    <View style={tw`flex-row items-center gap-3`}>
                        <View style={tw`w-9 h-9 rounded-full bg-[${colors.success}22] items-center justify-center`}>
                            <Ionicons name="home" size={18} color={colors.success} />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[${colors.textSecondary}] text-xs`}>Deliver to</Text>
                            <Text weight='semiBold' style={tw`text-[${colors.textPrimary}] text-sm`}>{order.delivery_address}</Text>
                        </View>
                    </View>
                </View>

                <View style={tw`mx-5 mb-4 p-4 rounded-2xl bg-[${colors.surfaceElevated}]`}>
                    <Text weight='semiBold' style={tw`text-[${colors.textPrimary}] mb-3`}>Order Items</Text>
                    {order.order_items?.map((item) => (
                        <View key={item.id} style={tw`flex-row justify-between py-1.5`}>
                            <Text style={tw`text-[${colors.textSecondary}] text-sm`}>{item.quantity}× {item.menu_items?.name}</Text>
                            <Text style={tw`text-[${colors.textSecondary}] text-sm`}>₦{(item.unit_price * item.quantity).toLocaleString()}</Text>
                        </View>
                    ))}
                    <View style={[tw`flex-row justify-between pt-3 mt-2`, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                        <Text style={tw`text-[${colors.textSecondary}] text-sm`}>Your earnings</Text>
                        <Text weight='bold' style={[tw`text-sm`, { color: colors.success }]}>₦{order.delivery_fee.toLocaleString()}</Text>
                    </View>
                </View>

                {nextAction && (
                    <View style={tw`px-5`}>
                        <TouchableOpacity
                            onPress={handleUpdateStatus}
                            disabled={updatingStatus}
                            style={[tw`py-4 rounded-xl flex-row items-center justify-center gap-2`, { backgroundColor: nextAction.color, opacity: updatingStatus ? 0.7 : 1 }]}
                        >
                            {updatingStatus ? <ActivityIndicator size="small" color="white" /> : (
                                <>
                                    <Ionicons name={nextAction.icon as any} size={20} color="white" />
                                    <Text weight='bold' style={tw`text-white text-base`}>{nextAction.label}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {currentStatus === 'delivered' && (
                    <View style={tw`px-5`}>
                        <View style={tw`py-4 rounded-xl bg-[${colors.success}22] items-center`}>
                            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                            <Text weight='bold' style={[tw`text-base mt-1`, { color: colors.success }]}>Delivered Successfully!</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
        </ErrorBoundary>
    );
}