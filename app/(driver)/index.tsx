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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

import { getPendingOrders, acceptOrder, upsertDriverLocation } from '../../services/driver.service';
import { supabase } from '../../services/supabase';
import { startDeliverySimulation, ensureSimulatedDriver } from '../../utils/simulateDelivery';
import useAuthStore from '../../store/useAuthStore';
import useDriverStore from '../../store/useDriverStore';
import colors from '../../constants/colors';

import type { OrderWithItems } from '../../types/order.types';

// ─── Simulated driver ID ──────────────────────────────────────────────────────
// This is a fixed UUID used for portfolio demo simulation.
// Replace with a real driver profile ID if you have one in your DB.
const SIMULATED_DRIVER_ID = '00000000-0000-0000-0000-000000000001';

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({
    order,
    onAccept,
    onDecline,
    isSimulated = false,
}: {
    order: OrderWithItems;
    onAccept: () => void;
    onDecline: () => void;
    isSimulated?: boolean;
}) {
    const itemCount = order.order_items?.length ?? 0;

    return (
        <View
            style={[
                tw`mx-5 mb-4 rounded-2xl overflow-hidden`,
                { borderWidth: 1, borderColor: isSimulated ? `${colors.warning}44` : `${colors.primary}44` },
            ]}
        >
            {/* Top bar */}
            <View style={[tw`h-1 w-full`, { backgroundColor: isSimulated ? colors.warning : colors.primary }]} />

            <View style={tw`p-4 bg-[${colors.surfaceElevated}]`}>
                {/* Header */}
                <View style={tw`flex-row items-center justify-between mb-3`}>
                    <View style={tw`flex-row items-center gap-2`}>
                        <Ionicons name="bicycle-outline" size={18} color={isSimulated ? colors.warning : colors.primary} />
                        <Text style={tw`text-[${colors.textPrimary}] font-bold text-sm`}>
                            {isSimulated ? 'Demo Order' : 'New Order Request'}
                        </Text>
                    </View>
                    <View style={[tw`px-2.5 py-1 rounded-full`, { backgroundColor: isSimulated ? `${colors.warning}22` : `${colors.primary}22` }]}>
                        <Text style={[tw`text-xs font-semibold`, { color: isSimulated ? colors.warning : colors.primary }]}>
                            ₦{order.delivery_fee.toLocaleString()} fee
                        </Text>
                    </View>
                </View>

                {/* Restaurant → Delivery */}
                <View style={tw`gap-2 mb-3`}>
                    <View style={tw`flex-row items-center gap-2`}>
                        <View style={tw`w-6 h-6 rounded-full bg-[${colors.primary}] items-center justify-center`}>
                            <Ionicons name="restaurant" size={12} color="white" />
                        </View>
                        <Text style={tw`text-[${colors.textPrimary}] text-sm font-medium flex-1`} numberOfLines={1}>
                            {order.restaurants?.name}
                        </Text>
                    </View>
                    <View style={tw`ml-3 w-0.5 h-3 bg-[${colors.border}]`} />
                    <View style={tw`flex-row items-center gap-2`}>
                        <View style={tw`w-6 h-6 rounded-full bg-[${colors.success}] items-center justify-center`}>
                            <Ionicons name="home" size={12} color="white" />
                        </View>
                        <Text style={tw`text-[${colors.textSecondary}] text-sm flex-1`} numberOfLines={1}>
                            {order.delivery_address}
                        </Text>
                    </View>
                </View>

                {/* Order info */}
                <View style={[tw`flex-row justify-between py-2.5 mb-3`, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <Text style={tw`text-[${colors.textSecondary}] text-xs`}>
                        {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </Text>
                    <Text style={tw`text-[${colors.textPrimary}] text-xs font-semibold`}>
                        Order total: ₦{order.total_amount.toLocaleString()}
                    </Text>
                </View>

                {/* Accept / Decline */}
                <View style={tw`flex-row gap-3`}>
                    <TouchableOpacity
                        onPress={onDecline}
                        style={tw`flex-1 py-3 rounded-xl border border-[${colors.border}] items-center`}
                    >
                        <Text style={tw`text-[${colors.textSecondary}] font-semibold text-sm`}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onAccept}
                        style={[tw`flex-2 py-3 rounded-xl items-center flex-1`, { backgroundColor: isSimulated ? colors.warning : colors.primary }]}
                    >
                        <Text style={tw`text-white font-bold text-sm`}>
                            {isSimulated ? 'Simulate' : 'Accept'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DriverHomeScreen() {
    const router = useRouter();
    const { profile } = useAuthStore();
    const { isOnline, setOnline, setActiveDelivery, currentLocation } = useDriverStore();

    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const cancelSimRef = useRef<(() => void) | null>(null);

    const fetchOrders = useCallback(async () => {
        const { data } = await getPendingOrders();
        setOrders(data);
    }, []);

    useEffect(() => {
        fetchOrders().finally(() => setLoading(false));
    }, [fetchOrders]);

    // Realtime: new orders appear instantly
    useEffect(() => {
        const channel = supabase
            .channel('pending_orders')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                () => fetchOrders()
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders' },
                () => fetchOrders()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchOrders]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    // Toggle online status + upsert location
    const handleToggleOnline = async (value: boolean) => {
        setOnline(value);
        if (profile?.id && currentLocation) {
            await upsertDriverLocation(
                profile.id,
                currentLocation.lat,
                currentLocation.lng,
                value
            );
        }
    };

    // Real driver accepts order
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

    // Simulate delivery flow for portfolio demo
    const handleSimulate = async (order: OrderWithItems) => {
        setAcceptingId(order.id);

        // Make sure simulated driver has a location row
        await ensureSimulatedDriver(SIMULATED_DRIVER_ID, {
            lat: order.restaurants?.lat ?? 6.5244,
            lng: order.restaurants?.lng ?? 3.3792,
        });

        // Cancel any existing simulation
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
            onStatusChange: (status) => {
                console.log('[sim] status →', status);
            },
            onComplete: () => {
                console.log('[sim] delivery complete');
                setAcceptingId(null);
            },
        });

        setAcceptingId(null);
        // Remove from list immediately
        setOrders((prev) => prev.filter((o) => o.id !== order.id));
    };

    const handleDecline = (orderId: string) => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
    };

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
                contentContainerStyle={tw`pb-10`}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Section label */}
                <Text style={tw`text-[${colors.textSecondary}] text-xs font-semibold uppercase tracking-widest px-5 mb-3`}>
                    {orders.length > 0 ? `${orders.length} Available Order${orders.length !== 1 ? 's' : ''}` : 'No orders right now'}
                </Text>

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
                        <RequestCard
                            key={order.id}
                            order={order}
                            isSimulated={!profile?.id || profile.role !== 'driver'}
                            onAccept={() =>
                                profile?.role === 'driver'
                                    ? handleAccept(order)
                                    : handleSimulate(order)
                            }
                            onDecline={() => handleDecline(order.id)}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
}