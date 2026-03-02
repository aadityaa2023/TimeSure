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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { getDocs, collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { useAuthStore } from '@/stores/authStore';
import { signOutUser } from '@/services/auth.service';

const adminMenuItems = [
    { emoji: '📦', label: 'Products', route: '/(admin)/products/index', gradient: ['#0C831F', '#34A853'] as const },
    { emoji: '🗂️', label: 'Categories', route: '/(admin)/categories/index', gradient: ['#1565C0', '#42A5F5'] as const },
    { emoji: '📋', label: 'Orders', route: '/(admin)/orders/index', gradient: ['#7B1FA2', '#AB47BC'] as const },
    { emoji: '🛵', label: 'Delivery Partners', route: null, gradient: ['#E65100', '#FF7043'] as const },
    { emoji: '👥', label: 'Users', route: '/(admin)/users', gradient: ['#00695C', '#26A69A'] as const },
    { emoji: '🏷️', label: 'Coupons', route: '/(admin)/coupons/index', gradient: ['#AD1457', '#F06292'] as const },
    { emoji: '📊', label: 'Analytics', route: '/(admin)/analytics', gradient: ['#1A237E', '#3F51B5'] as const },
    { emoji: '🔔', label: 'Notifications', route: null, gradient: ['#BF360C', '#FF7043'] as const },
];

function KPICard({ label, value, emoji, gradient }: { label: string; value: string; emoji: string; gradient: readonly [string, string] }) {
    return (
        <LinearGradient colors={gradient} style={styles.kpiCard}>
            <Text style={styles.kpiEmoji}>{emoji}</Text>
            <Text style={styles.kpiValue}>{value}</Text>
            <Text style={styles.kpiLabel}>{label}</Text>
        </LinearGradient>
    );
}

export default function AdminDashboard() {
    const { logout } = useAuthStore();

    const { data: kpis = { orders: 0, revenue: 0, users: 0, products: 0 } } = useQuery({
        queryKey: ['admin-kpis'],
        queryFn: async () => {
            try {
                const [ordersSnap, usersSnap, productsSnap, revenueOrders] = await Promise.all([
                    getCountFromServer(collection(db, 'orders')),
                    getCountFromServer(query(collection(db, 'users'), where('role', '==', 'user'))),
                    getCountFromServer(collection(db, 'products')),
                    getDocs(query(collection(db, 'orders'), where('status', '==', 'delivered'))),
                ]);
                const revenue = revenueOrders.docs.reduce((sum, d) => sum + (d.data().total ?? 0), 0);
                return {
                    orders: ordersSnap.data().count,
                    users: usersSnap.data().count,
                    products: productsSnap.data().count,
                    revenue,
                };
            } catch {
                return { orders: 0, revenue: 0, users: 0, products: 0 };
            }
        },
    });

    const handleLogout = () => {
        Alert.alert('Logout', 'Logout as admin?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: async () => { await signOutUser(); logout(); router.replace('/(auth)'); } },
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <LinearGradient colors={['#1A237E', '#283593']} style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Admin Panel</Text>
                    <Text style={styles.headerSubtitle}>⚡ TimeSure Control Center</Text>
                </View>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* KPI Cards */}
                <Text style={styles.sectionTitle}>📊 Overview</Text>
                <View style={styles.kpiGrid}>
                    <KPICard emoji="📋" label="Total Orders" value={kpis.orders.toString()} gradient={['#0C831F', '#34A853']} />
                    <KPICard emoji="💰" label="Revenue" value={`₹${kpis.revenue.toLocaleString('en-IN')}`} gradient={['#1565C0', '#42A5F5']} />
                    <KPICard emoji="👥" label="Users" value={kpis.users.toString()} gradient={['#7B1FA2', '#AB47BC']} />
                    <KPICard emoji="📦" label="Products" value={kpis.products.toString()} gradient={['#E65100', '#FF7043']} />
                </View>

                {/* Quick Access Menu */}
                <Text style={styles.sectionTitle}>🚀 Quick Access</Text>
                <View style={styles.menuGrid}>
                    {adminMenuItems.map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.menuItem}
                            onPress={() => item.route ? router.push(item.route as any) : null}
                            activeOpacity={0.85}
                        >
                            <LinearGradient colors={item.gradient} style={styles.menuGradient}>
                                <Text style={styles.menuEmoji}>{item.emoji}</Text>
                            </LinearGradient>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing['2xl'],
    },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: '#fff' },
    headerSubtitle: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.7)' },
    logoutText: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins-Medium' },
    scroll: { padding: Spacing.base },
    sectionTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.base, marginTop: Spacing.sm },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
    kpiCard: { flex: 1, minWidth: '45%', borderRadius: BorderRadius.xl, padding: Spacing['2xl'], alignItems: 'center', ...Shadows.md },
    kpiEmoji: { fontSize: 28, marginBottom: Spacing.xs },
    kpiValue: { fontSize: Typography.fontSize['2xl'], fontFamily: 'Poppins-Bold', color: '#fff', marginBottom: 2 },
    kpiLabel: { fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    menuItem: { flex: 1, minWidth: '22%', alignItems: 'center', marginBottom: Spacing.sm },
    menuGradient: { width: 60, height: 60, borderRadius: BorderRadius.xl, justifyContent: 'center', alignItems: 'center', marginBottom: 6, ...Shadows.md },
    menuEmoji: { fontSize: 28 },
    menuLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-Medium', color: Colors.text.primary, textAlign: 'center' },
});
