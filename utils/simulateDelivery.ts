import { supabase } from '../services/supabase';
import { OrderStatus } from '../types/database.types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Coords {
    lat: number;
    lng: number;
}

interface SimulationOptions {
    orderId: string;
    driverId: string;
    restaurantCoords: Coords;
    deliveryCoords: Coords;
    onStatusChange?: (status: OrderStatus) => void;
    onLocationUpdate?: (coords: Coords) => void;
    onComplete?: () => void;
}

// ─── Helpers

// Interpolate between two coords by fraction t (0→1)
function interpolate(from: Coords, to: Coords, t: number): Coords {
    return {
        lat: from.lat + (to.lat - from.lat) * t,
        lng: from.lng + (to.lng - from.lng) * t,
    };
}

// Small random offset so simulated driver doesn't start exactly on restaurant
function jitter(coords: Coords, amount = 0.003): Coords {
    return {
        lat: coords.lat + (Math.random() - 0.5) * amount,
        lng: coords.lng + (Math.random() - 0.5) * amount,
    };
}

function sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}

// ─── Update driver location in Supabase ──────────────────────────────────────
async function updateDriverLocation(driverId: string, coords: Coords) {
    await supabase
        .from('driver_locations')
        .update({ lat: coords.lat, lng: coords.lng, updated_at: new Date().toISOString() })
        .eq('driver_id', driverId);
}

// ─── Update order status in Supabase ─────────────────────────────────────────
async function updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    driverId?: string
) {
    const updates: any = { status, updated_at: new Date().toISOString() };
    if (driverId) updates.driver_id = driverId;
    await supabase.from('orders').update(updates).eq('id', orderId);
}

// ─── Move driver along a path ─────────────────────────────────────────────────
async function animatePath(
    driverId: string,
    from: Coords,
    to: Coords,
    steps: number,
    intervalMs: number,
    onLocationUpdate?: (coords: Coords) => void,
    cancelled?: () => boolean
) {
    for (let i = 1; i <= steps; i++) {
        if (cancelled?.()) return;
        const t = i / steps;
        const coords = interpolate(from, to, t);
        await updateDriverLocation(driverId, coords);
        onLocationUpdate?.(coords);
        await sleep(intervalMs);
    }
}

// ─── Main simulation ──────────────────────────────────────────────────────────
/**
 * Simulates the full delivery lifecycle:
 * placed → confirmed → preparing → picked_up → on_the_way → delivered
 *
 * Returns a cancel function — call it to abort the simulation early
 * (e.g. when a real driver accepts the order instead).
 */
export function startDeliverySimulation(options: SimulationOptions): () => void {
    const {
        orderId,
        driverId,
        restaurantCoords,
        deliveryCoords,
        onStatusChange,
        onLocationUpdate,
        onComplete,
    } = options;

    let isCancelled = false;
    const cancelled = () => isCancelled;

    async function run() {
        try {
            // ── Phase 1: confirmed (2s after placed) ──────────────────────────
            await sleep(2000);
            if (cancelled()) return;
            await updateOrderStatus(orderId, 'confirmed', driverId);
            onStatusChange?.('confirmed');

            // ── Phase 2: preparing (restaurant is cooking — 5s) ───────────────
            await sleep(5000);
            if (cancelled()) return;
            await updateOrderStatus(orderId, 'preparing');
            onStatusChange?.('preparing');

            // ── Phase 3: driver moves toward restaurant ───────────────────────
            const driverStart = jitter(restaurantCoords, 0.008);
            await updateDriverLocation(driverId, driverStart);
            onLocationUpdate?.(driverStart);

            await animatePath(
                driverId,
                driverStart,
                restaurantCoords,
                12,       // steps
                1500,     // ms per step (~18s total)
                onLocationUpdate,
                cancelled
            );
            if (cancelled()) return;

            // ── Phase 4: picked_up ────────────────────────────────────────────
            await updateOrderStatus(orderId, 'picked_up');
            onStatusChange?.('picked_up');
            await sleep(1500);
            if (cancelled()) return;

            // ── Phase 5: on_the_way — driver moves to delivery address ────────
            await updateOrderStatus(orderId, 'on_the_way');
            onStatusChange?.('on_the_way');

            await animatePath(
                driverId,
                restaurantCoords,
                deliveryCoords,
                20,       // steps
                2000,     // ms per step (~40s total)
                onLocationUpdate,
                cancelled
            );
            if (cancelled()) return;

            // ── Phase 6: delivered ────────────────────────────────────────────
            await updateOrderStatus(orderId, 'delivered');
            onStatusChange?.('delivered');

            // Mark driver back online/available
            await supabase
                .from('driver_locations')
                .update({ is_online: true })
                .eq('driver_id', driverId);

            onComplete?.();
        } catch (err) {
            console.error('[simulation] error:', err);
        }
    }

    run();

    return () => {
        isCancelled = true;
    };
}

// ─── Ensure simulated driver exists in driver_locations ──────────────────────
/**
 * Call this when an order is placed to make sure the simulated
 * driver has a row in driver_locations to update.
 */
export async function ensureSimulatedDriver(
    driverId: string,
    startCoords: Coords
): Promise<void> {
    const { data } = await supabase
        .from('driver_locations')
        .select('id')
        .eq('driver_id', driverId)
        .single();

    if (!data) {
        await supabase.from('driver_locations').insert({
            driver_id: driverId,
            lat: startCoords.lat,
            lng: startCoords.lng,
            is_online: true,
        });
    } else {
        await supabase
            .from('driver_locations')
            .update({ lat: startCoords.lat, lng: startCoords.lng, is_online: true })
            .eq('driver_id', driverId);
    }
}