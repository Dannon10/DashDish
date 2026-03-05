import { create } from 'zustand';
import { CartItem } from '../types/order.types';
import { MenuItem } from '../types/restaurant.types';

interface CartState {
    items: CartItem[];
    restaurantId: string | null;
    restaurantName: string | null;

    // Actions
    addItem: (
        menuItem: MenuItem, 
        restaurantId: string, 
        restaurantName: string) 
        => void;
    removeItem: (menuItemId: string) => void;
    incrementItem: (menuItemId: string) => void;
    decrementItem: (menuItemId: string) => void;
    clearCart: () => void;

    // Computed helpers
    getTotalItems: () => number;
    getTotalPrice: () => number;
    getItemQuantity: (menuItemId: string) => number;
}

const useCartStore = create<CartState>((set, get) => ({
    // Initial state
    items: [],
    restaurantId: null,
    restaurantName: null,

    // Add item — if from different restaurant, clear cart first
    addItem: (menuItem, restaurantId, restaurantName) => {
        const { items, restaurantId: currentRestaurantId } = get();

        // If adding from a different restaurant, start fresh
        if (currentRestaurantId && currentRestaurantId !== restaurantId) {
            set({
                items: [{ menuItem, quantity: 1 }],
                restaurantId,
                restaurantName,
            });
            return;
        }

        // If item already in cart, increment quantity
        const existingItem = items.find(i => i.menuItem.id === menuItem.id);
        if (existingItem) {
            set({
                items: items.map(i =>
                    i.menuItem.id === menuItem.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                ),
            });
            return;
        }

        // New item from same restaurant
        set({
            items: [...items, { menuItem, quantity: 1 }],
            restaurantId,
            restaurantName,
        });
    },

    removeItem: (menuItemId) => {
        const { items } = get();
        const updated = items.filter(i => i.menuItem.id !== menuItemId);
        set({
            items: updated,
            restaurantId: updated.length === 0 ? null : get().restaurantId,
            restaurantName: updated.length === 0 ? null : get().restaurantName,
        });
    },

    incrementItem: (menuItemId) => {
        set({
            items: get().items.map(i =>
                i.menuItem.id === menuItemId
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
            ),
        });
    },

    decrementItem: (menuItemId) => {
        const { items } = get();
        const item = items.find(i => i.menuItem.id === menuItemId);
        if (!item) return;

        // If quantity is 1, remove the item entirely
        if (item.quantity === 1) {
            get().removeItem(menuItemId);
            return;
        }

        set({
            items: items.map(i =>
                i.menuItem.id === menuItemId
                    ? { ...i, quantity: i.quantity - 1 }
                    : i
            ),
        });
    },

    clearCart: () => set({
        items: [],
        restaurantId: null,
        restaurantName: null,
    }),

    // Computed helpers — these use get() to read current state
    getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
    },

    getTotalPrice: () => {
        return get().items.reduce(
            (sum, item) => sum + item.menuItem.price * item.quantity,
            0
        );
    },

    getItemQuantity: (menuItemId) => {
        const item = get().items.find(i => i.menuItem.id === menuItemId);
        return item?.quantity ?? 0;
    },
}));

export default useCartStore;