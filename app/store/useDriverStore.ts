import { create } from 'zustand';
import { DriverLocation } from '../types/driver.types';
import { OrderWithItems } from '../types/order.types';

interface DriverState {
    isOnline: boolean;
    currentLocation: { lat: number; lng: number } | null;
    incomingOrder: OrderWithItems | null;
    activeDelivery: OrderWithItems | null;
    earnings: number;

    // Actions
    setOnline: (online: boolean) => void;
    setCurrentLocation: (location: { lat: number; lng: number }) => void;
    setIncomingOrder: (order: OrderWithItems | null) => void;
    setActiveDelivery: (order: OrderWithItems | null) => void;
    setEarnings: (earnings: number) => void;
    clearDelivery: () => void;
}

const useDriverStore = create<DriverState>((set) => ({
    isOnline: false,
    currentLocation: null,
    incomingOrder: null,
    activeDelivery: null,
    earnings: 0,

    setOnline: (isOnline) => set({ isOnline }),
    setCurrentLocation: (currentLocation) => set({ currentLocation }),
    setIncomingOrder: (incomingOrder) => set({ incomingOrder }),
    setActiveDelivery: (activeDelivery) => set({ activeDelivery }),
    setEarnings: (earnings) => set({ earnings }),

    clearDelivery: () => set({
        incomingOrder: null,
        activeDelivery: null,
    }),
}));

export default useDriverStore;