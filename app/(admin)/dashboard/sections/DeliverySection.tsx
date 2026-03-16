import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Switch, ScrollView, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import {
    getAllDeliveryPartners, togglePartnerOnline, getPartnerOrders,
} from '@/services/deliveryPartners.service';
import type { DeliveryPartner } from '@/types';

type Filter = 'all' | 'online' | 'offline';

export default function DeliverySection() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<Filter>('all');
    const [selected, setSelected] = useState<DeliveryPartner | null>(null);
    const [partnerOrders, setPartnerOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const { data: partners = [], isLoading } = useQuery({
        queryKey: ['admin-delivery-section'],
        queryFn: getAllDeliveryPartners,
    });

    const filtered = filter === 'all' ? partners : partners.filter(p => filter === 'online' ? p.isOnline : !p.isOnline);

    const openDetail = async (p: DeliveryPartner) => {
        setSelected(p); setLoadingOrders(true); setPartnerOrders([]);
        try { setPartnerOrders(await getPartnerOrders(p.uid)); }
        finally { setLoadingOrders(false); }
    };

    const handleToggle = async (p: DeliveryPartner) => {
        await togglePartnerOnline(p.uid, !p.isOnline);
        queryClient.invalidateQueries({ queryKey: ['admin-delivery-section'] });
        if (selected?.uid === p.uid) setSelected({ ...p, isOnline: !p.isOnline });
    };

    return (
        <View style={{ flex: 1, flexDirection: 'row' }}>
            {/* List Panel */}
            <View style={{ flex: selected ? 1 : 2 }}>
                <View style={styles.toolbar}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {(['all','online','offline'] as Filter[]).map(f => (
                            <TouchableOpacity key={f} style={[styles.filterTab, filter === f && { backgroundColor: f === 'online' ? Colors.success : f === 'offline' ? Colors.text.disabled : Colors.primary, borderColor: 'transparent' }]} onPress={() => setFilter(f)}>
                                <Text style={[styles.filterText, filter === f && { color: '#fff' }]}>{f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? partners.length : partners.filter(p => f === 'online' ? p.isOnline : !p.isOnline).length})</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                {isLoading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} /> : (
                    <FlatList
                        data={filtered}
                        keyExtractor={p => p.uid}
                        contentContainerStyle={styles.list}
                        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                        ListEmptyComponent={<View style={styles.empty}><MaterialCommunityIcons name="moped-outline" size={64} color={Colors.text.disabled} /><Text style={styles.emptyText}>No partners found</Text></View>}
                        renderItem={({ item: p }) => (
                            <TouchableOpacity style={[styles.card, selected?.uid === p.uid && { borderWidth: 2, borderColor: Colors.primary }]} onPress={() => openDetail(p)}>
                                <View style={[styles.avatar, { backgroundColor: p.isOnline ? Colors.primaryLight : Colors.background }]}>
                                    {p.photoURL ? <Image source={{ uri: p.photoURL }} style={styles.avatar} contentFit="cover" /> : <MaterialCommunityIcons name="account" size={24} color={p.isOnline ? Colors.primary : Colors.text.disabled} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.partnerName}>{p.name}</Text>
                                    <Text style={styles.partnerMeta}>{p.phone}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <View style={[styles.onlineDot, { backgroundColor: p.isOnline ? Colors.success : Colors.text.disabled }]} />
                                        <Text style={{ fontSize: Typography.fontSize.xs, color: p.isOnline ? Colors.success : Colors.text.disabled }}>{p.isOnline ? 'Online' : 'Offline'}</Text>
                                    </View>
                                </View>
                                <Switch value={!!p.isOnline} onValueChange={() => handleToggle(p)} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={p.isOnline ? Colors.primary : '#ccc'} />
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.partnerMeta}>⭐ {p.rating?.toFixed(1) ?? '—'}</Text>
                                    <Text style={styles.partnerMeta}>{p.totalDeliveries ?? 0} orders</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>

            {/* Detail Panel */}
            {selected && (
                <View style={styles.detailPanel}>
                    <View style={styles.detailHeader}>
                        <Text style={styles.detailTitle}>{selected.name}</Text>
                        <TouchableOpacity onPress={() => setSelected(null)}><MaterialIcons name="close" size={20} color={Colors.text.primary} /></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: Spacing.base }}>
                        <View style={styles.detailCard}>
                            <Text style={styles.sectionLabel}>Earnings</Text>
                            {[['Today', selected.earnings?.today], ['Week', selected.earnings?.thisWeek], ['Month', selected.earnings?.thisMonth], ['Total', selected.earnings?.total]].map(([l, v]) => (
                                <View key={l as string} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={styles.partnerMeta}>{l}</Text><Text style={{ fontFamily: 'Poppins-Bold', color: Colors.text.primary }}>₹{v ?? 0}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={[styles.detailCard, { marginTop: Spacing.sm }]}>
                            <Text style={styles.sectionLabel}>Recent Deliveries</Text>
                            {loadingOrders ? <ActivityIndicator color={Colors.primary} /> : partnerOrders.slice(0, 5).map(o => (
                                <View key={o.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                                    <Text style={styles.partnerMeta}>#{o.id.slice(-6).toUpperCase()}</Text>
                                    <Text style={{ fontFamily: 'Poppins-Medium', fontSize: Typography.fontSize.sm, color: Colors.text.primary }}>₹{o.total}</Text>
                                    <Text style={{ fontSize: Typography.fontSize.xs, color: (Colors.status as any)[o.status] ?? '#999' }}>{o.status}</Text>
                                </View>
                            ))}
                            {!loadingOrders && partnerOrders.length === 0 && <Text style={styles.partnerMeta}>No deliveries yet</Text>}
                        </View>
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    toolbar: { flexDirection: 'row', padding: Spacing.sm, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    filterTab: { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
    filterText: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-Medium', color: Colors.text.secondary },
    list: { padding: Spacing.base },
    card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    partnerName: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    partnerMeta: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    onlineDot: { width: 6, height: 6, borderRadius: 3 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { color: Colors.text.secondary, fontSize: Typography.fontSize.base },
    detailPanel: { width: 280, backgroundColor: Colors.surface, borderLeftWidth: 1, borderLeftColor: Colors.border },
    detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border },
    detailTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    detailCard: { backgroundColor: Colors.background, borderRadius: BorderRadius.xl, padding: Spacing.base },
    sectionLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
});
