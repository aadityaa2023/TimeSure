// Brand Colors — Blinkit-inspired palette
export const Colors = {
    primary: '#0C831F',        // Blinkit green
    primaryDark: '#0A6B19',
    primaryLight: '#E8F5E9',
    secondary: '#F8C200',      // Accent yellow
    secondaryLight: '#FFF8E1',
    accent: '#FF5252',         // Sale/discount red

    background: '#F4F6F8',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E8ECF0',
    divider: '#F0F2F5',

    text: {
        primary: '#1A1A2E',
        secondary: '#6B7280',
        disabled: '#9CA3AF',
        inverse: '#FFFFFF',
        link: '#0C831F',
    },

    status: {
        pending: '#F59E0B',
        confirmed: '#3B82F6',
        packed: '#8B5CF6',
        picked_up: '#F97316',
        on_the_way: '#06B6D4',
        delivered: '#10B981',
        cancelled: '#EF4444',
    },

    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    gradients: {
        primary: ['#0C831F', '#34A853'],
        hero: ['#0C831F', '#1B5E20'],
        card: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)'],
        overlay: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)'],
    },

    // Dark mode (future)
    dark: {
        background: '#0F0F1A',
        surface: '#1A1A2E',
        border: '#2D2D44',
        text: '#F9FAFB',
    },
} as const;

export type ColorKeys = keyof typeof Colors;
