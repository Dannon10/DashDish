import formatCurrency from '../../utils/formatCurrency';

describe('formatCurrency', () => {
    it('formats a whole number in NGN', () => {
        const result = formatCurrency(1000);
        expect(result).toContain('1,000');
    });

    it('formats zero correctly', () => {
        const result = formatCurrency(0);
        expect(result).toContain('0');
    });

    it('formats large amounts with commas', () => {
        const result = formatCurrency(150000);
        expect(result).toContain('150,000');
    });

    it('includes NGN currency symbol or code', () => {
        const result = formatCurrency(500);
        // Intl may render ₦ or NGN depending on environment
        expect(result.includes('₦') || result.includes('NGN')).toBe(true);
    });

    it('rounds decimals — no fraction digits', () => {
        const result = formatCurrency(999.99);
        expect(result).not.toContain('.');
    });

    it('formats delivery fee amounts correctly', () => {
        const result = formatCurrency(450);
        expect(result).toContain('450');
    });
});