import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { getUserOrders } from '@/services/orders.service';
import { useAuthStore } from '@/stores/authStore';
import type { Order } from '@/types';

const STATUS_COLORS: Record<string, string> = {
    pending: Colors.status.pending,
    confirmed: Colors.status.confirmed,
    packed: Colors.status.packed,
    picked_up: Colors.status.picked_up,
    on_the_way: Colors.status.on_the_way,
    delivered: Colors.status.delivered,
    cancelled: Colors.status.cancelled,
};

function OrderCard({ order }: { order: Order }) {
    const statusColor = STATUS_COLORS[order.status] ?? Colors.text.secondary;
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: '/(user)/order/[id]', params: { id: order.id } })}
            activeOpacity={0.85}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {order.status.replace('_', ' ').toUpperCase()}
                    </Text>
                </View>
            </View>
            <Text style={styles.itemsText} numberOfLines={2}>
                {order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}
            </Text>
            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                    {new Date(order.createdAt as any).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })}
                </Text>
                <Text style={styles.totalText}>₹{order.total}</Text>
            </View>
            {order.status === 'delivered' && (
                <TouchableOpacity style={styles.reorderBtn} activeOpacity={0.8}>
                    <Text style={styles.reorderText}>🔄 Reorder</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}

export default function OrdersScreen() {
    const { user } = useAuthStore();
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders', user?.uid],
        queryFn: () => getUserOrders(user!.uid),
        enabled: !!user,
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Orders</Text>
            </View>
            {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : orders.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>📦</Text>
                    <Text style={styles.emptyTitle}>No orders yet</Text>
                    <Text style={styles.emptySubtitle}>Start shopping and your orders will appear here</Text>
                    <TouchableOpacity style={styles.shopBtn} onPress={() => router.replace('/(user)')}>
                        <Text style={styles.shopBtnText}>Start Shopping →</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={o => o.id}
                    renderItem={({ item }) => <OrderCard order={item} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
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
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing['2xl'],
        ...Shadows.sm,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    orderId: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    statusBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
    statusText: { fontSize: 9, fontFamily: 'Poppins-Bold', letterSpacing: 0.5 },
    itemsText: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginBottom: Spacing.base, lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: Typography.fontSize.sm, color: Colors.text.disabled },
    totalText: { fontSize: Typography.fontSize.lg, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    reorderBtn: {
        marginTop: Spacing.base,
        paddingVertical: 6,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    reorderText: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.primary },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
    emptyEmoji: { fontSize: 64, marginBottom: Spacing.base },
    emptyTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.sm },
    emptySubtitle: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing['2xl'] },
    shopBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, paddingVertical: Spacing.base, paddingHorizontal: Spacing['2xl'] },
    shopBtnText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: '#fff' },
});
