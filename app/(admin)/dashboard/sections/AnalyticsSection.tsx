import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';

function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <View style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.primary, fontFamily: 'Poppins-Medium', textTransform: 'capitalize' }}>{label.replace('_', ' ')}</Text>
                <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary }}>{value} ({pct}%)</Text>
            </View>
            <View style={{ height: 8, backgroundColor: Colors.background, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${pct}%` as any, backgroundColor: color, borderRadius: 4 }} />
            </View>
        </View>
    );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 100, marginTop: Spacing.sm }}>
            {data.map((d, i) => (
                <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 10, color: Colors.text.secondary }}>{d.value}</Text>
                    <View style={{ width: 28, height: 80, backgroundColor: Colors.background, borderRadius: 4, justifyContent: 'flex-end' }}>
                        <View style={{ width: 28, height: Math.max((d.value / max) * 80, d.value > 0 ? 4 : 0), backgroundColor: Colors.primary, borderRadius: 4 }} />
                    </View>
                    <Text style={{ fontSize: 10, color: Colors.text.secondary }}>{d.label}</Text>
                </View>
            ))}
        </View>
    );
}

const STATUS_COLORS: Record<string, string> = {
    pending: Colors.status.pending, confirmed: Colors.status.confirmed,
    packed: Colors.status.packed, picked_up: Colors.status.picked_up,
    on_the_way: Colors.status.on_the_way, delivered: Colors.status.delivered,
    cancelled: Colors.status.cancelled,
};

export default function AnalyticsSection() {
    const { data, isLoading } = useQuery({
        queryKey: ['admin-analytics-section'],
        queryFn: async () => {
            const [ordersSnap, usersSnap, productsSnap, deliveredSnap, pendingSnap, cancelledSnap, allOrdersDocs] = await Promise.all([
                getCountFromServer(collection(db, 'orders')),
                getCountFromServer(query(collection(db, 'users'), where('role', '==', 'user'))),
                getCountFromServer(query(collection(db, 'products'), where('isActive', '==', true))),
                getCountFromServer(query(collection(db, 'orders'), where('status', '==', 'delivered'))),
                getCountFromServer(query(collection(db, 'orders'), where('status', '==', 'pending'))),
                getCountFromServer(query(collection(db, 'orders'), where('status', '==', 'cancelled'))),
                getDocs(collection(db, 'orders')),
            ]);
            const allOrders = allOrdersDocs.docs.map(d => d.data() as any);
            const revenue = allOrders.filter((o: any) => o.status === 'delivered').reduce((s: number, o: any) => s + (o.total ?? 0), 0);
            const statusCounts: Record<string, number> = {};
            allOrders.forEach((o: any) => { const s = o.status ?? 'unknown'; statusCounts[s] = (statusCounts[s] ?? 0) + 1; });
            const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
            const dayCounts = Array(7).fill(0);
            allOrders.slice(-50).forEach((o: any) => {
                const ts = o.createdAt?.toDate?.() ?? new Date(o.createdAt ?? '');
                if (!isNaN(ts?.getTime?.())) { const d = (ts.getDay() + 6) % 7; dayCounts[d]++; }
            });
            return {
                orders: ordersSnap.data().count, users: usersSnap.data().count,
                products: productsSnap.data().count, delivered: deliveredSnap.data().count,
                pending: pendingSnap.data().count, cancelled: cancelledSnap.data().count,
                revenue, statusCounts,
                weeklyData: dayLabels.map((l, i) => ({ label: l, value: dayCounts[i] })),
            };
        },
    });

    if (isLoading) return <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />;
    if (!data) return null;
    const totalOrdersForPct = Object.values(data.statusCounts).reduce((a, b) => a + b, 0);

    return (
        <ScrollView contentContainerStyle={{ padding: Spacing.base }} showsVerticalScrollIndicator={false}>
            {/* Revenue Banner */}
            <LinearGradient colors={['#0C831F','#34A853']} style={styles.revenueBanner}>
                <MaterialCommunityIcons name="currency-inr" size={28} color="rgba(255,255,255,0.85)" />
                <View>
                    <Text style={styles.revenueValue}>₹{data.revenue.toLocaleString('en-IN')}</Text>
                    <Text style={styles.revenueLabel}>Total Revenue from Delivered Orders</Text>
                </View>
            </LinearGradient>
            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
                {[
                    { label: 'Total Orders', value: data.orders, icon: 'clipboard-list' as const, g: ['#1565C0','#42A5F5'] as const },
                    { label: 'Delivered',    value: data.delivered, icon: 'check-circle' as const, g: ['#00695C','#26A69A'] as const },
                    { label: 'Pending',      value: data.pending,   icon: 'clock-outline' as const, g: ['#F57F17','#FFB300'] as const },
                    { label: 'Cancelled',    value: data.cancelled, icon: 'cancel' as const, g: ['#B71C1C','#EF5350'] as const },
                    { label: 'Customers',    value: data.users,     icon: 'account-group' as const, g: ['#7B1FA2','#AB47BC'] as const },
                    { label: 'Products',     value: data.products,  icon: 'package-variant-closed' as const, g: ['#E65100','#FF7043'] as const },
                ].map(k => (
                    <LinearGradient key={k.label} colors={k.g} style={styles.kpiCard}>
                        <MaterialCommunityIcons name={k.icon} size={20} color="rgba(255,255,255,0.85)" />
                        <Text style={styles.kpiVal}>{k.value}</Text>
                        <Text style={styles.kpiLabel}>{k.label}</Text>
                    </LinearGradient>
                ))}
            </View>
            {/* Weekly Chart */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Orders by Day of Week (Recent 50)</Text>
                <BarChart data={data.weeklyData} />
            </View>
            {/* Status Breakdown */}
            <View style={[styles.card, { marginTop: Spacing.base }]}>
                <Text style={styles.cardTitle}>Order Status Breakdown</Text>
                {Object.entries(data.statusCounts).map(([s, count]) => (
                    <ProgressRow key={s} label={s} value={count} total={totalOrdersForPct} color={STATUS_COLORS[s] ?? '#999'} />
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    revenueBanner: { borderRadius: BorderRadius.xl, padding: Spacing.base, flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginBottom: Spacing.base },
    revenueValue: { fontSize: Typography.fontSize['2xl'], fontFamily: 'Poppins-Bold', color: '#fff' },
    revenueLabel: { fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.8)' },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
    kpiCard: { flex: 1, minWidth: 130, borderRadius: BorderRadius.xl, padding: Spacing.base, alignItems: 'center', gap: 4, ...Shadows.sm },
    kpiVal: { fontSize: Typography.fontSize['2xl'], fontFamily: 'Poppins-Bold', color: '#fff' },
    kpiLabel: { fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
    cardTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.base },
});
