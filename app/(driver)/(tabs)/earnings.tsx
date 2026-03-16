import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

import { supabase } from '../../../services/supabase';
import useAuthStore from '../../../store/useAuthStore';
import colors from '../../../constants/colors';
import { haversineKm } from '../../../components/driver/earnings/haversine';
import EarningsHero from '../../../components/driver/earnings/EarningsHero';
import PeriodSelector, { Period } from '../../../components/driver/earnings/PeriodSelector';
import EarningsStats from '../../../components/driver/earnings/EarningsStats';
import WeeklyBarChart from '../../../components/driver/earnings/BarChart';
import DeliveryRow from '../../../components/driver/earnings/DeliveryRow';

import type { OrderWithItems } from '../../../types/order.types';

export default function EarningsScreen() {
    const { profile } = useAuthStore();
    const [deliveries, setDeliveries] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>('week');

    const fetchDeliveries = useCallback(async () => {
        if (!profile?.id) return;
        const { data, error } = await supabase
            .from('orders')
            .select(`*, restaurants(*), order_items(*, menu_items(*))`)
            .eq('driver_id', profile.id)
            .eq('status', 'delivered')
            .order('created_at', { ascending: false });

        if (!error && data) setDeliveries(data as OrderWithItems[]);
        setLoading(false);
    }, [profile?.id]);

    useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

    // Filter by selected period
    const now = new Date();
    const filtered = deliveries.filter((d) => {
        const created = new Date(d.created_at);
        if (period === 'week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return created >= weekAgo;
        }
        if (period === 'month') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            return created >= monthAgo;
        }
        return true;
    });

    // Derived stats
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayDeliveries = deliveries.filter((d) => new Date(d.created_at) >= todayStart);
    const todayEarnings = todayDeliveries.reduce((sum, d) => sum + d.delivery_fee, 0);

    const totalEarnings = filtered.reduce((sum, d) => sum + d.delivery_fee, 0);
    const totalDeliveries = filtered.length;
    const totalDistanceKm = filtered.reduce((sum, d) => {
        if (!d.restaurants) return sum;
        return sum + haversineKm(
            d.restaurants.lat, d.restaurants.lng,
            d.delivery_lat, d.delivery_lng
        );
    }, 0);

    if (loading) {
        return (
            <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center`}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={tw`flex-1 bg-[${colors.background}]`}
            contentContainerStyle={tw`pb-32`}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={tw`px-5 pt-14 pb-5`}>
                <Text style={tw`text-[${colors.textPrimary}] text-2xl font-bold`}>Earnings</Text>
                <Text style={tw`text-[${colors.textSecondary}] text-sm mt-0.5`}>
                    Your delivery income and stats at a glance
                </Text>
            </View>

            <EarningsHero
                todayEarnings={todayEarnings}
                todayDeliveries={todayDeliveries.length}
            />

            <PeriodSelector value={period} onChange={setPeriod} />

            <EarningsStats
                totalEarnings={totalEarnings}
                totalDeliveries={totalDeliveries}
                totalDistanceKm={totalDistanceKm}
            />

            <WeeklyBarChart deliveries={deliveries} />

            {/* Delivery history */}
            <View style={tw`mx-5`}>
                <Text style={tw`text-[${colors.textPrimary}] font-semibold mb-3`}>
                    Delivery History
                </Text>

                {filtered.length === 0 ? (
                    <View style={tw`items-center py-12`}>
                        <View style={tw`w-16 h-16 rounded-full bg-[${colors.surfaceElevated}] items-center justify-center mb-3`}>
                            <Ionicons name="wallet-outline" size={28} color={colors.textMuted} />
                        </View>
                        <Text style={tw`text-[${colors.textSecondary}] text-sm text-center`}>
                            No deliveries in this period yet
                        </Text>
                    </View>
                ) : (
                    <View style={[tw`rounded-2xl overflow-hidden`, { backgroundColor: colors.surfaceElevated }]}>
                        {filtered.map((order, idx) => (
                            <DeliveryRow
                                key={order.id}
                                order={order}
                                isLast={idx === filtered.length - 1}
                            />
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}