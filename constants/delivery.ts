import colors from '../constants/colors';
import type { OrderStatus } from '../types/database.types';

export const NEXT_STATUS: Partial<Record<
    OrderStatus,
    { status: 'picked_up' | 'on_the_way' | 'delivered'; label: string; icon: string; color: string }
>> = {
    confirmed:  { status: 'picked_up',  label: 'Mark as Picked Up', icon: 'bag-handle-outline',       color: colors.statusPickedUp },
    preparing:  { status: 'picked_up',  label: 'Mark as Picked Up', icon: 'bag-handle-outline',       color: colors.statusPickedUp },
    picked_up:  { status: 'on_the_way', label: 'Start Delivery',    icon: 'bicycle-outline',          color: colors.statusOnTheWay },
    on_the_way: { status: 'delivered',  label: 'Mark as Delivered', icon: 'checkmark-circle-outline', color: colors.statusDelivered },
};

export const STATUS_COLOR: Partial<Record<OrderStatus, string>> = {
    confirmed:  colors.statusConfirmed,
    preparing:  colors.statusPreparing,
    picked_up:  colors.statusPickedUp,
    on_the_way: colors.statusOnTheWay,
    delivered:  colors.statusDelivered,
};