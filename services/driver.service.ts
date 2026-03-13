import { supabase } from './supabase';
import { OrderWithItems } from '../types/order.types';
import { DriverLocation } from '../types/driver.types';

// ─── Get pending orders (available for drivers to accept) ────────────────────
export async function getPendingOrders(): Promise<{
    data: OrderWithItems[];
    error: string | null;
}> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (*, menu_items (*)),
            restaurants (*)
        `)
        .eq('status', 'placed')
        .is('driver_id', null)
        .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data as OrderWithItems[], error: null };
}

// ─── Accept an order as a driver ─────────────────────────────────────────────
export async function acceptOrder(
    orderId: string,
    driverId: string
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('orders')
        .update({
            driver_id: driverId,
            status: 'confirmed',
            updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .is('driver_id', null); // prevent double-accept

    if (error) return { error: error.message };
    return { error: null };
}

// ─── Decline / ignore an order (no DB change needed, just UI) ────────────────
// Real decline logic could insert into a 'declined_orders' table if needed

// ─── Update order status as driver ───────────────────────────────────────────
export async function updateDeliveryStatus(
    orderId: string,
    status: 'picked_up' | 'on_the_way' | 'delivered'
): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

    if (error) return { error: error.message };
    return { error: null };
}

// ─── Upsert driver location ───────────────────────────────────────────────────
export async function upsertDriverLocation(
    driverId: string,
    lat: number,
    lng: number,
    isOnline: boolean = true
): Promise<{ error: string | null }> {
    const { data: existing } = await supabase
        .from('driver_locations')
        .select('id')
        .eq('driver_id', driverId)
        .single();

    if (existing) {
        const { error } = await supabase
            .from('driver_locations')
            .update({ lat, lng, is_online: isOnline, updated_at: new Date().toISOString() })
            .eq('driver_id', driverId);
        if (error) return { error: error.message };
    } else {
        const { error } = await supabase
            .from('driver_locations')
            .insert({ driver_id: driverId, lat, lng, is_online: isOnline });
        if (error) return { error: error.message };
    }

    return { error: null };
}

// ─── Get driver's active delivery ────────────────────────────────────────────
export async function getActiveDelivery(
    driverId: string
): Promise<{ data: OrderWithItems | null; error: string | null }> {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (*, menu_items (*)),
            restaurants (*)
        `)
        .eq('driver_id', driverId)
        .in('status', ['confirmed', 'preparing', 'picked_up', 'on_the_way'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) return { data: null, error: error.message };
    return { data: data as OrderWithItems, error: null };
}

// ─── Get driver earnings ──────────────────────────────────────────────────────
export async function getDriverEarnings(
    driverId: string
): Promise<{ total: number; today: number; error: string | null }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('orders')
        .select('delivery_fee, created_at')
        .eq('driver_id', driverId)
        .eq('status', 'delivered');

    if (error) return { total: 0, today: 0, error: error.message };

    const total = data.reduce((sum, o) => sum + o.delivery_fee, 0);
    const today = data
        .filter((o) => new Date(o.created_at) >= todayStart)
        .reduce((sum, o) => sum + o.delivery_fee, 0);

    return { total, today, error: null };
}