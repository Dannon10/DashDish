import React from 'react';
import { View } from 'react-native';
import { Text } from '../../../components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import colors from '../../../constants/colors';
import { haversineKm } from './haversine';
import type { OrderWithItems } from '../../../types/order.types';

interface Props {
    order: OrderWithItems;
    isLast?: boolean;
}

export default function DeliveryRow({ order, isLast = false }: Props) {
    const date = new Date(order.created_at);
    const dateStr = date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
    const timeStr = date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

    const distanceKm = order.restaurants
        ? haversineKm(
            order.restaurants.lat,
            order.restaurants.lng,
            order.delivery_lat,
            order.delivery_lng
        ).toFixed(1)
        : '—';

    return (
        <View
            style={[
                tw`flex-row items-center px-4 py-3.5`,
                !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
        >
            <View style={tw`w-8 h-8 rounded-full bg-[${colors.success}22] items-center justify-center mr-3`}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            </View>

            <View style={tw`flex-1`}>
                <Text weight='semiBold' style={tw`text-[${colors.textPrimary}] text-sm`} numberOfLines={1}>
                    {order.restaurants?.name ?? 'Restaurant'}
                </Text>
                <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`} numberOfLines={1}>
                    {order.delivery_address}
                </Text>
                <View style={tw`flex-row items-center gap-3 mt-1`}>
                    <Text style={tw`text-[${colors.textMuted}] text-[10px]`}>
                        {dateStr} • {timeStr}
                    </Text>
                    <View style={tw`flex-row items-center gap-0.5`}>
                        <Ionicons name="navigate-outline" size={10} color={colors.textMuted} />
                        <Text style={tw`text-[${colors.textMuted}] text-[10px]`}>
                            {distanceKm} km
                        </Text>
                    </View>
                </View>
            </View>

            <Text weight='bold' style={[tw`text-sm ml-2`, { color: colors.success }]}>
                +₦{order.delivery_fee.toLocaleString()}
            </Text>
        </View>
    );
}