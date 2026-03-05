import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToDeliveryOrders, updateOrderStatus } from '@/services/orders.service';
import type { Order } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DELIVERY_STATUS_FLOW = {
    confirmed: { next: 'picked_up', label: 'Mark as Picked Up' },
    packed: { next: 'picked_up', label: 'Mark as Picked Up' },
    picked_up: { next: 'on_the_way', label: 'Mark On the Way' },
    on_the_way: { next: 'delivered', label: 'Mark as Delivered' },
} as const;

export default function DeliveryOrdersScreen() {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.uid) return;
        const unsub = subscribeToDeliveryOrders(user.uid, o => {
            setOrders(o);
            setLoading(false);
        });
        return unsub;
    }, [user?.uid]);

    const handleStatusUpdate = async (order: Order) => {
        const flow = DELIVERY_STATUS_FLOW[order.status as keyof typeof DELIVERY_STATUS_FLOW];
        if (!flow) return;
        Alert.alert('Update Status', `Change status to "${flow.next.replace('_', ' ')}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm',
                onPress: async () => {
                    setUpdatingId(order.id);
                    try {
                        await updateOrderStatus(order.id, flow.next as any);
                    } catch {
                        Alert.alert('Error', 'Failed to update order status.');
                    } finally {
                        setUpdatingId(null);
                    }
                },
            },
        ]);
    };

    const renderOrder = ({ item: order }: { item: Order }) => {
        const flow = DELIVERY_STATUS_FLOW[order.status as keyof typeof DELIVERY_STATUS_FLOW];
        return (
            <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{order.status.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                </View>
                <View style={styles.addressRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={16} color={Colors.text.secondary} />
                    <Text style={styles.addressText}>{order.deliveryAddress.fullAddress}</Text>
                </View>
                <View style={styles.orderMeta}>
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="currency-inr" size={14} color={Colors.text.secondary} />
                        <Text style={styles.metaText}>{order.total}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="package-variant" size={14} color={Colors.text.secondary} />
                        <Text style={styles.metaText}>{order.items.length} items</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="credit-card-outline" size={14} color={Colors.text.secondary} />
                        <Text style={styles.metaText}>{order.paymentMethod.toUpperCase()}</Text>
                    </View>
                </View>
                {order.status === 'on_the_way' && (
                    <View style={styles.otpRow}>
                        <Text style={styles.otpLabel}>Customer OTP:</Text>
                        <Text style={styles.otpCode}>{order.otp}</Text>
                    </View>
                )}
                {flow && (
                    <TouchableOpacity
                        style={[styles.actionBtn, updatingId === order.id && { opacity: 0.6 }]}
                        onPress={() => handleStatusUpdate(order)}
                        disabled={updatingId === order.id}
                        activeOpacity={0.85}
                    >
                        {updatingId === order.id ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.actionBtnText}>{flow.label}</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Active Orders ({orders.length})</Text>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : orders.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="inbox-outline" size={80} color="#BDBDBD" style={{ marginBottom: Spacing.base }} />
                    <Text style={styles.emptyTitle}>No active orders</Text>
                    <Text style={styles.emptySubtitle}>Go online to start receiving orders</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={o => o.id}
                    renderItem={renderOrder}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                />
            )}
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
    listContent: { padding: Spacing.base },
    orderCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing['2xl'], ...Shadows.md },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    orderId: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    statusBadge: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
    statusText: { fontSize: 9, fontFamily: 'Poppins-Bold', color: Colors.primary },
    addressRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, alignItems: 'flex-start' },
    addressText: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.text.secondary, lineHeight: 20 },
    orderMeta: { flexDirection: 'row', gap: Spacing.base, marginBottom: Spacing.base },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary, fontFamily: 'Poppins-Medium' },
    otpRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.secondaryLight, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.base },
    otpLabel: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
    otpCode: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary, letterSpacing: 4 },
    actionBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.base, alignItems: 'center', ...Shadows.primary },
    actionBtnText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: '#fff' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
    emptyTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.sm },
    emptySubtitle: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, textAlign: 'center' },
});
