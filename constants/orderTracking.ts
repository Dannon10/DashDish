import { Dimensions } from 'react-native';
import colors from '../constants/colors';
import type { OrderStatus } from '../types/database.types';

export const SIMULATED_DRIVER_ID = '9b1a9bee-6fca-4384-967d-1907e2bfc29d';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
export const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.65;
export const COLLAPSED_HEIGHT = SCREEN_HEIGHT * 0.22;

export const STATUS_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
    { key: 'placed',     label: 'Order Placed', icon: 'receipt-outline' },
    { key: 'confirmed',  label: 'Confirmed',    icon: 'checkmark-circle-outline' },
    { key: 'preparing',  label: 'Preparing',    icon: 'restaurant-outline' },
    { key: 'picked_up',  label: 'Picked Up',    icon: 'bag-handle-outline' },
    { key: 'on_the_way', label: 'On the Way',   icon: 'bicycle-outline' },
    { key: 'delivered',  label: 'Delivered',    icon: 'home-outline' },
];

export const STATUS_COLOR: Record<OrderStatus, string> = {
    placed:     colors.statusPlaced,
    confirmed:  colors.statusConfirmed,
    preparing:  colors.statusPreparing,
    picked_up:  colors.statusPickedUp,
    on_the_way: colors.statusOnTheWay,
    delivered:  colors.statusDelivered,
    cancelled:  colors.statusCancelled,
};

export function stepIndex(status: OrderStatus): number {
    const idx = STATUS_STEPS.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
}