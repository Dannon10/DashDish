import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

import { getCustomerOrders } from '../../../services/order.service';
import { supabase } from '../../../services/supabase';
import useAuthStore from '../../../store/useAuthStore';
import useOrderStore from '../../../store/useOrderStore';
import colors from '../../../constants/colors';
import OrderStatusBar from '../../../components/order/OrderStatusBar';
import OrderCard from '../../../components/order/OrderCard';

import type { OrderWithItems } from '../../../types/order.types';
import type { OrderStatus } from '../../../types/database.types';

const ACTIVE_STATUSES: OrderStatus[] = ['placed', 'confirmed', 'preparing', 'picked_up', 'on_the_way'];
const isActive = (status: OrderStatus) => ACTIVE_STATUSES.includes(status);

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
    return (
        <View style={tw`flex-1 items-center justify-center px-8 pt-16`}>
            <View style={tw`w-20 h-20 rounded-full bg-[${colors.surfaceElevated}] items-center justify-center mb-4`}>
                <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={tw`text-[${colors.textPrimary}] text-lg font-bold mb-2`}>No orders yet</Text>
            <Text style={tw`text-[${colors.textSecondary}] text-sm text-center mb-6`}>
                Your order history will appear here once you place your first order.
            </Text>
            <TouchableOpacity onPress={onBrowse} style={tw`bg-[${colors.primary}] px-6 py-3 rounded-xl`}>
                <Text style={tw`text-white font-bold`}>Browse Restaurants</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function OrdersScreen() {
    const router = useRouter();
    const { profile } = useAuthStore();
    const { setActiveOrder } = useOrderStore();

    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = useCallback(async () => {
        if (!profile?.id) return;
        const { data } = await getCustomerOrders(profile.id);
        setOrders(data);
    }, [profile?.id]);

    useEffect(() => {
        fetchOrders().finally(() => setLoading(false));
    }, [fetchOrders]);

    useEffect(() => {
        if (!profile?.id) return;
        const channel = supabase
            .channel(`customer_orders:${profile.id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_id=eq.${profile.id}` },
                (payload) => {
                    setOrders((prev) =>
                        prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
                    );
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [profile?.id]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    const handleOrderPress = (order: OrderWithItems) => {
        setActiveOrder(order);
        router.push(`/(customer)/tracking/${order.id}`);
    };

    const activeOrders = orders.filter((o) => isActive(o.status));
    const pastOrders = orders.filter((o) => !isActive(o.status));

    if (loading) {
        return (
            <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center`}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-[${colors.background}]`}>
            <View style={tw`px-5 pt-14 pb-4`}>
                <Text style={tw`text-[${colors.textPrimary}] text-2xl font-bold`}>My Orders</Text>
                {orders.length > 0 && (
                    <Text style={tw`text-[${colors.textSecondary}] text-sm mt-1`}>
                        {orders.length} order{orders.length !== 1 ? 's' : ''} total
                    </Text>
                )}
            </View>

            {orders.length === 0 ? (
                <EmptyState onBrowse={() => router.push('/(customer)/(tabs)')} />
            ) : (
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
                    {activeOrders.length > 0 && (
                        <View style={tw`mb-2`}>
                            <Text style={tw`text-[${colors.textSecondary}] text-xs font-semibold uppercase tracking-widest px-5 mb-3`}>
                                In Progress
                            </Text>
                            {activeOrders.map((order) => (
                                <OrderStatusBar key={order.id} order={order} onPress={() => handleOrderPress(order)} />
                            ))}
                        </View>
                    )}

                    {pastOrders.length > 0 && (
                        <View>
                            <Text style={tw`text-[${colors.textSecondary}] text-xs font-semibold uppercase tracking-widest px-5 mb-3 mt-2`}>
                                Past Orders
                            </Text>
                            {pastOrders.map((order) => (
                                <OrderCard key={order.id} order={order} onPress={() => handleOrderPress(order)} />
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}