import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getPendingOrders } from '../services/driver.service';
import type { OrderWithItems } from '../types/order.types';

interface Result {
    orders: OrderWithItems[];
    loading: boolean;
    refreshing: boolean;
    refresh: () => Promise<void>;
    decline: (orderId: string) => void;
}

/**
 * Fetches pending orders (placed, no driver) and subscribes to Realtime
 * for instant updates. Tracks declined order IDs in memory so they stay
 * hidden even after a refetch.
 */
export function useDriver(): Result {
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const declinedIdsRef = useRef<Set<string>>(new Set());

    const fetchOrders = useCallback(async () => {
        const { data } = await getPendingOrders();
        setOrders(data.filter((o) => !declinedIdsRef.current.has(o.id)));
    }, []);

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
        declinedIdsRef.current.add(orderId);
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
    }, []);

    return { orders, loading, refreshing, refresh, decline };
}