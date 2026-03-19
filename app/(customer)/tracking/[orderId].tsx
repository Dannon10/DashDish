import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Platform,
    Animated,
    PanResponder,
    Dimensions,
    Linking,
} from 'react-native';
import { Text } from '../../../components/ui/AppText';
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
import { useOrder } from '../../../hooks/useOrder';
import { useSmoothedLocation } from '../../../hooks/useSmoothedLocation';
import useOrderStore from '../../../store/useOrderStore';
import useAuthStore from '../../../store/useAuthStore';
import DeliveryMap from '../../../components/maps/DeliveryMap';
import colors from '../../../constants/colors';
import type { DriverLocation } from '../../../types/driver.types';
import type { OrderStatus } from '../../../types/database.types';
import RatingModal from '../../../components/ui/modal/RatingModal';
import ErrorBoundary from '../../../components/ErrorBoundary';

const SIMULATED_DRIVER_ID = '9b1a9bee-6fca-4384-967d-1907e2bfc29d';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.65;
const COLLAPSED_HEIGHT = SCREEN_HEIGHT * 0.22;

// Web map fallback 
function WebMap({ center, driverCoords, deliveryCoords }: {
    center: [number, number];
    driverCoords: [number, number] | null;
    deliveryCoords: [number, number];
}) {
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
}

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
    const { profile } = useAuthStore();
    const { activeOrder, setActiveOrder, updateActiveOrderStatus } = useOrderStore();
    const { order, loading } = useOrder(orderId, activeOrder);

    useEffect(() => {
        if (order) {
            setActiveOrder(order);
            updateActiveOrderStatus(order.status);
        }
    }, [order?.status, order?.id]);

    const [rawDriverLocation, setRawDriverLocation] = useState<DriverLocation | null>(null);
    const [route, setRoute] = useState<RouteResult | null>(null);
    const [driverProfile, setDriverProfile] = useState<{
        full_name: string;
        avatar_url: string | null;
        phone: string | null;
        vehicle_info: string | null;
        deliveryCount: number;
    } | null>(null);

    // Rating modal state
    const [showRating, setShowRating] = useState(false);
    const ratingShownRef = useRef(false); // prevent showing twice

    const cameraRef = useRef<any>(null);
    const unsubDriverRef = useRef<(() => void) | null>(null);

    // Bottom sheet
    const [isExpanded, setIsExpanded] = useState(true);
    const sheetHeight = useRef(new Animated.Value(EXPANDED_HEIGHT)).current;
    const lastHeight = useRef(EXPANDED_HEIGHT);

    const snapTo = useCallback((targetHeight: number) => {
        lastHeight.current = targetHeight;
        setIsExpanded(targetHeight === EXPANDED_HEIGHT);
        Animated.spring(sheetHeight, {
            toValue: targetHeight,
            useNativeDriver: false,
            tension: 65,
            friction: 11,
        }).start();
    }, [sheetHeight]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) =>
                Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
            onPanResponderMove: (_, g) => {
                const next = lastHeight.current - g.dy;
                sheetHeight.setValue(
                    Math.max(COLLAPSED_HEIGHT, Math.min(EXPANDED_HEIGHT + 20, next))
                );
            },
            onPanResponderRelease: (_, g) => {
                const current = lastHeight.current - g.dy;
                const mid = (COLLAPSED_HEIGHT + EXPANDED_HEIGHT) / 2;
                snapTo(g.vy > 0.5 || current < mid ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT);
            },
        })
    ).current;

    // Show rating modal when order is delivered
    useEffect(() => {
        if (
            order?.status === 'delivered' &&
            order?.driver_id &&
            !ratingShownRef.current
        ) {
            ratingShownRef.current = true;
            // Small delay so the status update animation plays first
            setTimeout(() => setShowRating(true), 1200);
        }
    }, [order?.status, order?.driver_id]);

    // Driver location
    const smoothedLocation = useSmoothedLocation(
        rawDriverLocation ? { lat: rawDriverLocation.lat, lng: rawDriverLocation.lng } : null,
        1800
    );

    const refreshRoute = useCallback(async (origin: Coordinates, destination: Coordinates) => {
        const result = await getRoute(origin, destination);
        if (result) setRoute(result);
    }, []);

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

    useEffect(() => {
        if (!smoothedLocation || Platform.OS === 'web') return;
        cameraRef.current?.setCamera({
            centerCoordinate: [smoothedLocation.lng, smoothedLocation.lat],
            zoomLevel: 14,
            animationDuration: 1000,
            animationMode: 'flyTo',
        });
    }, [smoothedLocation?.lat, smoothedLocation?.lng]);

    // Driver profile
    useEffect(() => {
        if (!order?.driver_id) return;
        (async () => {
            const [profileRes, deliveryRes] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('full_name, avatar_url, phone, vehicle_info')
                    .eq('id', order.driver_id!)
                    .single(),
                supabase
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('driver_id', order.driver_id!)
                    .eq('status', 'delivered'),
            ]);
            if (profileRes.data) {
                setDriverProfile({
                    ...profileRes.data,
                    deliveryCount: deliveryRes.count ?? 0,
                });
            }
        })();
    }, [order?.driver_id]);

    // Handle rating submit
    const handleRatingSubmit = async (rating: number) => {
        if (!order?.driver_id || !profile?.id) return;

        await supabase.from('driver_ratings').insert({
            order_id: order.id,
            driver_id: order.driver_id,
            customer_id: profile.id,
            rating,
        });

        setShowRating(false);
    };

    const handleRatingSkip = () => {
        setShowRating(false);
    };

    // Derived
    const currentStatus: OrderStatus = order?.status ?? 'placed';
    const currentStepIdx = stepIndex(currentStatus);
    const accentColor = STATUS_COLOR[currentStatus] ?? colors.primary;
    const isDriverVisible = smoothedLocation !== null
        && currentStatus !== 'delivered'
        && currentStatus !== 'cancelled';

    const mapCenter: [number, number] = smoothedLocation
        ? [smoothedLocation.lng, smoothedLocation.lat]
        : order ? [order.delivery_lng, order.delivery_lat] : [3.3792, 6.5244];

    const deliveryCoords: [number, number] = order
        ? [order.delivery_lng, order.delivery_lat]
        : [3.3792, 6.5244];

    const driverCoords: [number, number] | null = smoothedLocation
        ? [smoothedLocation.lng, smoothedLocation.lat]
        : null;

    if (loading) return (
        <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center`}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );

    if (!order) return (
        <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center px-6`}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={tw`text-[${colors.textPrimary}] text-lg mt-3`}>Order not found</Text>
            <TouchableOpacity onPress={() => router.back()} style={tw`mt-4`}>
                <Text weight='semiBold' style={tw`text-[${colors.primary}]`}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ErrorBoundary onGoBack={() => router.back()}>

        <View style={tw`flex-1 bg-[${colors.background}]`}>

            {/* Rating modal */}
            <RatingModal
                visible={showRating}
                driverProfile={driverProfile}
                onSubmit={handleRatingSubmit}
                onSkip={handleRatingSkip}
            />

            {/* Map fills full screen */}
            <View style={tw`absolute inset-0`}>
                <DeliveryMap
                    cameraRef={cameraRef}
                    center={mapCenter}
                    zoomLevel={14}
                    routeCoordinates={route?.coordinates ?? null}
                    routeColor={accentColor}
                    driverCoordinate={driverCoords}
                    showDriver={isDriverVisible}
                    deliveryCoordinate={deliveryCoords}
                    webFallback={
                        <WebMap
                            center={mapCenter}
                            driverCoords={driverCoords}
                            deliveryCoords={deliveryCoords}
                        />
                    }
                />
            </View>

            {/* Back button */}
            <TouchableOpacity
                onPress={() => router.back()}
                style={tw`absolute top-12 left-4 w-9 h-9 rounded-full bg-[${colors.surface}] items-center justify-center z-10`}
            >
                <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            {/* Expand button — only when collapsed */}
            {!isExpanded && (
                <TouchableOpacity
                    onPress={() => snapTo(EXPANDED_HEIGHT)}
                    style={tw`absolute top-12 right-4 w-9 h-9 rounded-full bg-[${colors.surface}] items-center justify-center z-10`}
                >
                    <Ionicons name="chevron-up" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
            )}

            {/* Animated bottom sheet */}
            <Animated.View
                style={[
                    tw`absolute left-0 right-0 bottom-0 bg-[${colors.surface}] rounded-t-3xl`,
                    { height: sheetHeight },
                    {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 12,
                        elevation: 20,
                    },
                ]}
            >
                {/* Drag handle */}
                <View style={tw`items-center pt-3 pb-1`} {...panResponder.panHandlers}>
                    <View style={tw`w-10 h-1 rounded-full bg-[${colors.border}]`} />
                </View>

                {/* ETA + status */}
                <View
                    style={tw`flex-row items-center justify-between px-5 pb-3`}
                    {...panResponder.panHandlers}
                >
                    <View>
                        <Text style={tw`text-[${colors.textSecondary}] text-xs mb-0.5`}>
                            Estimated arrival
                        </Text>
                        <Text weight='bold' style={tw`text-[${colors.textPrimary}] text-2xl`}>
                            {route ? formatETA(route.durationSeconds) : '—'}
                        </Text>
                        {route && (
                            <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`}>
                                {formatDistance(route.distanceMeters)} away
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => snapTo(isExpanded ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT)}
                        style={[
                            tw`px-3 py-1.5 rounded-full flex-row items-center gap-1.5`,
                            { backgroundColor: `${accentColor}22` },
                        ]}
                    >
                        <Text weight='semiBold' style={[tw`text-sm capitalize`, { color: accentColor }]}>
                            {currentStatus.replace(/_/g, ' ')}
                        </Text>
                        <Ionicons
                            name={isExpanded ? 'chevron-down' : 'chevron-up'}
                            size={14}
                            color={accentColor}
                        />
                    </TouchableOpacity>
                </View>

                {/* Scrollable content */}
                <ScrollView
                    style={tw`flex-1`}
                    contentContainerStyle={tw`pb-10`}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={isExpanded}
                >
                    {/* Driver card */}
                    {driverProfile && order.driver_id && (
                        <View style={tw`mx-5 mb-4 rounded-2xl bg-[${colors.surfaceElevated}] overflow-hidden`}>
                            <View style={tw`flex-row items-center p-4`}>
                                {driverProfile.avatar_url ? (
                                    <Image
                                        source={{ uri: driverProfile.avatar_url }}
                                        style={tw`w-14 h-14 rounded-full`}
                                    />
                                ) : (
                                    <View style={tw`w-14 h-14 rounded-full bg-[${colors.primaryDark}] items-center justify-center`}>
                                        <Ionicons name="person" size={26} color={colors.white} />
                                    </View>
                                )}
                                <View style={tw`flex-1 ml-3`}>
                                    <Text weight='semiBold' style={tw`text-[${colors.textPrimary}] text-base`}>
                                        {driverProfile.full_name}
                                    </Text>
                                    <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`}>
                                        Your delivery driver
                                    </Text>
                                </View>
                                {driverProfile.phone && (
                                    <TouchableOpacity
                                        style={tw`w-10 h-10 rounded-full bg-[${colors.primary}] items-center justify-center`}
                                        onPress={() => Linking.openURL(`tel:${driverProfile.phone}`)}
                                    >
                                        <Ionicons name="call" size={18} color={colors.white} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={[tw`mx-4`, { height: 1, backgroundColor: colors.border }]} />

                            <View style={tw`flex-row px-4 py-3 gap-4`}>
                                {driverProfile.vehicle_info ? (
                                    <View style={tw`flex-row items-center gap-1.5 flex-1`}>
                                        <Ionicons name="bicycle-outline" size={14} color={colors.textMuted} />
                                        <Text style={tw`text-[${colors.textSecondary}] text-xs`} numberOfLines={1}>
                                            {driverProfile.vehicle_info}
                                        </Text>
                                    </View>
                                ) : null}
                                <View style={tw`flex-row items-center gap-1.5`}>
                                    <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                                    <Text style={tw`text-xs`}>
                                        <Text weight='semiBold' style={{ color: colors.success }}>
                                            {driverProfile.deliveryCount}
                                        </Text>
                                        <Text style={tw`text-[${colors.textMuted}]`}> deliveries</Text>
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Order progress timeline */}
                    <View style={tw`mx-5 mb-4`}>
                        <Text weight='semiBold' style={tw`text-[${colors.textPrimary}] text-base mb-4`}>
                            Order Progress
                        </Text>
                        {STATUS_STEPS.map((step, idx) => {
                            const isCompleted = idx < currentStepIdx;
                            const isActive = idx === currentStepIdx;
                            const isUpcoming = idx > currentStepIdx;
                            const dotColor = isCompleted || isActive ? accentColor : colors.border;
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
                                                { backgroundColor: isCompleted ? accentColor : colors.border, minHeight: 20 },
                                            ]} />
                                        )}
                                    </View>
                                    <View style={tw`flex-1 pb-5 justify-center`}>
                                        <Text weight='medium' style={[{
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
                    <View style={tw`mx-5`}>
                        <Text weight='semiBold' style={tw`text-[${colors.textPrimary}] text-base mb-3`}>
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
                            <Text weight='semiBold' style={tw`text-[${colors.textPrimary}]`}>Total</Text>
                            <Text weight='semiBold' style={tw`text-[${colors.textPrimary}]`}>
                                ₦{order.total_amount.toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
        </ErrorBoundary>
    );
}