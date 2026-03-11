import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

import colors from '../../constants/colors';
import type { OrderStatus } from '../../types/database.types';

export const STATUS_COLOR: Record<OrderStatus, string> = {
    placed:     colors.statusPlaced,
    confirmed:  colors.statusConfirmed,
    preparing:  colors.statusPreparing,
    picked_up:  colors.statusPickedUp,
    on_the_way: colors.statusOnTheWay,
    delivered:  colors.statusDelivered,
    cancelled:  colors.statusCancelled,
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
    placed:     'Order Placed',
    confirmed:  'Confirmed',
    preparing:  'Preparing',
    picked_up:  'Picked Up',
    on_the_way: 'On the Way',
    delivered:  'Delivered',
    cancelled:  'Cancelled',
};

export const STATUS_ICON: Record<OrderStatus, string> = {
    placed:     'receipt-outline',
    confirmed:  'checkmark-circle-outline',
    preparing:  'restaurant-outline',
    picked_up:  'bag-handle-outline',
    on_the_way: 'bicycle-outline',
    delivered:  'home-outline',
    cancelled:  'close-circle-outline',
};

interface Props {
    status: OrderStatus;
}

export default function OrderStatusBadge({ status }: Props) {
    const color = STATUS_COLOR[status];
    return (
        <View
            style={[
                tw`flex-row items-center gap-1 px-2.5 py-1 rounded-full`,
                { backgroundColor: `${color}22` },
            ]}
        >
            <Ionicons name={STATUS_ICON[status] as any} size={12} color={color} />
            <Text style={[tw`text-xs font-semibold`, { color }]}>
                {STATUS_LABEL[status]}
            </Text>
        </View>
    );
}