import { Platform } from 'react-native';

export const Typography = {
    fontFamily: {
        regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
        medium: 'Poppins-Medium',
        semiBold: 'Poppins-SemiBold',
        bold: 'Poppins-Bold',
        light: 'Poppins-Light',
    },
    fontSize: {
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 28,
        '4xl': 32,
        '5xl': 40,
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
    fontWeight: {
        light: '300' as const,
        regular: '400' as const,
        medium: '500' as const,
        semiBold: '600' as const,
        bold: '700' as const,
        extraBold: '800' as const,
    },
} as const;

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
} as const;

export const BorderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    full: 9999,
} as const;

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
    },
    primary: {
        shadowColor: '#0C831F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
} as const;
