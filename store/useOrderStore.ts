import { create } from 'zustand';
import { Order, OrderWithItems } from '../types/order.types';

interface OrderState {
    activeOrder: OrderWithItems | null;
    orders: Order[];
    isLoadingOrders: boolean;

    // Actions
    setActiveOrder: (order: OrderWithItems | null) => void;
    updateActiveOrderStatus: (status: Order['status']) => void;
    setOrders: (orders: Order[]) => void;
    setLoadingOrders: (loading: boolean) => void;
    clearActiveOrder: () => void;
}

const useOrderStore = create<OrderState>((set, get) => ({
    activeOrder: null,
    orders: [],
    isLoadingOrders: false,

    setActiveOrder: (activeOrder) => set({ activeOrder }),

    // Update just the status on the active order without refetching
    updateActiveOrderStatus: (status) => {
        const { activeOrder } = get();
        if (!activeOrder) return;
        set({
            activeOrder: { ...activeOrder, status },
        });
    },

    setOrders: (orders) => set({ orders }),
    setLoadingOrders: (isLoadingOrders) => set({ isLoadingOrders }),
    clearActiveOrder: () => set({ activeOrder: null }),
}));

export default useOrderStore;