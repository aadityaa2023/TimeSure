import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocs, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateOrderStatus } from '@/services/orders.service';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import type { Order, OrderStatus } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';

const STATUS_COLORS: Record<string, string> = {
    pending: Colors.status.pending,
    confirmed: Colors.status.confirmed,
    packed: Colors.status.packed,
    picked_up: Colors.status.picked_up,
    on_the_way: Colors.status.on_the_way,
    delivered: Colors.status.delivered,
    cancelled: Colors.status.cancelled,
};

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Packed', value: 'packed' },
    { label: 'On the Way', value: 'on_the_way' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
];

export default function AdminOrdersScreen() {
    const [activating, setActivating] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    const queryClient = useQueryClient();

    const { data: orders = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: async () => {
            const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order);
        },
    });

    const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <MaterialIcons name="person" size={14} color={Colors.text.secondary} />
                    <Text style={styles.customer}>User: {order.userId.slice(-6)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm }}>
                    <MaterialIcons name="location-on" size={14} color={Colors.text.secondary} />
                    <Text style={styles.address} numberOfLines={1}>{order.deliveryAddress?.fullAddress}</Text>
                </View>
                <View style={styles.cardRow}>
                    <Text style={styles.total}>₹{order.total}</Text>
                    <Text style={styles.items}>{order.items.length} items · {order.paymentMethod?.toUpperCase()}</Text>
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
                            : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <MaterialIcons name="check-circle" size={16} color="#fff" />
                                    <Text style={styles.confirmBtnText}>Confirm Order</Text>
                                </View>
                            )}
                    </TouchableOpacity>
                )}
                {order.deliveryPartnerId && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <MaterialIcons name="delivery-dining" size={14} color={Colors.primary} />
                        <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.primary }}>{order.deliveryPartnerName ?? 'Partner assigned'}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Orders ({filtered.length})</Text>
                <TouchableOpacity onPress={() => refetch()} style={{ padding: 4 }}>
                    <MaterialIcons name="refresh" size={22} color={Colors.text.secondary} />
                </TouchableOpacity>
            </View>

            {/* Status Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}>
                {STATUS_FILTERS.map(f => {
                    const count = f.value === 'all' ? orders.length : orders.filter(o => o.status === f.value).length;
                    const color = f.value !== 'all' ? STATUS_COLORS[f.value] : Colors.primary;
                    return (
                        <TouchableOpacity
                            key={f.value}
                            style={[styles.filterTab, statusFilter === f.value && { backgroundColor: color, borderColor: color }]}
                            onPress={() => setStatusFilter(f.value)}
                        >
                            <Text style={[styles.filterText, statusFilter === f.value && { color: '#fff' }]}>
                                {f.label} ({count})
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={o => o.id}
                    renderItem={renderOrder}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', paddingTop: 60 }}>
                            <MaterialIcons name="inbox" size={64} color={Colors.text.disabled} />
                            <Text style={{ color: Colors.text.secondary, marginTop: Spacing.base }}>No orders found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    filterRow: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.sm, flexGrow: 0 },
    filterTab: { paddingHorizontal: Spacing.base, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
    filterText: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-Medium', color: Colors.text.secondary },
    listContent: { padding: Spacing.base },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing['2xl'], ...Shadows.sm },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    orderId: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    badge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
    badgeText: { fontSize: 9, fontFamily: 'Poppins-Bold', letterSpacing: 0.5 },
    customer: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, marginBottom: 2 },
    address: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, marginBottom: Spacing.sm, flex: 1 },
    total: { fontSize: Typography.fontSize.lg, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    items: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    confirmBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: 8, alignItems: 'center', marginTop: Spacing.sm },
    confirmBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
});
