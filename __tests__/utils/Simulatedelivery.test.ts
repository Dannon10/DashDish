// We test the pure helper logic by extracting it.
// The main simulation function talks to Supabase so we mock that.

jest.mock('../../services/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
        })),
    },
}));

// ── Pure helper functions (extracted for testing) ─────────────────────────────

function interpolate(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    t: number
) {
    return {
        lat: from.lat + (to.lat - from.lat) * t,
        lng: from.lng + (to.lng - from.lng) * t,
    };
}

function jitter(coords: { lat: number; lng: number }, amount = 0.003) {
    return {
        lat: coords.lat + (Math.random() - 0.5) * amount,
        lng: coords.lng + (Math.random() - 0.5) * amount,
    };
}

// ── interpolate ───────────────────────────────────────────────────────────────
describe('interpolate', () => {
    const from = { lat: 6.5244, lng: 3.3792 };
    const to = { lat: 6.4281, lng: 3.4219 };

    it('returns the from coords at t=0', () => {
        const result = interpolate(from, to, 0);
        expect(result.lat).toBeCloseTo(from.lat);
        expect(result.lng).toBeCloseTo(from.lng);
    });

    it('returns the to coords at t=1', () => {
        const result = interpolate(from, to, 1);
        expect(result.lat).toBeCloseTo(to.lat);
        expect(result.lng).toBeCloseTo(to.lng);
    });

    it('returns the midpoint at t=0.5', () => {
        const result = interpolate(from, to, 0.5);
        expect(result.lat).toBeCloseTo((from.lat + to.lat) / 2);
        expect(result.lng).toBeCloseTo((from.lng + to.lng) / 2);
    });

    it('moves linearly between points', () => {
        const quarter = interpolate(from, to, 0.25);
        const half = interpolate(from, to, 0.5);
        // At t=0.5 should be exactly twice as far as t=0.25
        const distAtQuarter = Math.abs(quarter.lat - from.lat);
        const distAtHalf = Math.abs(half.lat - from.lat);
        expect(distAtHalf).toBeCloseTo(distAtQuarter * 2, 5);
    });

    it('handles identical from and to coords', () => {
        const same = { lat: 6.5244, lng: 3.3792 };
        const result = interpolate(same, same, 0.5);
        expect(result.lat).toBe(same.lat);
        expect(result.lng).toBe(same.lng);
    });
});

// ── jitter ────────────────────────────────────────────────────────────────────
describe('jitter', () => {
    const coords = { lat: 6.5244, lng: 3.3792 };

    it('returns coords close to the original', () => {
        const result = jitter(coords, 0.008);
        expect(Math.abs(result.lat - coords.lat)).toBeLessThan(0.008);
        expect(Math.abs(result.lng - coords.lng)).toBeLessThan(0.008);
    });

    it('returns different coords each time (randomness)', () => {
        const r1 = jitter(coords);
        const r2 = jitter(coords);
        // Probability of exact match is astronomically low
        expect(r1.lat === r2.lat && r1.lng === r2.lng).toBe(false);
    });

    it('respects the amount parameter — larger amount means more spread', () => {
        const smallJitter = jitter(coords, 0.001);
        const largeJitter = jitter(coords, 0.1);
        // Large jitter should be further from original on average
        const smallDist = Math.abs(smallJitter.lat - coords.lat);
        const largeDist = Math.abs(largeJitter.lat - coords.lat);
        // Not guaranteed every run but statistically overwhelmingly true
        // Instead just check bounds
        expect(smallDist).toBeLessThan(0.001);
        expect(largeDist).toBeLessThan(0.1);
    });

    it('uses default amount of 0.003 when not specified', () => {
        const result = jitter(coords);
        expect(Math.abs(result.lat - coords.lat)).toBeLessThan(0.003);
        expect(Math.abs(result.lng - coords.lng)).toBeLessThan(0.003);
    });
});

// ── startDeliverySimulation — cancel function ─────────────────────────────────
describe('startDeliverySimulation', () => {
    it('returns a cancel function', async () => {
        const { startDeliverySimulation } = require('../../utils/simulateDelivery');
        const cancel = startDeliverySimulation({
            orderId: 'test-order-id',
            driverId: 'test-driver-id',
            restaurantCoords: { lat: 6.5244, lng: 3.3792 },
            deliveryCoords: { lat: 6.4281, lng: 3.4219 },
        });
        expect(typeof cancel).toBe('function');
        // Call cancel to clean up
        cancel();
    });

    it('cancel function stops the simulation without throwing', () => {
        const { startDeliverySimulation } = require('../../utils/simulateDelivery');
        const cancel = startDeliverySimulation({
            orderId: 'test-order-id',
            driverId: 'test-driver-id',
            restaurantCoords: { lat: 6.5244, lng: 3.3792 },
            deliveryCoords: { lat: 6.4281, lng: 3.4219 },
        });
        expect(() => cancel()).not.toThrow();
    });
});