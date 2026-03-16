import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, Modal, ScrollView, Switch, Platform,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';
import {
    getAllCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCouponActive,
} from '@/services/coupons.service';
import type { Coupon } from '@/types';

type CouponDoc = Coupon & { _docId: string };
const EMPTY: Partial<Coupon> = { code: '', description: '', discountType: 'percentage', discountValue: 0, minOrderValue: 0, maxDiscount: 0, isActive: true, usageLimit: 100 };

export default function CouponsSection() {
    const queryClient = useQueryClient();
    const inv = () => queryClient.invalidateQueries({ queryKey: ['admin-coupons-section'] });
    const [modal, setModal] = useState(false);
    const [editItem, setEditItem] = useState<CouponDoc | null>(null);
    const [form, setForm] = useState<Partial<Coupon>>({ ...EMPTY });
    const [saving, setSaving] = useState(false);
    const F = (k: string) => (v: any) => setForm(f => ({ ...f, [k]: v }));

    const { data: coupons = [], isLoading } = useQuery({
        queryKey: ['admin-coupons-section'],
        queryFn: async () => {
            const raw = await getAllCoupons();
            // getAllCoupons returns {code: docId, ...data}. We store docId as _docId for delete/update.
            return raw.map((c: any) => ({ ...c, _docId: c._docId ?? c.code }) as CouponDoc);
        },
    });

    const openAdd = () => { setEditItem(null); setForm({ ...EMPTY }); setModal(true); };
    const openEdit = (c: CouponDoc) => { setEditItem(c); setForm({ ...EMPTY, ...c }); setModal(true); };

    const handleSave = async () => {
        if (!form.code?.trim() || !form.discountValue) { Alert.alert('Required', 'Code and discount value required.'); return; }
        setSaving(true);
        try {
            const data: any = {
                ...form,
                code: form.code!.trim().toUpperCase(),
                discountValue: +form.discountValue,
                minOrderValue: +(form.minOrderValue ?? 0),
                maxDiscount: +(form.maxDiscount ?? 0),
                usageLimit: +(form.usageLimit ?? 100),
                expiresAt: (form as any).expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };
            editItem ? await updateCoupon(editItem._docId, data) : await createCoupon(data);
            inv(); setModal(false);
        } catch { Alert.alert('Error', 'Failed to save coupon.'); }
        finally { setSaving(false); }
    };

    const handleDelete = (c: CouponDoc) => {
        const go = () => deleteCoupon(c._docId).then(inv);
        Platform.OS === 'web' ? window.confirm(`Delete "${c.code}"?`) && go() : Alert.alert('Delete', `Delete coupon "${c.code}"?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: go }]);
    };

    const handleToggle = async (c: CouponDoc) => {
        await toggleCouponActive(c._docId, !c.isActive);
        inv();
    };

    const isExpired = (c: Coupon) => !!(c as any).expiresAt && new Date((c as any).expiresAt) < new Date();

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.toolbar}>
                <Text style={styles.count}>{coupons.length} coupons</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}><MaterialIcons name="add" size={18} color="#fff" /><Text style={styles.addBtnText}>Add Coupon</Text></TouchableOpacity>
            </View>
            {isLoading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} /> : (
                <FlatList
                    data={coupons as CouponDoc[]}
                    keyExtractor={c => c._docId}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="confirmation-number" size={64} color={Colors.text.disabled} /><Text style={styles.emptyText}>No coupons yet</Text></View>}
                    renderItem={({ item: c }) => {
                        const expired = isExpired(c);
                        return (
                            <View style={styles.card}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 }}>
                                    <View style={styles.codeBox}><Text style={styles.codeText}>{c.code}</Text></View>
                                    {expired && <View style={styles.expiredBadge}><Text style={styles.expiredText}>EXPIRED</Text></View>}
                                    <Switch value={!!c.isActive && !expired} onValueChange={() => { if (!expired) handleToggle(c); }} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={c.isActive ? Colors.primary : '#ccc'} disabled={!!expired} style={{ marginLeft: 'auto' as any }} />
                                    <TouchableOpacity onPress={() => openEdit(c)}><MaterialIcons name="edit" size={18} color={Colors.info} /></TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(c)}><MaterialIcons name="delete" size={18} color={Colors.error} /></TouchableOpacity>
                                </View>
                                <Text style={styles.desc}>{c.description}</Text>
                                <View style={styles.metaRow}>
                                    <Text style={styles.metaText}>{c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}</Text>
                                    {(c.minOrderValue ?? 0) > 0 && <Text style={styles.metaText}>· Min ₹{c.minOrderValue}</Text>}
                                    {(c.maxDiscount ?? 0) > 0 && <Text style={styles.metaText}>· Max ₹{c.maxDiscount}</Text>}
                                    {(c as any).expiresAt && <Text style={[styles.metaText, expired && { color: Colors.error }]}>· Exp {new Date((c as any).expiresAt).toLocaleDateString('en-IN')}</Text>}
                                    <Text style={styles.metaText}>· Used {c.usedCount ?? 0}/{c.usageLimit ?? '∞'}</Text>
                                </View>
                            </View>
                        );
                    }}
                />
            )}
            <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
                <View style={{ flex: 1, backgroundColor: Colors.background }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModal(false)}><MaterialIcons name="close" size={24} color={Colors.text.primary} /></TouchableOpacity>
                        <Text style={styles.modalTitle}>{editItem ? 'Edit Coupon' : 'New Coupon'}</Text>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: Spacing.base }}>
                        {[
                            { label: 'Code *', key: 'code', ph: 'e.g. SAVE20', upper: true },
                            { label: 'Description', key: 'description', ph: 'Coupon description' },
                            { label: 'Discount Value *', key: 'discountValue', ph: '20', numeric: true },
                            { label: 'Min Order ₹', key: 'minOrderValue', ph: '0', numeric: true },
                            { label: 'Max Discount ₹', key: 'maxDiscount', ph: '0', numeric: true },
                            { label: 'Usage Limit', key: 'usageLimit', ph: '100', numeric: true },
                        ].map(f => (
                            <View key={f.key} style={styles.formGroup}>
                                <Text style={styles.formLabel}>{f.label}</Text>
                                <TextInput style={styles.input} value={String((form as any)[f.key] ?? '')} onChangeText={F(f.key)} placeholder={f.ph} placeholderTextColor={Colors.text.disabled} keyboardType={f.numeric ? 'numeric' : 'default'} autoCapitalize={f.upper ? 'characters' : 'none'} />
                            </View>
                        ))}
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Discount Type</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {(['percentage','flat'] as const).map(t => (
                                    <TouchableOpacity key={t} style={[styles.chip, form.discountType === t && styles.chipActive]} onPress={() => setForm(f => ({ ...f, discountType: t }))}>
                                        <Text style={[form.discountType === t ? styles.chipTextActive : styles.chipText]}>{t === 'percentage' ? '% Off' : '₹ Flat'}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.formLabel}>Active</Text>
                            <Switch value={!!form.isActive} onValueChange={v => setForm(f => ({ ...f, isActive: v }))} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={form.isActive ? Colors.primary : '#ccc'} />
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    count: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 8 },
    addBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
    list: { padding: Spacing.base },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
    codeBox: { backgroundColor: Colors.primary + '15', borderRadius: BorderRadius.md, paddingHorizontal: 10, paddingVertical: 4 },
    codeText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.primary, letterSpacing: 1 },
    expiredBadge: { backgroundColor: Colors.error + '20', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
    expiredText: { fontSize: 9, fontFamily: 'Poppins-Bold', color: Colors.error },
    desc: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginBottom: 4 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    metaText: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { color: Colors.text.secondary, fontSize: Typography.fontSize.base },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
    modalTitle: { fontSize: Typography.fontSize.lg, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 8 },
    saveBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
    formGroup: { marginBottom: Spacing.base },
    formLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontSize: Typography.fontSize.base, color: Colors.text.primary },
    chip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg },
    chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    chipText: { fontSize: Typography.fontSize.sm, color: Colors.text.primary },
    chipTextActive: { color: Colors.primary, fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
});
