import { OrderStatus } from '../types/database.types';
import colors from '../constants/colors';

interface StatusConfig {
    label: string;
    color: string;
    description: string;
}

const getOrderStatus = (status: OrderStatus): StatusConfig => {
    const statusMap: Record<OrderStatus, StatusConfig> = {
        placed: {
            label: 'Order Placed',
            color: colors.statusPlaced,
            description: 'Your order has been placed',
        },
        confirmed: {
            label: 'Confirmed',
            color: colors.statusConfirmed,
            description: 'Restaurant confirmed your order',
        },
        preparing: {
            label: 'Preparing',
            color: colors.statusPreparing,
            description: 'Your food is being prepared',
        },
        picked_up: {
            label: 'Picked Up',
            color: colors.statusPickedUp,
            description: 'Driver has picked up your order',
        },
        on_the_way: {
            label: 'On The Way',
            color: colors.statusOnTheWay,
            description: 'Your order is on the way',
        },
        delivered: {
            label: 'Delivered',
            color: colors.statusDelivered,
            description: 'Your order has been delivered',
        },
        cancelled: {
            label: 'Cancelled',
            color: colors.statusCancelled,
            description: 'Your order was cancelled',
        },
    };

    return statusMap[status];
};

export default getOrderStatus;