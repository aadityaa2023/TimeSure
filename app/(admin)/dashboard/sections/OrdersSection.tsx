import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, ScrollView, Platform,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocs, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateOrderStatus } from '@/services/orders.service';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';
import type { Order, OrderStatus } from '@/types';

const STATUS_COLORS: Record<string, string> = {
    pending: Colors.status.pending, confirmed: Colors.status.confirmed,
    packed: Colors.status.packed, picked_up: Colors.status.picked_up,
    on_the_way: Colors.status.on_the_way, delivered: Colors.status.delivered,
    cancelled: Colors.status.cancelled,
};
const STATUS_FILTERS = ['all','pending','confirmed','packed','on_the_way','delivered','cancelled'];

export default function OrdersSection() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<string>('all');
    const [confirming, setConfirming] = useState<string | null>(null);

    const { data: orders = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-orders-section'],
        queryFn: async () => {
            const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt','desc'), limit(100)));
            return snap.docs.map(d => ({ id: d.id, ...d.data() as any })) as Order[];
        },
    });

    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    const confirmOrder = async (id: string) => {
        setConfirming(id);
        try { await updateOrderStatus(id, 'confirmed', 'Confirmed by admin'); await refetch(); }
        finally { setConfirming(null); }
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Filter Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}>
                {STATUS_FILTERS.map(s => {
                    const cnt = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
                    const color = s !== 'all' ? (STATUS_COLORS[s] ?? Colors.text.disabled) : Colors.primary;
                    return (
                        <TouchableOpacity key={s} style={[styles.filterTab, filter === s && { backgroundColor: color, borderColor: color }]} onPress={() => setFilter(s)}>
                            <Text style={[styles.filterText, filter === s && { color: '#fff' }]}>{s.replace('_',' ')} ({cnt})</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {isLoading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} /> : (
                <FlatList
                    data={filtered}
                    keyExtractor={o => o.id}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="inbox" size={64} color={Colors.text.disabled} /><Text style={styles.emptyText}>No orders</Text></View>}
                    renderItem={({ item: o }) => {
                        const color = STATUS_COLORS[o.status] ?? '#999';
                        return (
                            <View style={styles.card}>
                                <View style={styles.cardTop}>
                                    <Text style={styles.orderId}>#{o.id.slice(-6).toUpperCase()}</Text>
                                    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
                                        <Text style={[styles.badgeText, { color }]}>{o.status?.replace('_',' ')}</Text>
                                    </View>
                                    <Text style={styles.total}>₹{o.total}</Text>
                                </View>
                                <Text style={styles.address} numberOfLines={1}>{o.deliveryAddress?.fullAddress}</Text>
                                <View style={styles.cardBottom}>
                                    <Text style={styles.meta}>{o.items?.length} items · {o.paymentMethod?.toUpperCase()} · {o.paymentStatus}</Text>
                                    {o.deliveryPartnerName && <Text style={[styles.meta, { color: Colors.primary }]}>🛵 {o.deliveryPartnerName}</Text>}
                                    {o.status === 'pending' && (
                                        <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmOrder(o.id)} disabled={confirming === o.id}>
                                            {confirming === o.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm</Text>}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    filterRow: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.sm, flexGrow: 0 },
    filterTab: { paddingHorizontal: Spacing.base, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
    filterText: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-Medium', color: Colors.text.secondary, textTransform: 'capitalize' },
    list: { padding: Spacing.base },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
    orderId: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    badge: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { fontSize: 10, fontFamily: 'Poppins-Bold', textTransform: 'capitalize' },
    total: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginLeft: 'auto' as any },
    address: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, marginBottom: Spacing.sm },
    cardBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
    meta: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    confirmBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: 4, marginLeft: 'auto' as any },
    confirmBtnText: { color: '#fff', fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold' },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { color: Colors.text.secondary, fontSize: Typography.fontSize.base },
});
