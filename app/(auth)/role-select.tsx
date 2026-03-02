import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { auth } from '@/lib/firebase';
import { updateUserRole } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

const roles = [
    {
        role: 'user' as UserRole,
        emoji: '🛒',
        title: 'Customer',
        description: 'Browse products, place orders, and get groceries delivered to your doorstep',
        gradient: ['#0C831F', '#34A853'] as const,
    },
    {
        role: 'delivery' as UserRole,
        emoji: '🛵',
        title: 'Delivery Partner',
        description: 'Earn money by delivering orders to customers in your neighbourhood',
        gradient: ['#1565C0', '#42A5F5'] as const,
    },
];

export default function RoleSelectScreen() {
    const [selected, setSelected] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(false);
    const { setRole, user } = useAuthStore();

    const handleContinue = async () => {
        if (!selected || !auth.currentUser) return;
        setLoading(true);
        try {
            await updateUserRole(auth.currentUser.uid, selected);
            setRole(selected);
            router.replace('/(auth)/profile-setup');
        } catch {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.title}>I am a...</Text>
                    <Text style={styles.subtitle}>Select your role to personalize your experience</Text>
                </View>

                <View style={styles.cards}>
                    {roles.map(item => (
                        <TouchableOpacity
                            key={item.role}
                            onPress={() => setSelected(item.role)}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={selected === item.role ? item.gradient : (['#fff', '#fff'] as any)}
                                style={[styles.card, selected === item.role && styles.selectedCard]}
                            >
                                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                                <Text
                                    style={[styles.cardTitle, selected === item.role && styles.cardTitleSelected]}
                                >
                                    {item.title}
                                </Text>
                                <Text
                                    style={[
                                        styles.cardDesc,
                                        selected === item.role && styles.cardDescSelected,
                                    ]}
                                >
                                    {item.description}
                                </Text>
                                {selected === item.role && (
                                    <View style={styles.checkBadge}>
                                        <Text style={styles.checkText}>✓</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.continueBtn, (!selected || loading) && { opacity: 0.5 }]}
                    onPress={handleContinue}
                    disabled={!selected || loading}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={['#0C831F', '#34A853']}
                        style={styles.continueGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.continueText}>
                            {loading ? 'Setting up...' : 'Continue →'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: Spacing['2xl'],
        paddingTop: Spacing['3xl'],
        paddingBottom: Spacing['2xl'],
    },
    header: { marginBottom: Spacing['3xl'] },
    title: {
        fontSize: Typography.fontSize['3xl'],
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
    },
    cards: { gap: Spacing.base, marginBottom: Spacing['3xl'] },
    card: {
        borderRadius: BorderRadius['2xl'],
        padding: Spacing['2xl'],
        borderWidth: 2,
        borderColor: Colors.border,
        ...Shadows.md,
    },
    selectedCard: { borderColor: Colors.primary },
    cardEmoji: { fontSize: 48, marginBottom: Spacing.md },
    cardTitle: {
        fontSize: Typography.fontSize.xl,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    cardTitleSelected: { color: '#fff' },
    cardDesc: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
        lineHeight: 22,
    },
    cardDescSelected: { color: 'rgba(255,255,255,0.9)' },
    checkBadge: {
        position: 'absolute',
        top: Spacing.base,
        right: Spacing.base,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    continueBtn: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadows.primary,
    },
    continueGradient: {
        paddingVertical: Spacing.base,
        alignItems: 'center',
    },
    continueText: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.semiBold,
        color: '#fff',
    },
});
