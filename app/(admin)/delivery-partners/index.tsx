import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    TextInput,
    Platform,
    Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
    getAllDeliveryPartners,
    togglePartnerOnline,
    updateDeliveryPartner,
    getPartnerOrders,
} from '@/services/deliveryPartners.service';
import type { DeliveryPartner } from '@/types';

const VEHICLE_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
    bike: 'motorbike',
    scooter: 'scooter',
    cycle: 'bicycle',
};

export default function AdminDeliveryPartnersScreen() {
    const queryClient = useQueryClient();
    const [filterOnline, setFilterOnline] = useState<boolean | null>(null);
    const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
    const [detailModal, setDetailModal] = useState(false);
    const [partnerOrders, setPartnerOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ vehicleNumber: '', vehicleType: 'bike' as DeliveryPartner['vehicleType'] });
    const [savingEdit, setSavingEdit] = useState(false);

    const { data: partners = [], isLoading } = useQuery({
        queryKey: ['admin-delivery-partners'],
        queryFn: getAllDeliveryPartners,
    });

    const filtered = filterOnline === null ? partners : partners.filter(p => p.isOnline === filterOnline);

    const openPartnerDetail = async (partner: DeliveryPartner) => {
        setSelectedPartner(partner);
        setDetailModal(true);
        setLoadingOrders(true);
        try {
            const orders = await getPartnerOrders(partner.uid);
            setPartnerOrders(orders);
        } catch { setPartnerOrders([]); }
        finally { setLoadingOrders(false); }
    };

    const handleToggleOnline = async (partner: DeliveryPartner) => {
        await togglePartnerOnline(partner.uid, !partner.isOnline);
        queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners'] });
        if (selectedPartner?.uid === partner.uid) {
            setSelectedPartner({ ...partner, isOnline: !partner.isOnline });
        }
    };

    const openEditModal = (p: DeliveryPartner) => {
        setEditForm({ vehicleNumber: p.vehicleNumber ?? '', vehicleType: p.vehicleType ?? 'bike' });
        setEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedPartner) return;
        setSavingEdit(true);
        try {
            await updateDeliveryPartner(selectedPartner.uid, editForm);
            queryClient.invalidateQueries({ queryKey: ['admin-delivery-partners'] });
            setEditModal(false);
        } catch {
            Alert.alert('Error', 'Failed to update partner details.');
        } finally { setSavingEdit(false); }
    };

    const renderPartner = ({ item }: { item: DeliveryPartner }) => (
        <TouchableOpacity style={styles.card} onPress={() => openPartnerDetail(item)} activeOpacity={0.85}>
            <View style={styles.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.base }}>
                    <View style={[styles.avatar, { backgroundColor: item.isOnline ? Colors.primaryLight : Colors.background }]}>
                        {item.photoURL
                            ? <Image source={{ uri: item.photoURL }} style={styles.avatar} contentFit="cover" />
                            : <MaterialCommunityIcons name={VEHICLE_ICONS[item.vehicleType ?? 'bike']} size={26} color={item.isOnline ? Colors.primary : Colors.text.disabled} />
                        }
                    </View>
                    <View>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.phone}>{item.phone}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={[styles.onlineDot, { backgroundColor: item.isOnline ? Colors.success : Colors.text.disabled }]} />
                            <Text style={[styles.onlineLabel, { color: item.isOnline ? Colors.success : Colors.text.disabled }]}>
                                {item.isOnline ? 'Online' : 'Offline'}
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Switch
                        value={item.isOnline}
                        onValueChange={() => handleToggleOnline(item)}
                        trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                        thumbColor={item.isOnline ? Colors.primary : '#ccc'}
                    />
                    <Text style={styles.deliveriesText}>{item.totalDeliveries ?? 0} deliveries</Text>
                </View>
            </View>
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <MaterialIcons name="star" size={14} color={Colors.warning} />
                    <Text style={styles.statText}>{item.rating?.toFixed(1) ?? '—'}</Text>
                </View>
                <View style={styles.statItem}>
                    <MaterialCommunityIcons name={VEHICLE_ICONS[item.vehicleType ?? 'bike']} size={14} color={Colors.text.secondary} />
                    <Text style={styles.statText}>{item.vehicleNumber ?? 'No vehicle'}</Text>
                </View>
                <View style={styles.statItem}>
                    <MaterialIcons name="currency-rupee" size={14} color={Colors.text.secondary} />
                    <Text style={styles.statText}>₹{item.earnings?.total ?? 0} total</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Delivery Partners ({filtered.length})</Text>
                <View style={{ width: 30 }} />
            </View>

            {/* Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}>
                {[null, true, false].map((val, i) => {
                    const label = val === null ? `All (${partners.length})` : val ? `Online (${partners.filter(p => p.isOnline).length})` : `Offline (${partners.filter(p => !p.isOnline).length})`;
                    return (
                        <TouchableOpacity key={i} style={[styles.filterTab, filterOnline === val && styles.filterTabActive]} onPress={() => setFilterOnline(val)}>
                            {val !== null && <View style={[styles.onlineDot, { backgroundColor: val ? Colors.success : Colors.text.disabled }]} />}
                            <Text style={[styles.filterText, filterOnline === val && styles.filterTextActive]}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={p => p.uid}
                    renderItem={renderPartner}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={
                        <View style={styles.emptyCenter}>
                            <MaterialCommunityIcons name="moped-outline" size={64} color={Colors.text.disabled} />
                            <Text style={styles.emptyText}>No delivery partners found</Text>
                        </View>
                    }
                />
            )}

            {/* Partner Detail Modal */}
            <Modal visible={detailModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setDetailModal(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setDetailModal(false)}>
                            <MaterialIcons name="close" size={24} color={Colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Partner Detail</Text>
                        {selectedPartner && (
                            <TouchableOpacity onPress={() => openEditModal(selectedPartner)}>
                                <MaterialIcons name="edit" size={22} color={Colors.info} />
                            </TouchableOpacity>
                        )}
                    </View>
                    {selectedPartner && (
                        <ScrollView contentContainerStyle={{ padding: Spacing.base }}>
                            {/* Profile */}
                            <View style={[styles.card, { alignItems: 'center', gap: Spacing.base }]}>
                                <View style={[styles.bigAvatar, { backgroundColor: selectedPartner.isOnline ? Colors.primaryLight : Colors.background }]}>
                                    {selectedPartner.photoURL
                                        ? <Image source={{ uri: selectedPartner.photoURL }} style={styles.bigAvatar} contentFit="cover" />
                                        : <MaterialCommunityIcons name="account" size={44} color={selectedPartner.isOnline ? Colors.primary : Colors.text.disabled} />
                                    }
                                </View>
                                <Text style={[styles.name, { fontSize: Typography.fontSize.xl }]}>{selectedPartner.name}</Text>
                                <Text style={styles.phone}>{selectedPartner.phone}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={[styles.onlineDot, { backgroundColor: selectedPartner.isOnline ? Colors.success : Colors.text.disabled, width: 10, height: 10 }]} />
                                    <Text style={{ color: selectedPartner.isOnline ? Colors.success : Colors.text.disabled, fontFamily: 'Poppins-Medium' }}>
                                        {selectedPartner.isOnline ? 'Online' : 'Offline'}
                                    </Text>
                                    <Switch
                                        value={selectedPartner.isOnline}
                                        onValueChange={() => handleToggleOnline(selectedPartner)}
                                        trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                                        thumbColor={selectedPartner.isOnline ? Colors.primary : '#ccc'}
                                    />
                                </View>
                            </View>

                            {/* Earnings */}
                            <View style={[styles.card, { marginTop: Spacing.base }]}>
                                <Text style={styles.sectionTitle}>Earnings</Text>
                                {[
                                    { label: 'Today', value: selectedPartner.earnings?.today ?? 0 },
                                    { label: 'This Week', value: selectedPartner.earnings?.thisWeek ?? 0 },
                                    { label: 'This Month', value: selectedPartner.earnings?.thisMonth ?? 0 },
                                    { label: 'Total', value: selectedPartner.earnings?.total ?? 0 },
                                ].map(e => (
                                    <View key={e.label} style={styles.rowBetween}>
                                        <Text style={styles.phone}>{e.label}</Text>
                                        <Text style={{ fontFamily: 'Poppins-Bold', color: Colors.text.primary }}>₹{e.value}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Stats */}
                            <View style={[styles.card, { marginTop: Spacing.base }]}>
                                <Text style={styles.sectionTitle}>Stats</Text>
                                <View style={styles.rowBetween}>
                                    <Text style={styles.phone}>Total Deliveries</Text>
                                    <Text style={{ fontFamily: 'Poppins-Bold', color: Colors.primary }}>{selectedPartner.totalDeliveries ?? 0}</Text>
                                </View>
                                <View style={styles.rowBetween}>
                                    <Text style={styles.phone}>Rating</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <MaterialIcons name="star" size={16} color={Colors.warning} />
                                        <Text style={{ fontFamily: 'Poppins-Bold', color: Colors.text.primary }}>{selectedPartner.rating?.toFixed(1) ?? '—'}</Text>
                                    </View>
                                </View>
                                <View style={styles.rowBetween}>
                                    <Text style={styles.phone}>Vehicle</Text>
                                    <Text style={{ fontFamily: 'Poppins-Medium', color: Colors.text.primary }}>{selectedPartner.vehicleType ?? '—'} · {selectedPartner.vehicleNumber ?? '—'}</Text>
                                </View>
                            </View>

                            {/* Recent Orders */}
                            <View style={[styles.card, { marginTop: Spacing.base }]}>
                                <Text style={styles.sectionTitle}>Recent Deliveries</Text>
                                {loadingOrders ? <ActivityIndicator color={Colors.primary} /> : partnerOrders.length === 0 ? (
                                    <Text style={styles.emptyText}>No deliveries found</Text>
                                ) : partnerOrders.slice(0, 5).map(o => (
                                    <View key={o.id} style={[styles.rowBetween, { paddingVertical: 4 }]}>
                                        <Text style={styles.phone}>#{o.id.slice(-6).toUpperCase()}</Text>
                                        <Text style={{ color: Colors.text.primary, fontFamily: 'Poppins-Medium' }}>₹{o.total}</Text>
                                        <Text style={{ color: Colors.status[o.status as keyof typeof Colors.status] ?? Colors.text.disabled, fontSize: Typography.fontSize.xs }}>{o.status}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>

            {/* Edit Modal */}
            <Modal visible={editModal} animationType="slide" transparent onRequestClose={() => setEditModal(false)}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.base }}>
                        <Text style={[styles.sectionTitle, { marginBottom: Spacing.base }]}>Edit Partner Info</Text>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Vehicle Type</Text>
                            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                                {(['bike', 'scooter', 'cycle'] as const).map(t => (
                                    <TouchableOpacity key={t} style={[styles.typeBtn, editForm.vehicleType === t && styles.typeBtnActive]} onPress={() => setEditForm(f => ({ ...f, vehicleType: t }))}>
                                        <MaterialCommunityIcons name={VEHICLE_ICONS[t]} size={16} color={editForm.vehicleType === t ? Colors.primary : Colors.text.secondary} />
                                        <Text style={[styles.typeBtnText, editForm.vehicleType === t && { color: Colors.primary }]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Vehicle Number</Text>
                            <TextInput style={styles.input} value={editForm.vehicleNumber} onChangeText={v => setEditForm(f => ({ ...f, vehicleNumber: v }))} placeholder="e.g. MH02AB1234" placeholderTextColor={Colors.text.disabled} autoCapitalize="characters" />
                        </View>
                        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                            <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: Colors.border }]} onPress={() => setEditModal(false)}>
                                <Text style={[styles.saveBtnText, { color: Colors.text.primary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleSaveEdit} disabled={savingEdit}>
                                {savingEdit ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                            </TouchableOpacity>
                        </View>
                        <View style={{ height: 20 }} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    filterRow: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.sm, flexGrow: 0 },
    filterTab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.base, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.background },
    filterTabActive: { backgroundColor: Colors.primary },
    filterText: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary, fontFamily: 'Poppins-Medium' },
    filterTextActive: { color: '#fff' },
    list: { padding: Spacing.base },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
    avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    bigAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    name: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    phone: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    onlineDot: { width: 8, height: 8, borderRadius: 4 },
    onlineLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-Medium' },
    deliveriesText: { fontSize: Typography.fontSize.xs, color: Colors.text.disabled },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    statsRow: { flexDirection: 'row', gap: Spacing.base, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    sectionTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.sm },
    emptyCenter: { alignItems: 'center', paddingTop: 80, gap: Spacing.base },
    emptyText: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, textAlign: 'center' },
    formGroup: { marginBottom: Spacing.base },
    formLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    input: { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontSize: Typography.fontSize.base, color: Colors.text.primary },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg },
    typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    typeBtnText: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
    saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.sm, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
});
