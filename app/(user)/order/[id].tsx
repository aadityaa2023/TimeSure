import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { subscribeToOrder } from '@/services/orders.service';
import type { Order, OrderStatus } from '@/types';

const STATUS_STEPS: { status: OrderStatus; label: string; emoji: string }[] = [
    { status: 'pending', label: 'Order Placed', emoji: '📋' },
    { status: 'confirmed', label: 'Confirmed', emoji: '✅' },
    { status: 'packed', label: 'Packed', emoji: '📦' },
    { status: 'picked_up', label: 'Picked Up', emoji: '🛵' },
    { status: 'on_the_way', label: 'On the Way', emoji: '🚀' },
    { status: 'delivered', label: 'Delivered', emoji: '🎉' },
];

export default function OrderTrackingScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (!id) return;
        const unsub = subscribeToOrder(id, setOrder);
        return unsub;
    }, [id]);

    if (!order) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loaderText}>Loading order...</Text>
            </View>
        );
    }

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.status === order.status);
    const isCancelled = order.status === 'cancelled';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <LinearGradient colors={['#0C831F', '#34A853']} style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/(user)/orders')}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #{id?.slice(-6).toUpperCase()}</Text>
                <View style={{ width: 30 }} />
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Status Hero */}
                <View style={styles.statusHero}>
                    <Text style={styles.statusEmoji}>
                        {STATUS_STEPS.find(s => s.status === order.status)?.emoji ?? '📦'}
                    </Text>
                    <Text style={styles.statusTitle}>
                        {order.status === 'delivered'
                            ? '🎉 Delivered!'
                            : isCancelled
                                ? '❌ Order Cancelled'
                                : `${STATUS_STEPS.find(s => s.status === order.status)?.label ?? 'Processing'}...`}
                    </Text>
                    {order.estimatedDelivery && (
                        <Text style={styles.etaText}>
                            Estimated: {new Date(order.estimatedDelivery).toLocaleTimeString()}
                        </Text>
                    )}
                    {/* OTP */}
                    {['picked_up', 'on_the_way'].includes(order.status) && (
                        <View style={styles.otpCard}>
                            <Text style={styles.otpLabel}>Show this OTP to delivery partner</Text>
                            <Text style={styles.otpCode}>{order.otp}</Text>
                        </View>
                    )}
                </View>

                {/* Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Timeline</Text>
                    <View style={styles.timeline}>
                        {STATUS_STEPS.slice(0, 6).map((step, index) => {
                            const isCompleted = index <= currentStepIndex && !isCancelled;
                            const isCurrent = index === currentStepIndex && !isCancelled;
                            const timelineEvent = order.timeline.find(t => t.status === step.status);
                            return (
                                <View key={step.status} style={styles.timelineStep}>
                                    <View style={styles.timelineLeft}>
                                        <View
                                            style={[
                                                styles.timelineDot,
                                                isCompleted && styles.timelineDotCompleted,
                                                isCurrent && styles.timelineDotCurrent,
                                            ]}
                                        >
                                            <Text style={styles.timelineDotText}>
                                                {isCompleted ? '✓' : step.emoji}
                                            </Text>
                                        </View>
                                        {index < STATUS_STEPS.length - 1 && (
                                            <View
                                                style={[
                                                    styles.timelineLine,
                                                    isCompleted && index < currentStepIndex && styles.timelineLineCompleted,
                                                ]}
                                            />
                                        )}
                                    </View>
                                    <View style={styles.timelineRight}>
                                        <Text
                                            style={[
                                                styles.timelineLabel,
                                                isCompleted && styles.timelineLabelCompleted,
                                                isCurrent && styles.timelineLabelCurrent,
                                            ]}
                                        >
                                            {step.label}
                                        </Text>
                                        {timelineEvent && (
                                            <Text style={styles.timelineTime}>
                                                {new Date(timelineEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Order Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Items Ordered</Text>
                    {order.items.map((item, i) => (
                        <View key={i} style={styles.orderItem}>
                            <Text style={styles.orderItemName}>{item.name}</Text>
                            <Text style={styles.orderItemUnit}>{item.unit}</Text>
                            <View style={styles.orderItemRight}>
                                <Text style={styles.orderItemQty}>×{item.quantity}</Text>
                                <Text style={styles.orderItemPrice}>₹{item.price * item.quantity}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Delivery Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>📍 Address</Text>
                        <Text style={styles.detailVal}>{order.deliveryAddress.fullAddress}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>💳 Payment</Text>
                        <Text style={styles.detailVal}>{order.paymentMethod.toUpperCase()}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>💰 Total</Text>
                        <Text style={[styles.detailVal, { fontFamily: 'Poppins-Bold' }]}>₹{order.total}</Text>
                    </View>
                    {order.deliveryPartnerName && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailKey}>🛵 Partner</Text>
                            <Text style={styles.detailVal}>{order.deliveryPartnerName}</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.base },
    loaderText: { color: Colors.text.secondary, fontFamily: 'Poppins-Regular', fontSize: Typography.fontSize.base },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
    },
    backText: { fontSize: 24, color: '#fff' },
    headerTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: '#fff' },
    statusHero: {
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing['3xl'],
        ...Shadows.sm,
    },
    statusEmoji: { fontSize: 64, marginBottom: Spacing.base },
    statusTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: 4 },
    etaText: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, fontFamily: 'Poppins-Regular' },
    otpCard: {
        marginTop: Spacing['2xl'],
        backgroundColor: Colors.primaryLight,
        borderRadius: BorderRadius.xl,
        padding: Spacing['2xl'],
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
        width: '100%',
    },
    otpLabel: { fontSize: Typography.fontSize.sm, color: Colors.primary, fontFamily: 'Poppins-Medium', marginBottom: Spacing.sm },
    otpCode: { fontSize: 48, fontFamily: 'Poppins-Bold', color: Colors.primary, letterSpacing: 8 },
    section: {
        backgroundColor: Colors.surface,
        margin: Spacing.base,
        borderRadius: BorderRadius.xl,
        padding: Spacing['2xl'],
        ...Shadows.sm,
    },
    sectionTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.base },
    timeline: { gap: 0 },
    timelineStep: { flexDirection: 'row', gap: Spacing.base },
    timelineLeft: { alignItems: 'center', width: 40 },
    timelineDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: Colors.border,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineDotCompleted: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    timelineDotCurrent: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    timelineDotText: { fontSize: 14 },
    timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 2 },
    timelineLineCompleted: { backgroundColor: Colors.primary },
    timelineRight: { flex: 1, paddingTop: 6, paddingBottom: Spacing.base },
    timelineLabel: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Regular', color: Colors.text.disabled },
    timelineLabelCompleted: { color: Colors.text.primary, fontFamily: 'Poppins-SemiBold' },
    timelineLabelCurrent: { color: Colors.primary, fontFamily: 'Poppins-Bold' },
    timelineTime: { fontSize: Typography.fontSize.xs, color: Colors.text.disabled, marginTop: 2 },
    orderItem: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
    orderItemName: { flex: 1, fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Medium', color: Colors.text.primary },
    orderItemUnit: { fontSize: Typography.fontSize.xs, color: Colors.text.disabled },
    orderItemRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    orderItemQty: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
    orderItemPrice: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    detailRow: { flexDirection: 'row', gap: Spacing.base, marginBottom: Spacing.sm, alignItems: 'flex-start' },
    detailKey: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, width: 100 },
    detailVal: { flex: 1, fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Medium', color: Colors.text.primary },
});
