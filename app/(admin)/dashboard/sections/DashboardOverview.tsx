import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getDocs, collection, query, where, getCountFromServer, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';

const KPIs = [
    { label: 'Total Orders',  field: 'orders',   icon: 'clipboard-list',          gradient: ['#1565C0','#42A5F5'] as const },
    { label: 'Revenue (₹)',   field: 'revenue',  icon: 'currency-inr',            gradient: ['#0C831F','#34A853'] as const },
    { label: 'Customers',     field: 'users',    icon: 'account-group',           gradient: ['#7B1FA2','#AB47BC'] as const },
    { label: 'Products Live', field: 'products', icon: 'package-variant-closed',  gradient: ['#E65100','#FF7043'] as const },
    { label: 'Pending',       field: 'pending',  icon: 'clock-outline',           gradient: ['#F57F17','#FFB300'] as const },
    { label: 'Delivered',     field: 'delivered',icon: 'check-circle',            gradient: ['#00695C','#26A69A'] as const },
];

export default function DashboardOverview() {
    const { data, isLoading } = useQuery({
        queryKey: ['admin-kpis-full'],
        queryFn: async () => {
            const [orders, users, products, pending, delivered, deliveredDocs] = await Promise.all([
                getCountFromServer(collection(db, 'orders')),
                getCountFromServer(query(collection(db, 'users'), where('role','==','user'))),
                getCountFromServer(query(collection(db, 'products'), where('isActive','==',true))),
                getCountFromServer(query(collection(db, 'orders'), where('status','==','pending'))),
                getCountFromServer(query(collection(db, 'orders'), where('status','==','delivered'))),
                getDocs(query(collection(db, 'orders'), where('status','==','delivered'))),
            ]);
            const revenue = deliveredDocs.docs.reduce((s, d) => s + (d.data().total ?? 0), 0);
            return {
                orders: orders.data().count,
                users:  users.data().count,
                products: products.data().count,
                pending: pending.data().count,
                delivered: delivered.data().count,
                revenue,
            };
        },
    });

    const { data: recentOrders = [] } = useQuery({
        queryKey: ['admin-recent-orders'],
        queryFn: async () => {
            const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt','desc'), limit(6)));
            return snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        },
    });

    if (isLoading) return <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />;

    return (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
                {KPIs.map(kpi => {
                    const raw = data?.[kpi.field as keyof typeof data] ?? 0;
                    const val = kpi.field === 'revenue' ? `₹${Number(raw).toLocaleString('en-IN')}` : raw.toString();
                    return (
                        <LinearGradient key={kpi.field} colors={kpi.gradient} style={styles.kpiCard}>
                            <View style={styles.kpiIconWrap}>
                                <MaterialCommunityIcons name={kpi.icon as any} size={22} color="#fff" />
                            </View>
                            <Text style={styles.kpiVal}>{val}</Text>
                            <Text style={styles.kpiLabel}>{kpi.label}</Text>
                        </LinearGradient>
                    );
                })}
            </View>

            {/* Recent Orders */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Recent Orders</Text>
                {recentOrders.map((o: any) => (
                    <View key={o.id} style={styles.orderRow}>
                        <Text style={styles.orderId}>#{o.id.slice(-6).toUpperCase()}</Text>
                        <Text style={styles.orderInfo} numberOfLines={1}>{o.deliveryAddress?.fullAddress ?? '—'}</Text>
                        <Text style={styles.orderAmt}>₹{o.total}</Text>
                        <View style={[styles.statusDot, { backgroundColor: (Colors.status as any)[o.status] ?? '#999' }]} />
                        <Text style={[styles.statusTxt, { color: (Colors.status as any)[o.status] ?? '#999' }]}>
                            {o.status?.replace('_',' ')}
                        </Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: Spacing.base },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
    kpiCard: { flex: 1, minWidth: 140, borderRadius: BorderRadius.xl, padding: Spacing.base, alignItems: 'center', ...Shadows.md },
    kpiIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
    kpiVal: { fontSize: Typography.fontSize['2xl'], fontFamily: 'Poppins-Bold', color: '#fff' },
    kpiLabel: { fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
    cardTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.base },
    orderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
    orderId: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary, width: 80 },
    orderInfo: { flex: 1, fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    orderAmt: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-Bold', color: Colors.text.primary, width: 60, textAlign: 'right' },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusTxt: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-Medium', width: 80, textTransform: 'capitalize' },
});
