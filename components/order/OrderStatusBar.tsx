import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

import OrderStatusBadge, { STATUS_COLOR } from './OrderStatusBadge';
import colors from '../../constants/colors';
import type { OrderWithItems } from '../../types/order.types';

interface Props {
    order: OrderWithItems;
    onPress: () => void;
}

export default function OrderStatusBar({ order, onPress }: Props) {
    const color = STATUS_COLOR[order.status];

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                tw`mx-5 mb-4 rounded-2xl overflow-hidden`,
                { borderWidth: 1, borderColor: `${color}44` },
            ]}
            activeOpacity={0.85}
        >
            {/* Colored top bar */}
            <View style={[tw`h-1 w-full`, { backgroundColor: color }]} />

            <View style={tw`p-4 bg-[${colors.surfaceElevated}]`}>
                {/* Header row */}
                <View style={tw`flex-row items-center justify-between mb-3`}>
                    <View style={tw`flex-row items-center gap-2`}>
                        <View
                            style={[
                                tw`w-8 h-8 rounded-full items-center justify-center`,
                                { backgroundColor: `${color}22` },
                            ]}
                        >
                            <Ionicons name="time-outline" size={16} color={color} />
                        </View>
                        <Text style={tw`text-[${colors.textPrimary}] font-bold text-sm`}>
                            Active Order
                        </Text>
                    </View>
                    <OrderStatusBadge status={order.status} />
                </View>

                {/* Restaurant info */}
                <View style={tw`flex-row items-center gap-3 mb-3`}>
                    {order.restaurants?.image_url ? (
                        <Image
                            source={{ uri: order.restaurants.image_url }}
                            style={tw`w-12 h-12 rounded-xl`}
                        />
                    ) : (
                        <View
                            style={tw`w-12 h-12 rounded-xl bg-[${colors.border}] items-center justify-center`}
                        >
                            <Ionicons name="restaurant" size={22} color={colors.textMuted} />
                        </View>
                    )}
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-[${colors.textPrimary}] font-semibold text-base`}>
                            {order.restaurants?.name}
                        </Text>
                        <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`}>
                            {order.order_items?.length} item
                            {order.order_items?.length !== 1 ? 's' : ''} •{' '}
                            ₦{order.total_amount.toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* Track button row */}
                <View
                    style={[
                        tw`flex-row items-center justify-between pt-3`,
                        { borderTopWidth: 1, borderTopColor: colors.border },
                    ]}
                >
                    <Text
                        style={tw`text-[${colors.textSecondary}] text-xs flex-1 mr-3`}
                        numberOfLines={1}
                    >
                        {order.delivery_address}
                    </Text>
                    <View
                        style={[
                            tw`flex-row items-center gap-1 px-3 py-1.5 rounded-full`,
                            { backgroundColor: color },
                        ]}
                    >
                        <Text style={tw`text-white text-xs font-bold`}>Track</Text>
                        <Ionicons name="arrow-forward" size={12} color="white" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}