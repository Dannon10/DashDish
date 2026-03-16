import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Switch,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { getPendingOrders, acceptOrder, upsertDriverLocation } from '../../../services/driver.service';
import { supabase } from '../../../services/supabase';
import { startDeliverySimulation, ensureSimulatedDriver } from '../../../utils/simulateDelivery';
import useAuthStore from '../../../store/useAuthStore';
import useDriverStore from '../../../store/useDriverStore';
import colors from '../../../constants/colors';
import RequestCard from '../../../components/driver/RequestCard';
import type { OrderWithItems } from '../../../types/order.types';

const SIMULATED_DRIVER_ID = '9b1a9bee-6fca-4384-967d-1907e2bfc29d';
const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

// Swipeable wrapper 
function SwipeableCard({
    children,
    onDecline,
    onAccept,
}: {
    children: React.ReactNode;
    onDecline: () => void;
    onAccept: () => void;
}) {
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    // Left bg (decline) opacity
    const declineBgOpacity = translateX.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    // Right bg (accept) opacity
    const acceptBgOpacity = translateX.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const flyOff = (toValue: number, callback: () => void) => {
        Animated.parallel([
            Animated.timing(translateX, {
                toValue,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => callback());
    };

    const snapBack = () => {
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 8,
        }).start();
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) =>
                Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
            onPanResponderMove: (_, g) => {
                translateX.setValue(g.dx);
            },
            onPanResponderRelease: (_, g) => {
                if (g.dx < -SWIPE_THRESHOLD) {
                    flyOff(-SCREEN_WIDTH, onDecline);
                } else if (g.dx > SWIPE_THRESHOLD) {
                    flyOff(SCREEN_WIDTH, onAccept);
                } else {
                    snapBack();
                }
            },
        })
    ).current;

    return (
        <View style={tw`relative mb-4 mx-5`}>
            {/* Decline bg — revealed on left swipe */}
            <Animated.View
                style={[
                    tw`absolute inset-0 rounded-2xl items-center justify-start flex-row pl-6`,
                    { backgroundColor: colors.error, opacity: declineBgOpacity },
                ]}
            >
                <Ionicons name="close-circle" size={26} color="white" />
                <Text style={tw`text-white font-bold text-sm ml-2`}>Decline</Text>
            </Animated.View>

            {/* Accept bg — revealed on right swipe */}
            <Animated.View
                style={[
                    tw`absolute inset-0 rounded-2xl items-center justify-end flex-row pr-6`,
                    { backgroundColor: colors.success, opacity: acceptBgOpacity },
                ]}
            >
                <Text style={tw`text-white font-bold text-sm mr-2`}>Accept</Text>
                <Ionicons name="checkmark-circle" size={26} color="white" />
            </Animated.View>

            {/* Card */}
            <Animated.View
                style={{ transform: [{ translateX }], opacity }}
                {...panResponder.panHandlers}
            >
                {children}
            </Animated.View>
        </View>
    );
}

// Main screen
export default function DriverHomeScreen() {
    const router = useRouter();
    const { profile } = useAuthStore();
    const { isOnline, setOnline, setActiveDelivery, currentLocation } = useDriverStore();

    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    const declinedIdsRef = useRef<Set<string>>(new Set());
    const cancelSimRef = useRef<(() => void) | null>(null);

    const fetchOrders = useCallback(async () => {
        const { data } = await getPendingOrders();
        setOrders(data.filter((o) => !declinedIdsRef.current.has(o.id)));
    }, []);

    useEffect(() => {
        fetchOrders().finally(() => setLoading(false));
    }, [fetchOrders]);

    useEffect(() => {
        const channel = supabase
            .channel('pending_orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => fetchOrders())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => fetchOrders())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchOrders]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    const handleToggleOnline = async (value: boolean) => {
        setOnline(value);
        if (profile?.id && currentLocation) {
            await upsertDriverLocation(profile.id, currentLocation.lat, currentLocation.lng, value);
        }
    };

    const handleAccept = async (order: OrderWithItems) => {
        if (!profile?.id) return;
        setAcceptingId(order.id);
        const { error } = await acceptOrder(order.id, profile.id);
        if (error) {
            Alert.alert('Error', 'Could not accept order. It may have been taken.');
            setAcceptingId(null);
            await fetchOrders();
            return;
        }
        setActiveDelivery(order);
        setAcceptingId(null);
        router.push('/(driver)/active');
    };

    const handleSimulate = async (order: OrderWithItems) => {
        setAcceptingId(order.id);
        await ensureSimulatedDriver(SIMULATED_DRIVER_ID, {
            lat: order.restaurants?.lat ?? 6.5244,
            lng: order.restaurants?.lng ?? 3.3792,
        });
        cancelSimRef.current?.();
        cancelSimRef.current = startDeliverySimulation({
            orderId: order.id,
            driverId: SIMULATED_DRIVER_ID,
            restaurantCoords: {
                lat: order.restaurants?.lat ?? 6.5244,
                lng: order.restaurants?.lng ?? 3.3792,
            },
            deliveryCoords: {
                lat: order.delivery_lat,
                lng: order.delivery_lng,
            },
            onComplete: () => setAcceptingId(null),
        });
        setAcceptingId(null);
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
    };

    const handleDecline = useCallback((orderId: string) => {
        declinedIdsRef.current.add(orderId);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }, []);

    if (loading) {
        return (
            <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center`}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-[${colors.background}]`}>
            {/* Header */}
            <View style={tw`px-5 pt-14 pb-4`}>
                <View style={tw`flex-row items-center justify-between`}>
                    <View>
                        <Text style={tw`text-[${colors.textPrimary}] text-2xl font-bold`}>
                            {profile?.full_name?.split(' ')[0] ?? 'Driver'}
                        </Text>
                        <Text style={tw`text-[${colors.textSecondary}] text-sm mt-0.5`}>
                            {isOnline ? 'You are online' : 'You are offline'}
                        </Text>
                    </View>
                    <View style={tw`flex-row items-center gap-3`}>
                        <Text style={tw`text-[${colors.textSecondary}] text-sm`}>
                            {isOnline ? 'Online' : 'Offline'}
                        </Text>
                        <Switch
                            value={isOnline}
                            onValueChange={handleToggleOnline}
                            trackColor={{ false: colors.border, true: `${colors.primary}88` }}
                            thumbColor={isOnline ? colors.primary : colors.textMuted}
                        />
                    </View>
                </View>
            </View>

            {/* Active delivery banner */}
            <TouchableOpacity
                onPress={() => router.push('/(driver)/active')}
                style={tw`mx-5 mb-4 p-3 rounded-xl bg-[${colors.primary}] flex-row items-center justify-between`}
            >
                <View style={tw`flex-row items-center gap-2`}>
                    <Ionicons name="bicycle" size={18} color="white" />
                    <Text style={tw`text-white font-semibold text-sm`}>View Active Delivery</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-32`}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                <View style={tw`flex-row items-center justify-between px-5 mb-3`}>
                    <Text style={tw`text-[${colors.textSecondary}] text-xs font-semibold uppercase tracking-widest`}>
                        {orders.length > 0
                            ? `${orders.length} Available Order${orders.length !== 1 ? 's' : ''}`
                            : 'No orders right now'}
                    </Text>
                    {orders.length > 0 && (
                        <Text style={tw`text-[${colors.textMuted}] text-[10px]`}>
                            swipe to accept / decline
                        </Text>
                    )}
                </View>

                {orders.length === 0 ? (
                    <View style={tw`items-center justify-center pt-16 px-8`}>
                        <View style={tw`w-20 h-20 rounded-full bg-[${colors.surfaceElevated}] items-center justify-center mb-4`}>
                            <Ionicons name="bicycle-outline" size={36} color={colors.textMuted} />
                        </View>
                        <Text style={tw`text-[${colors.textPrimary}] text-lg font-bold mb-2`}>
                            No orders yet
                        </Text>
                        <Text style={tw`text-[${colors.textSecondary}] text-sm text-center`}>
                            New orders will appear here automatically. Pull down to refresh.
                        </Text>
                    </View>
                ) : (
                    orders.map((order) => (
                        <SwipeableCard
                            key={order.id}
                            onDecline={() => handleDecline(order.id)}
                            onAccept={() =>
                                profile?.role === 'driver'
                                    ? handleAccept(order)
                                    : handleSimulate(order)
                            }
                        >
                            <RequestCard
                                order={order}
                                isSimulated={profile?.role !== 'driver'}
                                isLoading={acceptingId === order.id}
                                onAccept={() =>
                                    profile?.role === 'driver'
                                        ? handleAccept(order)
                                        : handleSimulate(order)
                                }
                                onDecline={() => handleDecline(order.id)}
                                noMargin
                            />
                        </SwipeableCard>
                    ))
                )}
            </ScrollView>
        </View>
    );
}