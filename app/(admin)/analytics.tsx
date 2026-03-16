import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getDocs, collection, query, where, orderBy, getCountFromServer, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: IconName; color: string }) {
    return (
        <View style={[styles.statCard, Shadows.sm]}>
            <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
                <MaterialCommunityIcons name={icon} size={22} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function BarChart({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) {
    return (
        <View style={styles.barChart}>
            {data.map((d, i) => (
                <View key={i} style={styles.barGroup}>
                    <Text style={styles.barValue}>{d.value}</Text>
                    <View style={styles.barTrack}>
                        <View style={[styles.bar, { height: maxValue > 0 ? Math.max((d.value / maxValue) * 80, d.value > 0 ? 4 : 0) : 0 }]} />
                    </View>
                    <Text style={styles.barLabel}>{d.label}</Text>
                </View>
            ))}
        </View>
    );
}

export default function AdminAnalytics() {
    const { data, isLoading } = useQuery({
        queryKey: ['admin-analytics'],
        queryFn: async () => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

            const [
                totalOrders,
                deliveredOrders,
                pendingOrders,
                totalUsers,
                totalProducts,
                totalCategories,
                allDeliveredDocs,
                recentOrdersDocs,
            ] = await Promise.all([
                getCountFromServer(collection(db, 'orders')),
                getCountFromServer(query(collection(db, 'orders'), where('status', '==', 'delivered'))),
                getCountFromServer(query(collection(db, 'orders'), where('status', '==', 'pending'))),
                getCountFromServer(query(collection(db, 'users'), where('role', '==', 'user'))),
                getCountFromServer(query(collection(db, 'products'), where('isActive', '==', true))),
                getCountFromServer(collection(db, 'categories')),
                getDocs(query(collection(db, 'orders'), where('status', '==', 'delivered'))),
                getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50))),
            ]);

            const totalRevenue = allDeliveredDocs.docs.reduce((sum, d) => sum + (d.data().total ?? 0), 0);

            // Build orders by status
            const statusCounts: Record<string, number> = {};
            recentOrdersDocs.docs.forEach(d => {
                const s = d.data().status ?? 'unknown';
                statusCounts[s] = (statusCounts[s] ?? 0) + 1;
            });

            // Weekly order counts from recent 50
            const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const dayCounts = Array(7).fill(0);
            recentOrdersDocs.docs.forEach(d => {
                const ts = d.data().createdAt?.toDate?.() ?? new Date(d.data().createdAt ?? '');
                const dayOfWeek = (ts.getDay() + 6) % 7; // Mon = 0
                dayCounts[dayOfWeek]++;
            });

            return {
                totalOrders: totalOrders.data().count,
                deliveredOrders: deliveredOrders.data().count,
                pendingOrders: pendingOrders.data().count,
                cancelledOrders: statusCounts['cancelled'] ?? 0,
                totalRevenue,
                totalUsers: totalUsers.data().count,
                totalProducts: totalProducts.data().count,
                totalCategories: totalCategories.data().count,
                statusCounts,
                weeklyData: dayLabels.map((label, i) => ({ label, value: dayCounts[i] })),
            };
        },
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analytics</Text>
                <View style={{ width: 30 }} />
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : data ? (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <View style={Platform.OS === 'web' ? styles.webContainer : {}}>
                        {/* Revenue Banner */}
                        <LinearGradient colors={['#0C831F', '#34A853']} style={styles.revenueBanner}>
                            <MaterialCommunityIcons name="currency-inr" size={32} color="rgba(255,255,255,0.8)" />
                            <View>
                                <Text style={styles.revenueValue}>₹{data.totalRevenue.toLocaleString('en-IN')}</Text>
                                <Text style={styles.revenueLabel}>Total Revenue from Delivered Orders</Text>
                            </View>
                        </LinearGradient>

                        {/* KPI Grid */}
                        <View style={styles.statsGrid}>
                            <StatCard label="Total Orders" value={data.totalOrders.toString()} icon="clipboard-list" color="#3B82F6" />
                            <StatCard label="Delivered" value={data.deliveredOrders.toString()} icon="check-circle" color={Colors.success} />
                            <StatCard label="Pending" value={data.pendingOrders.toString()} icon="clock-outline" color={Colors.warning} />
                            <StatCard label="Cancelled" value={data.cancelledOrders.toString()} icon="cancel" color={Colors.error} />
                            <StatCard label="Users" value={data.totalUsers.toString()} icon="account-group" color="#7B1FA2" />
                            <StatCard label="Products" value={data.totalProducts.toString()} icon="package-variant-closed" color="#E65100" />
                        </View>

                        {/* Weekly Bar Chart */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Weekly Orders (Last 50)</Text>
                            <BarChart data={data.weeklyData} maxValue={Math.max(...data.weeklyData.map(d => d.value), 1)} />
                        </View>

                        {/* Order Status Breakdown */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Order Status Breakdown</Text>
                            {Object.entries(data.statusCounts).map(([status, count]) => {
                                const pct = Math.round((count / Math.max(Object.values(data.statusCounts).reduce((a, b) => a + b, 0), 1)) * 100);
                                const color = (Colors.status as any)[status] ?? Colors.text.disabled;
                                return (
                                    <View key={status} style={{ marginBottom: Spacing.sm }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Text style={styles.statusLabel}>{status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                                            <Text style={styles.statusValue}>{count} ({pct}%)</Text>
                                        </View>
                                        <View style={styles.progressTrack}>
                                            <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Quick Stats */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Catalogue</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={styles.bigNum}>{data.totalProducts}</Text>
                                    <Text style={styles.smallLabel}>Active Products</Text>
                                </View>
                                <View style={{ width: 1, backgroundColor: Colors.border }} />
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={styles.bigNum}>{data.totalCategories}</Text>
                                    <Text style={styles.smallLabel}>Categories</Text>
                                </View>
                                <View style={{ width: 1, backgroundColor: Colors.border }} />
                                <View style={{ alignItems: 'center' }}>
                                    <Text style={styles.bigNum}>{data.totalUsers}</Text>
                                    <Text style={styles.smallLabel}>Customers</Text>
                                </View>
                            </View>
                        </View>
                        <View style={{ height: 40 }} />
                    </View>
                </ScrollView>
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    scroll: { padding: Spacing.base },
    webContainer: { maxWidth: 800, alignSelf: 'center', width: '100%' },
    revenueBanner: { borderRadius: BorderRadius.xl, padding: Spacing['2xl'], flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginBottom: Spacing.base, ...Shadows.primary },
    revenueValue: { fontSize: Typography.fontSize['2xl'], fontFamily: 'Poppins-Bold', color: '#fff' },
    revenueLabel: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.8)' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
    statCard: { flex: 1, minWidth: '30%', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, alignItems: 'center' },
    iconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
    statValue: { fontSize: Typography.fontSize['2xl'], fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    statLabel: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, textAlign: 'center' },
    section: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.base, ...Shadows.sm },
    sectionTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.base },
    barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 110 },
    barGroup: { alignItems: 'center', gap: 4 },
    barValue: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    barTrack: { width: 24, height: 80, backgroundColor: Colors.background, borderRadius: 4, justifyContent: 'flex-end' },
    bar: { width: 24, backgroundColor: Colors.primary, borderRadius: 4 },
    barLabel: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    statusLabel: { fontSize: Typography.fontSize.sm, color: Colors.text.primary, fontFamily: 'Poppins-Medium' },
    statusValue: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
    progressTrack: { height: 8, backgroundColor: Colors.background, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    bigNum: { fontSize: Typography.fontSize['2xl'], fontFamily: 'Poppins-Bold', color: Colors.primary },
    smallLabel: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
});
