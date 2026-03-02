import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { useAuthStore } from '@/stores/authStore';
import { signOutUser } from '@/services/auth.service';

const menuItems = [
    { emoji: '📍', label: 'Manage Addresses', route: '/(user)/addresses' },
    { emoji: '💳', label: 'Payment Methods', route: null },
    { emoji: '👛', label: 'TimeSure Wallet', route: '/(user)/wallet' },
    { emoji: '🏷️', label: 'My Coupons', route: null },
    { emoji: '🔔', label: 'Notifications', route: null },
    { emoji: '⭐', label: 'Rate the App', route: null },
    { emoji: '💬', label: 'Help & Support', route: null },
    { emoji: '📜', label: 'Terms & Privacy', route: null },
];

export default function ProfileScreen() {
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await signOutUser();
                    logout();
                    router.replace('/(auth)');
                },
            },
        ]);
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : '?';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <LinearGradient colors={['#0C831F', '#34A853']} style={styles.profileHeader}>
                    <View style={styles.avatarWrap}>
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.avatar} contentFit="cover" />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitials}>{initials}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
                    <Text style={styles.userPhone}>{user?.phone}</Text>
                    <TouchableOpacity style={styles.editBtn}>
                        <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNum}>0</Text>
                        <Text style={styles.statLabel}>Orders</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statNum}>₹0</Text>
                        <Text style={styles.statLabel}>Saved</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statNum}>⭐ 4.9</Text>
                        <Text style={styles.statLabel}>Rating</Text>
                    </View>
                </View>

                {/* Menu */}
                <View style={styles.menuSection}>
                    {menuItems.map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
                            onPress={() => item.route && router.push(item.route as any)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.menuEmoji}>{item.emoji}</Text>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <Text style={styles.menuChevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                    <Text style={styles.logoutText}>🚪 Logout</Text>
                </TouchableOpacity>

                <Text style={styles.version}>TimeSure v1.0.0</Text>
                <View style={{ height: 80 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    profileHeader: {
        alignItems: 'center',
        paddingTop: Spacing['2xl'],
        paddingBottom: Spacing['3xl'],
        paddingHorizontal: Spacing['2xl'],
    },
    avatarWrap: { marginBottom: Spacing.base },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: { fontSize: 36, fontFamily: 'Poppins-Bold', color: '#fff' },
    userName: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: '#fff', marginBottom: 4 },
    userPhone: { fontSize: Typography.fontSize.base, color: 'rgba(255,255,255,0.85)', marginBottom: Spacing.base },
    editBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.base,
        paddingVertical: 6,
    },
    editBtnText: { fontSize: Typography.fontSize.sm, color: '#fff', fontFamily: 'Poppins-Medium' },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.base,
        borderRadius: BorderRadius.xl,
        marginTop: -Spacing['2xl'],
        ...Shadows.lg,
        padding: Spacing.base,
    },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
    statNum: { fontSize: Typography.fontSize.lg, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    statLabel: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
    menuSection: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.base,
        marginTop: Spacing.base,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base + 4, gap: Spacing.base },
    menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
    menuEmoji: { fontSize: 20, width: 28 },
    menuLabel: { flex: 1, fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Medium', color: Colors.text.primary },
    menuChevron: { fontSize: 22, color: Colors.text.disabled },
    logoutBtn: {
        margin: Spacing.base,
        marginTop: Spacing.sm,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base + 4,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.error,
    },
    logoutText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: Colors.error },
    version: { textAlign: 'center', fontSize: Typography.fontSize.xs, color: Colors.text.disabled, marginBottom: Spacing.base },
});
