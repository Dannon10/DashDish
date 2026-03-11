import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { Profile } from '../types/auth.types';

interface AuthState {
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    isInitialized: boolean;

    // Actions
    setSession: (session: Session | null) => void;
    setProfile: (profile: Profile | null) => void;
    setLoading: (loading: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    clearAuth: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
    // Initial state
    session: null,
    profile: null,
    isLoading: false,
    isInitialized: false,

    // Actions
    setSession: (session) => set({ session }),
    setProfile: (profile) => set({ profile }),
    setLoading: (isLoading) => set({ isLoading }),
    setInitialized: (isInitialized) => set({ isInitialized }),
    clearAuth: () => set({
        session: null,
        profile: null,
        isLoading: false,
    }),
}));

export default useAuthStore;