import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getPendingOrders, declineOrder } from '../services/driver.service';
import type { OrderWithItems } from '../types/order.types';

interface Result {
    orders: OrderWithItems[];
    loading: boolean;
    refreshing: boolean;
    refresh: () => Promise<void>;
    decline: (orderId: string) => void;
}

/**
 * Fetches pending orders (placed, no driver) and subscribes to Realtime.
 * Decline is persisted to Supabase so it survives logout/login.
 * declinedIdsRef is kept as an optimistic local filter so the card
 * disappears instantly before the DB write completes.
 */
export function useDriver(driverId?: string): Result {
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Optimistic local set — cleared on remount (login) since DB is source of truth
    const declinedIdsRef = useRef<Set<string>>(new Set());

    const fetchOrders = useCallback(async () => {
        // Pass driverId so getPendingOrders can filter out DB-persisted declines
        const { data } = await getPendingOrders(driverId);
        // Also filter optimistic local declines (covers the gap before DB write)
        setOrders(data.filter((o) => !declinedIdsRef.current.has(o.id)));
    }, [driverId]);

    useEffect(() => {
        fetchOrders().finally(() => setLoading(false));
    }, [fetchOrders]);

    // Realtime: new or updated orders
    useEffect(() => {
        const channel = supabase
            .channel('pending_orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => fetchOrders())
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => fetchOrders())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchOrders]);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    }, [fetchOrders]);

    const decline = useCallback((orderId: string) => {
        // 1. Remove from UI immediately (optimistic)
        declinedIdsRef.current.add(orderId);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));

        // 2. Persist to Supabase in background (survives logout)
        if (driverId) {
            declineOrder(orderId, driverId).catch((err) =>
                console.error('[useDriver] declineOrder error:', err)
            );
        }
    }, [driverId]);

    return { orders, loading, refreshing, refresh, decline };
}