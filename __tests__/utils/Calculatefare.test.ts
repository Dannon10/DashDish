import calculateFare from '../../utils/calculateFare';

// farePerKm = 150, minimumFare = 300

describe('calculateFare', () => {
    it('returns minimum fare for very short distances', () => {
        expect(calculateFare(0.5)).toBe(300); // 0.5 * 150 = 75 → minimum 300
    });

    it('returns minimum fare for zero distance', () => {
        expect(calculateFare(0)).toBe(300);
    });

    it('calculates fare correctly for 2km', () => {
        expect(calculateFare(2)).toBe(300); // 2 * 150 = 300 = minimum
    });

    it('calculates fare correctly above minimum threshold', () => {
        expect(calculateFare(3)).toBe(450); // 3 * 150 = 450 > 300
    });

    it('calculates fare for typical Lagos delivery distance (5km)', () => {
        expect(calculateFare(5)).toBe(750); // 5 * 150 = 750
    });

    it('calculates fare for long distance (14km)', () => {
        expect(calculateFare(14)).toBe(2100); // 14 * 150 = 2100
    });

    it('always returns a number', () => {
        expect(typeof calculateFare(3.5)).toBe('number');
    });

    it('never returns less than minimum fare', () => {
        [0, 0.1, 0.5, 1, 1.9].forEach((km) => {
            expect(calculateFare(km)).toBeGreaterThanOrEqual(300);
        });
    });
});