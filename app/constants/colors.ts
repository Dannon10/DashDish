const colors = {
    // Primary Brand
    primary: '#7C3AED',
    primaryLight: '#A855F7',
    primaryDark: '#5B21B6',

    // Backgrounds
    background: '#0A0A0A',
    surface: '#141414',
    surfaceElevated: '#1E1E1E',

    // Borders
    border: '#2A2A2A',
    borderLight: '#333333',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#555555',

    // Status Colors
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Order Status
    statusPlaced: '#3B82F6',
    statusConfirmed: '#A855F7',
    statusPreparing: '#F59E0B',
    statusPickedUp: '#F97316',
    statusOnTheWay: '#7C3AED',
    statusDelivered: '#22C55E',
    statusCancelled: '#EF4444',

    // Misc
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    overlay: 'rgba(0,0,0,0.6)',
} as const;

export type ColorKey = keyof typeof colors;
export default colors;