import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

import OrderStatusBadge from './OrderStatusBadge';
import colors from '../../constants/colors';
import type { OrderWithItems } from '../../types/order.types';

interface Props {
    order: OrderWithItems;
    onPress: () => void;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function OrderCard({ order, onPress }: Props) {
    const itemNames = order.order_items
        ?.slice(0, 2)
        .map((i) => i.menu_items?.name)
        .filter(Boolean)
        .join(', ');
    const extraCount = (order.order_items?.length ?? 0) - 2;

    return (
        <TouchableOpacity
            onPress={onPress}
            style={tw`mx-5 mb-3 p-4 rounded-2xl bg-[${colors.surface}] flex-row items-center gap-3`}
            activeOpacity={0.8}
        >
            {/* Restaurant image */}
            {order.restaurants?.image_url ? (
                <Image
                    source={{ uri: order.restaurants.image_url }}
                    style={tw`w-14 h-14 rounded-xl`}
                />
            ) : (
                <View
                    style={tw`w-14 h-14 rounded-xl bg-[${colors.surfaceElevated}] items-center justify-center`}
                >
                    <Ionicons name="restaurant" size={24} color={colors.textMuted} />
                </View>
            )}

            {/* Info */}
            <View style={tw`flex-1`}>
                <View style={tw`flex-row items-center justify-between mb-1`}>
                    <Text
                        style={tw`text-[${colors.textPrimary}] font-semibold text-sm flex-1 mr-2`}
                        numberOfLines={1}
                    >
                        {order.restaurants?.name}
                    </Text>
                    <OrderStatusBadge status={order.status} />
                </View>
                <Text style={tw`text-[${colors.textSecondary}] text-xs`} numberOfLines={1}>
                    {itemNames}
                    {extraCount > 0 ? ` +${extraCount} more` : ''}
                </Text>
                <View style={tw`flex-row items-center justify-between mt-1.5`}>
                    <Text style={tw`text-[${colors.textMuted}] text-xs`}>
                        {formatDate(order.created_at)}
                    </Text>
                    <Text style={tw`text-[${colors.textPrimary}] text-xs font-semibold`}>
                        ₦{order.total_amount.toLocaleString()}
                    </Text>
                </View>
            </View>

            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
    );
}