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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function interpolate(from: Coords, to: Coords, t: number): Coords {
    return {
        lat: from.lat + (to.lat - from.lat) * t,
        lng: from.lng + (to.lng - from.lng) * t,
    };
}

function jitter(coords: Coords, amount = 0.003): Coords {
    return {
        lat: coords.lat + (Math.random() - 0.5) * amount,
        lng: coords.lng + (Math.random() - 0.5) * amount,
    };
}

function sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}

async function updateDriverLocation(driverId: string, coords: Coords) {
    await supabase
        .from('driver_locations')
        .update({ lat: coords.lat, lng: coords.lng, updated_at: new Date().toISOString() })
        .eq('driver_id', driverId);
}

async function updateOrderStatus(orderId: string, status: OrderStatus) {
    await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
}

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
        const coords = interpolate(from, to, i / steps);
        await updateDriverLocation(driverId, coords);
        onLocationUpdate?.(coords);
        await sleep(intervalMs);
    }
}

// Returns true if no real driver has accepted yet
async function isOrderStillUnassigned(orderId: string): Promise<boolean> {
    const { data } = await supabase
        .from('orders')
        .select('driver_id')
        .eq('id', orderId)
        .maybeSingle();
    return !data?.driver_id;
}

// ─── Main simulation ──────────────────────────────────────────────────────────
/**
 * Simulates the full delivery lifecycle.
 * IMPORTANT: Does NOT assign driver_id immediately on call.
 * Call this inside a setTimeout from payment.tsx to give the driver
 * a window to accept the order first.
 * Only assigns driver_id + confirms if order is still unassigned when it runs.
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
            // Guard: bail if a real driver already accepted
            const stillUnassigned = await isOrderStillUnassigned(orderId);
            if (!stillUnassigned || cancelled()) return;

            // Assign simulated driver + set confirmed in one atomic update
            // .is('driver_id', null) ensures we don't overwrite a real driver
            await supabase
                .from('orders')
                .update({
                    driver_id: driverId,
                    status: 'confirmed',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId)
                .is('driver_id', null);

            onStatusChange?.('confirmed');

            // Phase 2: preparing
            await sleep(5000);
            if (cancelled()) return;
            await updateOrderStatus(orderId, 'preparing');
            onStatusChange?.('preparing');

            // Phase 3: driver moves toward restaurant
            const driverStart = jitter(restaurantCoords, 0.008);
            await updateDriverLocation(driverId, driverStart);
            onLocationUpdate?.(driverStart);

            await animatePath(
                driverId,
                driverStart,
                restaurantCoords,
                12,
                1500,
                onLocationUpdate,
                cancelled
            );
            if (cancelled()) return;

            // Phase 4: picked_up
            await updateOrderStatus(orderId, 'picked_up');
            onStatusChange?.('picked_up');
            await sleep(1500);
            if (cancelled()) return;

            // Phase 5: on_the_way
            await updateOrderStatus(orderId, 'on_the_way');
            onStatusChange?.('on_the_way');

            await animatePath(
                driverId,
                restaurantCoords,
                deliveryCoords,
                20,
                2000,
                onLocationUpdate,
                cancelled
            );
            if (cancelled()) return;

            // Phase 6: delivered
            await updateOrderStatus(orderId, 'delivered');
            onStatusChange?.('delivered');

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
    return () => { isCancelled = true; };
}

// ─── Ensure simulated driver row exists ───────────────────────────────────────
export async function ensureSimulatedDriver(
    driverId: string,
    startCoords: Coords
): Promise<void> {
    const { data } = await supabase
        .from('driver_locations')
        .select('id')
        .eq('driver_id', driverId)
        .maybeSingle();

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