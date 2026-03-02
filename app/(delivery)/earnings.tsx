import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { useAuthStore } from '@/stores/authStore';

const weeklyData = [
    { day: 'Mon', amount: 420 },
    { day: 'Tue', amount: 680 },
    { day: 'Wed', amount: 380 },
    { day: 'Thu', amount: 720 },
    { day: 'Fri', amount: 540 },
    { day: 'Sat', amount: 950 },
    { day: 'Sun', amount: 840 },
];
const MAX_AMOUNT = Math.max(...weeklyData.map(d => d.amount));

export default function EarningsScreen() {
    const total = weeklyData.reduce((sum, d) => sum + d.amount, 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Earnings</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Total Card */}
                <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.totalCard}>
                    <Text style={styles.totalLabel}>This Week's Total</Text>
                    <Text style={styles.totalAmount}>₹{total.toLocaleString('en-IN')}</Text>
                    <Text style={styles.totalSubLabel}>Keep up the great work! 🚀</Text>
                </LinearGradient>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNum}>₹{weeklyData[weeklyData.length - 1].amount}</Text>
                        <Text style={styles.statLabel}>Today</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNum}>₹{total}</Text>
                        <Text style={styles.statLabel}>This Week</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNum}>₹{(total * 4).toLocaleString('en-IN')}</Text>
                        <Text style={styles.statLabel}>This Month</Text>
                    </View>
                </View>

                {/* Bar Chart */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Weekly Earnings Breakdown</Text>
                    <View style={styles.chart}>
                        {weeklyData.map((d, i) => {
                            const barHeight = (d.amount / MAX_AMOUNT) * 120;
                            const isToday = i === weeklyData.length - 1;
                            return (
                                <View key={d.day} style={styles.barWrapper}>
                                    <Text style={styles.barAmount}>₹{d.amount}</Text>
                                    <View style={styles.barContainer}>
                                        <View
                                            style={[
                                                styles.bar,
                                                { height: barHeight },
                                                isToday && { backgroundColor: Colors.primary },
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.barDay, isToday && { color: Colors.primary, fontFamily: 'Poppins-Bold' }]}>
                                        {d.day}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Per Delivery */}
                <View style={styles.perDelivery}>
                    <Text style={styles.chartTitle}>Per Delivery Breakup</Text>
                    {[
                        { label: 'Base Pay', amount: 30 },
                        { label: 'Distance Bonus', amount: 15 },
                        { label: 'Peak Hour Bonus', amount: 20 },
                        { label: 'Customer Tip', amount: 10 },
                    ].map((row, i) => (
                        <View key={i} style={styles.payRow}>
                            <Text style={styles.payLabel}>{row.label}</Text>
                            <Text style={styles.payAmount}>+₹{row.amount}</Text>
                        </View>
                    ))}
                    <View style={styles.divider} />
                    <View style={styles.payRow}>
                        <Text style={styles.payTotalLabel}>Per Delivery Avg</Text>
                        <Text style={styles.payTotalAmount}>₹75</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    scroll: { padding: Spacing.base },
    totalCard: {
        borderRadius: BorderRadius['2xl'],
        padding: Spacing['3xl'],
        alignItems: 'center',
        marginBottom: Spacing.base,
        ...Shadows.lg,
    },
    totalLabel: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins-Medium', textTransform: 'uppercase', letterSpacing: 1 },
    totalAmount: { fontSize: Typography.fontSize['4xl'], fontFamily: 'Poppins-Bold', color: '#fff', marginVertical: Spacing.sm },
    totalSubLabel: { fontSize: Typography.fontSize.base, color: 'rgba(255,255,255,0.9)' },
    statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
    statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, alignItems: 'center', ...Shadows.sm },
    statNum: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: 2 },
    statLabel: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    chartCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing['2xl'], marginBottom: Spacing.base, ...Shadows.sm },
    chartTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing['2xl'] },
    chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160 },
    barWrapper: { flex: 1, alignItems: 'center', gap: 4 },
    barAmount: { fontSize: 7, color: Colors.text.disabled, textAlign: 'center' },
    barContainer: { height: 120, justifyContent: 'flex-end', width: '70%' },
    bar: { width: '100%', backgroundColor: Colors.info, borderRadius: 4 },
    barDay: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    perDelivery: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing['2xl'], ...Shadows.sm },
    payRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
    payLabel: { fontSize: Typography.fontSize.base, color: Colors.text.secondary },
    payAmount: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: Colors.primary },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
    payTotalLabel: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    payTotalAmount: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
});
