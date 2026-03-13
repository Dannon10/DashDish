import { create } from 'zustand';
import { CartItem } from '../types/order.types';
import { MenuItem } from '../types/restaurant.types';

interface CartState {
    items: CartItem[];
    restaurantId: string | null;
    restaurantName: string | null;
    restaurantLat: number | null;
    restaurantLng: number | null;

    // Actions
    addItem: (
        menuItem: MenuItem,
        restaurantId: string,
        restaurantName: string,
        restaurantLat: number,
        restaurantLng: number,
    ) => void;
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
    items: [],
    restaurantId: null,
    restaurantName: null,
    restaurantLat: null,
    restaurantLng: null,

    addItem: (menuItem, restaurantId, restaurantName, restaurantLat, restaurantLng) => {
        const { items, restaurantId: currentRestaurantId } = get();

        // Different restaurant — clear cart and start fresh
        if (currentRestaurantId && currentRestaurantId !== restaurantId) {
            set({
                items: [{ menuItem, quantity: 1 }],
                restaurantId,
                restaurantName,
                restaurantLat,
                restaurantLng,
            });
            return;
        }

        // Same item already in cart — increment
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
            restaurantLat,
            restaurantLng,
        });
    },

    removeItem: (menuItemId) => {
        const { items } = get();
        const updated = items.filter(i => i.menuItem.id !== menuItemId);
        set({
            items: updated,
            restaurantId: updated.length === 0 ? null : get().restaurantId,
            restaurantName: updated.length === 0 ? null : get().restaurantName,
            restaurantLat: updated.length === 0 ? null : get().restaurantLat,
            restaurantLng: updated.length === 0 ? null : get().restaurantLng,
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
        restaurantLat: null,
        restaurantLng: null,
    }),

    getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

    getTotalPrice: () =>
        get().items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),

    getItemQuantity: (menuItemId) => {
        const item = get().items.find(i => i.menuItem.id === menuItemId);
        return item?.quantity ?? 0;
    },
}));

export default useCartStore;