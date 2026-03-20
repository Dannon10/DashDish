import { haversineKm } from '../../components/driver/earnings/haversine';

describe('haversineKm', () => {
    it('returns 0 for identical coordinates', () => {
        expect(haversineKm(6.5244, 3.3792, 6.5244, 3.3792)).toBe(0);
    });

    it('calculates a known distance accurately', () => {
        // Victoria Island to Ikoyi — roughly 3.5km
        const dist = haversineKm(6.4281, 3.4219, 6.4530, 3.4323);
        expect(dist).toBeGreaterThan(2);
        expect(dist).toBeLessThan(5);
    });

    it('calculates Lagos Island to Lekki — roughly 10-15km', () => {
        const dist = haversineKm(6.4550, 3.3941, 6.4698, 3.5852);
        expect(dist).toBeGreaterThan(18);
        expect(dist).toBeLessThan(25);
    });

    it('is symmetric — A to B equals B to A', () => {
        const lat1 = 6.5244, lng1 = 3.3792;
        const lat2 = 6.4281, lng2 = 3.4219;
        const d1 = haversineKm(lat1, lng1, lat2, lng2);
        const d2 = haversineKm(lat2, lng2, lat1, lng1);
        expect(d1).toBeCloseTo(d2, 5);
    });

    it('always returns a non-negative number', () => {
        expect(haversineKm(6.5244, 3.3792, 6.4281, 3.4219)).toBeGreaterThanOrEqual(0);
    });

    it('returns a number type', () => {
        expect(typeof haversineKm(6.5244, 3.3792, 6.4281, 3.4219)).toBe('number');
    });

    it('handles coordinates in different hemispheres', () => {
        // Lagos to London — roughly 5000km
        const dist = haversineKm(6.5244, 3.3792, 51.5074, -0.1278);
        expect(dist).toBeGreaterThan(4500);
        expect(dist).toBeLessThan(5500);
    });
});