import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
    ScrollView,
    Platform,
    Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Coupon } from '@/types';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const EMPTY_FORM = {
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'flat',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    expiresAt: '',
    isActive: true,
    usageLimit: '',
};

const fetchCoupons = async (): Promise<(Coupon & { _docId: string })[]> => {
    const q = query(collection(db, 'coupons'), orderBy('expiresAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ _docId: d.id, ...(d.data() as Coupon) }));
};

export default function AdminCouponsScreen() {
    const queryClient = useQueryClient();
    const [modalVisible, setModalVisible] = useState(false);
    const [editTarget, setEditTarget] = useState<(Coupon & { _docId: string }) | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);

    const { data: coupons = [], isLoading } = useQuery({
        queryKey: ['admin-coupons'],
        queryFn: fetchCoupons,
    });

    const openAdd = () => {
        setEditTarget(null);
        setForm({ ...EMPTY_FORM });
        setModalVisible(true);
    };

    const openEdit = (c: Coupon & { _docId: string }) => {
        setEditTarget(c);
        setForm({
            code: c.code,
            description: c.description,
            discountType: c.discountType,
            discountValue: c.discountValue.toString(),
            minOrderValue: c.minOrderValue.toString(),
            maxDiscount: c.maxDiscount?.toString() ?? '',
            expiresAt: c.expiresAt,
            isActive: c.isActive,
            usageLimit: c.usageLimit.toString(),
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.code.trim() || !form.discountValue || !form.expiresAt) {
            Alert.alert('Required', 'Code, discount value, and expiry date are required.');
            return;
        }
        setSaving(true);
        try {
            const data: Record<string, any> = {
                code: form.code.toUpperCase().trim(),
                description: form.description.trim(),
                discountType: form.discountType,
                discountValue: parseFloat(form.discountValue),
                minOrderValue: parseFloat(form.minOrderValue || '0'),
                expiresAt: form.expiresAt,
                isActive: form.isActive,
                usageLimit: parseInt(form.usageLimit || '0'),
            };
            if (form.maxDiscount) data.maxDiscount = parseFloat(form.maxDiscount);
            if (editTarget) {
                await updateDoc(doc(db, 'coupons', editTarget._docId), data);
            } else {
                data.usedCount = 0;
                await addDoc(collection(db, 'coupons'), data);
            }
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            setModalVisible(false);
        } catch {
            Alert.alert('Error', 'Failed to save coupon.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (c: Coupon & { _docId: string }) => {
        if (Platform.OS === 'web') {
            if (!window.confirm(`Delete coupon "${c.code}"?`)) return;
            deleteDoc(doc(db, 'coupons', c._docId)).then(() => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }));
        } else {
            Alert.alert('Delete', `Delete coupon "${c.code}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteDoc(doc(db, 'coupons', c._docId)).then(() => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })) },
            ]);
        }
    };

    const toggleActive = async (c: Coupon & { _docId: string }) => {
        await updateDoc(doc(db, 'coupons', c._docId), { isActive: !c.isActive });
        queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    };

    const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

    const renderCoupon = ({ item }: { item: Coupon & { _docId: string } }) => {
        const expired = isExpired(item.expiresAt);
        return (
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    <View style={styles.codeChip}>
                        <MaterialCommunityIcons name="ticket-percent" size={16} color={Colors.primary} />
                        <Text style={styles.codeText}>{item.code}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: item.isActive && !expired ? Colors.primaryLight : '#FFEBEE' }]}>
                        <Text style={[styles.statusText, { color: item.isActive && !expired ? Colors.primary : Colors.error }]}>
                            {expired ? 'EXPIRED' : item.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.desc}>{item.description}</Text>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="sale" size={14} color={Colors.text.secondary} />
                        <Text style={styles.metaText}>
                            {item.discountType === 'percentage' ? `${item.discountValue}%` : `₹${item.discountValue}`}
                            {item.discountType === 'percentage' && item.maxDiscount ? ` (max ₹${item.maxDiscount})` : ''}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MaterialIcons name="shopping-cart" size={14} color={Colors.text.secondary} />
                        <Text style={styles.metaText}>Min ₹{item.minOrderValue}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MaterialIcons name="event" size={14} color={Colors.text.secondary} />
                        <Text style={[styles.metaText, expired && { color: Colors.error }]}>{item.expiresAt?.split('T')[0]}</Text>
                    </View>
                </View>
                <View style={styles.cardRow}>
                    <Text style={styles.usageText}>Used: {item.usedCount ?? 0}{item.usageLimit > 0 ? `/${item.usageLimit}` : ''}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Switch value={item.isActive} onValueChange={() => toggleActive(item)} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={item.isActive ? Colors.primary : '#ccc'} />
                        <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}><MaterialIcons name="edit" size={18} color={Colors.info} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}><MaterialIcons name="delete" size={18} color={Colors.error} /></TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Coupons ({coupons.length})</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : (
                <FlatList
                    data={coupons}
                    keyExtractor={c => c._docId}
                    renderItem={renderCoupon}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={
                        <View style={styles.emptyCenter}>
                            <MaterialCommunityIcons name="ticket-percent-outline" size={64} color={Colors.text.disabled} />
                            <Text style={styles.emptyText}>No coupons yet. Create one!</Text>
                        </View>
                    }
                />
            )}

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <MaterialIcons name="close" size={24} color={Colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{editTarget ? 'Edit Coupon' : 'New Coupon'}</Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: Spacing.base }}>
                        {[
                            { label: 'Coupon Code *', key: 'code', placeholder: 'e.g. SAVE20', autoCapitalize: 'characters' as const },
                            { label: 'Description', key: 'description', placeholder: 'e.g. Get 20% off on first order' },
                            { label: 'Discount Value *', key: 'discountValue', placeholder: '20', keyboardType: 'numeric' as const },
                            { label: 'Min Order Value (₹)', key: 'minOrderValue', placeholder: '200', keyboardType: 'numeric' as const },
                            { label: 'Max Discount (₹, for %)', key: 'maxDiscount', placeholder: '100', keyboardType: 'numeric' as const },
                            { label: 'Usage Limit (0 = unlimited)', key: 'usageLimit', placeholder: '0', keyboardType: 'numeric' as const },
                            { label: 'Expires At (YYYY-MM-DD) *', key: 'expiresAt', placeholder: '2025-12-31' },
                        ].map(f => (
                            <View key={f.key} style={styles.formGroup}>
                                <Text style={styles.formLabel}>{f.label}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={(form as any)[f.key]}
                                    onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                                    placeholder={f.placeholder}
                                    placeholderTextColor={Colors.text.disabled}
                                    keyboardType={f.keyboardType}
                                    autoCapitalize={f.autoCapitalize}
                                />
                            </View>
                        ))}

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Discount Type</Text>
                            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                                {(['percentage', 'flat'] as const).map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.typeBtn, form.discountType === t && styles.typeBtnActive]}
                                        onPress={() => setForm(f => ({ ...f, discountType: t }))}
                                    >
                                        <Text style={[styles.typeBtnText, form.discountType === t && styles.typeBtnTextActive]}>
                                            {t === 'percentage' ? 'Percentage (%)' : 'Flat (₹)'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.base }}>
                            <Text style={styles.formLabel}>Active</Text>
                            <Switch value={form.isActive} onValueChange={v => setForm(f => ({ ...f, isActive: v }))} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={form.isActive ? Colors.primary : '#ccc'} />
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 6 },
    addBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
    list: { padding: Spacing.base },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, gap: 8, ...Shadows.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    codeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
    codeText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.primary, letterSpacing: 1 },
    statusBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
    statusText: { fontSize: 9, fontFamily: 'Poppins-Bold', letterSpacing: 0.5 },
    desc: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.base },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    usageText: { fontSize: Typography.fontSize.xs, color: Colors.text.disabled, fontFamily: 'Poppins-Regular' },
    iconBtn: { padding: 4 },
    emptyCenter: { alignItems: 'center', paddingTop: 80, gap: Spacing.base },
    emptyText: { fontSize: Typography.fontSize.base, color: Colors.text.secondary },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
    modalTitle: { fontSize: Typography.fontSize.lg, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 8, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
    formGroup: { marginBottom: Spacing.base },
    formLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontSize: Typography.fontSize.base, color: Colors.text.primary },
    typeBtn: { flex: 1, paddingVertical: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, alignItems: 'center' },
    typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    typeBtnText: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary, fontFamily: 'Poppins-Medium' },
    typeBtnTextActive: { color: Colors.primary },
});
