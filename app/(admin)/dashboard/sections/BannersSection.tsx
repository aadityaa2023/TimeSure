import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, Modal, ScrollView, Switch, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadImage } from '@/services/storage.service';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';

const fetchBanners = async () => {
    const snap = await getDocs(query(collection(db, 'banners'), orderBy('order','asc')));
    return snap.docs.map(d => ({ _id: d.id, ...d.data() as any }));
};

export default function BannersSection() {
    const queryClient = useQueryClient();
    const inv = () => queryClient.invalidateQueries({ queryKey: ['admin-banners-section'] });
    const [modal, setModal] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [form, setForm] = useState({ imageUrl: '', targetScreen: '', targetId: '', order: 0, isActive: true });
    const [imgUri, setImgUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const { data: banners = [], isLoading } = useQuery({ queryKey: ['admin-banners-section'], queryFn: fetchBanners });

    const openAdd = () => { setEditItem(null); setForm({ imageUrl: '', targetScreen: '', targetId: '', order: banners.length, isActive: true }); setImgUri(null); setModal(true); };
    const openEdit = (b: any) => { setEditItem(b); setForm({ imageUrl: b.imageUrl, targetScreen: b.targetScreen ?? '', targetId: b.targetId ?? '', order: b.order, isActive: b.isActive }); setImgUri(null); setModal(true); };

    const pickImage = async () => {
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16,6], quality: 0.85 });
        if (!r.canceled) setImgUri(r.assets[0].uri);
    };

    const handleSave = async () => {
        if (!imgUri && !form.imageUrl) { Alert.alert('Required', 'Please add an image.'); return; }
        setSaving(true);
        try {
            let imageUrl = form.imageUrl;
            if (imgUri && !imgUri.startsWith('http')) imageUrl = await uploadImage(imgUri, `banners/banner_${Date.now()}.jpg`);
            const data: any = { imageUrl, order: +form.order, isActive: form.isActive };
            if (form.targetScreen) data.targetScreen = form.targetScreen.trim();
            if (form.targetId) data.targetId = form.targetId.trim();
            if (editItem) await updateDoc(doc(db, 'banners', editItem._id), { ...data, updatedAt: serverTimestamp() });
            else await addDoc(collection(db, 'banners'), { ...data, createdAt: serverTimestamp() });
            inv(); setModal(false);
        } catch { Alert.alert('Error', 'Failed to save banner.'); }
        finally { setSaving(false); }
    };

    const handleDelete = (b: any) => {
        const go = () => deleteDoc(doc(db, 'banners', b._id)).then(inv);
        Platform.OS === 'web' ? window.confirm('Delete this banner?') && go() : Alert.alert('Delete', 'Delete banner?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: go }]);
    };

    const toggleActive = (b: any) => updateDoc(doc(db, 'banners', b._id), { isActive: !b.isActive }).then(inv);

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.toolbar}>
                <Text style={styles.count}>{banners.length} banners</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}><MaterialIcons name="add" size={18} color="#fff" /><Text style={styles.addBtnText}>Add Banner</Text></TouchableOpacity>
            </View>
            {isLoading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} /> : (
                <FlatList
                    data={banners}
                    keyExtractor={b => b._id}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="photo-library" size={64} color={Colors.text.disabled} /><Text style={styles.emptyText}>No banners yet</Text></View>}
                    renderItem={({ item: b }) => (
                        <View style={styles.card}>
                            <Image source={{ uri: b.imageUrl }} style={styles.bannerImg} contentFit="cover" />
                            <View style={styles.cardMeta}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.bannerOrder}>Order: {b.order}</Text>
                                    {b.targetScreen && <Text style={styles.bannerTarget}>→ {b.targetScreen}{b.targetId ? `/${b.targetId}` : ''}</Text>}
                                </View>
                                <Switch value={!!b.isActive} onValueChange={() => toggleActive(b)} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={b.isActive ? Colors.primary : '#ccc'} />
                                <TouchableOpacity onPress={() => openEdit(b)} style={{ padding: 4 }}><MaterialIcons name="edit" size={18} color={Colors.info} /></TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(b)} style={{ padding: 4 }}><MaterialIcons name="delete" size={18} color={Colors.error} /></TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}
            <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
                <View style={{ flex: 1, backgroundColor: Colors.background }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModal(false)}><MaterialIcons name="close" size={24} color={Colors.text.primary} /></TouchableOpacity>
                        <Text style={styles.modalTitle}>{editItem ? 'Edit Banner' : 'New Banner'}</Text>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: Spacing.base }}>
                        <TouchableOpacity style={styles.imgPicker} onPress={pickImage}>
                            {imgUri || form.imageUrl ? <Image source={{ uri: imgUri ?? form.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <View style={{ alignItems: 'center', gap: 8 }}><MaterialIcons name="add-photo-alternate" size={32} color={Colors.text.disabled} /><Text style={{ color: Colors.text.disabled }}>Add Banner Image (16:6)</Text></View>}
                        </TouchableOpacity>
                        {[
                            { label: 'Image URL (optional)', key: 'imageUrl', ph: 'https://...' },
                            { label: 'Target Screen', key: 'targetScreen', ph: 'e.g. product, category' },
                            { label: 'Target ID', key: 'targetId', ph: 'Product/Category ID' },
                            { label: 'Display Order', key: 'order', ph: '0', numeric: true },
                        ].map(f => (
                            <View key={f.key} style={styles.formGroup}>
                                <Text style={styles.formLabel}>{f.label}</Text>
                                <TextInput style={styles.input} value={String((form as any)[f.key] ?? '')} onChangeText={v => setForm(x => ({ ...x, [f.key]: v }))} placeholder={f.ph} placeholderTextColor={Colors.text.disabled} keyboardType={f.numeric ? 'numeric' : 'default'} />
                            </View>
                        ))}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.formLabel}>Active</Text>
                            <Switch value={form.isActive} onValueChange={v => setForm(f => ({ ...f, isActive: v }))} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={form.isActive ? Colors.primary : '#ccc'} />
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
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
    bannerImg: { width: '100%', height: 150, backgroundColor: Colors.border },
    cardMeta: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.sm },
    bannerOrder: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    bannerTarget: { fontSize: Typography.fontSize.xs, color: Colors.info },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { color: Colors.text.secondary, fontSize: Typography.fontSize.base },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
    modalTitle: { fontSize: Typography.fontSize.lg, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 8 },
    saveBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
    imgPicker: { height: 140, backgroundColor: Colors.border, borderRadius: BorderRadius.xl, marginBottom: Spacing.base, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
    formGroup: { marginBottom: Spacing.base },
    formLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontSize: Typography.fontSize.base, color: Colors.text.primary },
});
