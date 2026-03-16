import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { OrderWithItems } from '../types/order.types';
import type { OrderStatus } from '../types/database.types';

interface Result {
    order: OrderWithItems | null;
    loading: boolean;
    setOrder: React.Dispatch<React.SetStateAction<OrderWithItems | null>>;
}

/**
 * Fetches an order by ID and subscribes to live status updates via Realtime.
 * Optionally accepts a cached order to skip the initial fetch.
 */
export function useOrder(orderId: string | undefined, cachedOrder?: OrderWithItems | null): Result {
    const [order, setOrder] = useState<OrderWithItems | null>(cachedOrder ?? null);
    const [loading, setLoading] = useState(!cachedOrder);

    // Initial fetch — skip if we already have a matching cached order
    useEffect(() => {
        if (!orderId) return;
        if (cachedOrder?.id === orderId) {
            setOrder(cachedOrder);
            setLoading(false);
            return;
        }

        (async () => {
            const { data, error } = await supabase
                .from('orders')
                .select(`*, order_items (*, menu_items (*)), restaurants (*)`)
                .eq('id', orderId)
                .single();

            if (!error && data) setOrder(data as OrderWithItems);
            setLoading(false);
        })();
    }, [orderId]);

    // Realtime: status + driver_id changes
    useEffect(() => {
        if (!orderId) return;

        const channel = supabase
            .channel(`order:${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    const updated = payload.new as { status: OrderStatus; driver_id: string | null };
                    setOrder((prev) =>
                        prev
                            ? { ...prev, status: updated.status, driver_id: updated.driver_id }
                            : prev
                    );
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [orderId]);

    return { order, loading, setOrder };
}