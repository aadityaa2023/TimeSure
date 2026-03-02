import React, { useState } from 'react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { assignDeliveryPartner, updateOrderStatus } from '@/services/orders.service';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
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

export default function AdminOrdersScreen() {
    const [activating, setActivating] = useState<string | null>(null);

    const { data: orders = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: async () => {
            const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order);
        },
    });

    const renderOrder = ({ item: order }: { item: Order }) => {
        const statusColor = STATUS_COLORS[order.status] ?? '#999';
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: '/(admin)/orders/[id]', params: { id: order.id } } as any)}
                activeOpacity={0.85}
            >
                <View style={styles.cardRow}>
                    <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                    <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
                        <Text style={[styles.badgeText, { color: statusColor }]}>
                            {order.status.replace('_', ' ').toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={styles.customer}>👤 User: {order.userId.slice(-6)}</Text>
                <Text style={styles.address} numberOfLines={1}>📍 {order.deliveryAddress.fullAddress}</Text>
                <View style={styles.cardRow}>
                    <Text style={styles.total}>₹{order.total}</Text>
                    <Text style={styles.items}>{order.items.length} items · {order.paymentMethod.toUpperCase()}</Text>
                </View>
                {order.status === 'pending' && (
                    <TouchableOpacity
                        style={[styles.confirmBtn, activating === order.id && { opacity: 0.6 }]}
                        disabled={activating === order.id}
                        onPress={async () => {
                            setActivating(order.id);
                            try {
                                await updateOrderStatus(order.id, 'confirmed', 'Confirmed by admin');
                                await refetch();
                            } finally {
                                setActivating(null);
                            }
                        }}
                    >
                        {activating === order.id
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.confirmBtnText}>✅ Confirm Order</Text>}
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Orders ({orders.length})</Text>
                <View style={{ width: 30 }} />
            </View>
            {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    backText: { fontSize: 24, color: Colors.text.primary },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    listContent: { padding: Spacing.base },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing['2xl'], ...Shadows.sm },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    orderId: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    badge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
    badgeText: { fontSize: 9, fontFamily: 'Poppins-Bold', letterSpacing: 0.5 },
    customer: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, marginBottom: 2 },
    address: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, marginBottom: Spacing.sm },
    total: { fontSize: Typography.fontSize.lg, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    items: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    confirmBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 8, alignItems: 'center', marginTop: Spacing.sm },
    confirmBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
});
