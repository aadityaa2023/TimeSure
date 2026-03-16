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
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
    serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadImage } from '@/services/storage.service';
import type { Banner } from '@/types';

type BannerDoc = Banner & { _docId: string };

const EMPTY_FORM = { imageUrl: '', targetScreen: '', targetId: '', order: 0, isActive: true };

const fetchBanners = async (): Promise<BannerDoc[]> => {
    const q = query(collection(db, 'banners'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ _docId: d.id, ...(d.data() as Banner) }));
};

export default function AdminBannersScreen() {
    const queryClient = useQueryClient();
    const [modalVisible, setModalVisible] = useState(false);
    const [editTarget, setEditTarget] = useState<BannerDoc | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [localImageUri, setLocalImageUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const { data: banners = [], isLoading } = useQuery({
        queryKey: ['admin-banners'],
        queryFn: fetchBanners,
    });

    const openAdd = () => {
        setEditTarget(null);
        setForm({ ...EMPTY_FORM, order: banners.length });
        setLocalImageUri(null);
        setModalVisible(true);
    };

    const openEdit = (b: BannerDoc) => {
        setEditTarget(b);
        setForm({ imageUrl: b.imageUrl, targetScreen: b.targetScreen ?? '', targetId: b.targetId ?? '', order: b.order, isActive: b.isActive });
        setLocalImageUri(null);
        setModalVisible(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 6], quality: 0.85 });
        if (!result.canceled) setLocalImageUri(result.assets[0].uri);
    };

    const handleSave = async () => {
        if (!localImageUri && !form.imageUrl) {
            Alert.alert('Required', 'Please provide a banner image.');
            return;
        }
        setSaving(true);
        try {
            let imageUrl = form.imageUrl;
            if (localImageUri) {
                imageUrl = await uploadImage(localImageUri, `banners/banner_${Date.now()}.jpg`);
            }
            const data: Record<string, any> = {
                imageUrl,
                order: form.order,
                isActive: form.isActive,
            };
            if (form.targetScreen) data.targetScreen = form.targetScreen.trim();
            if (form.targetId) data.targetId = form.targetId.trim();

            if (editTarget) {
                await updateDoc(doc(db, 'banners', editTarget._docId), { ...data, updatedAt: serverTimestamp() });
            } else {
                await addDoc(collection(db, 'banners'), { ...data, createdAt: serverTimestamp() });
            }
            queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
            setModalVisible(false);
        } catch {
            Alert.alert('Error', 'Failed to save banner.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (b: BannerDoc) => {
        if (Platform.OS === 'web') {
            if (!window.confirm('Delete this banner?')) return;
            deleteDoc(doc(db, 'banners', b._docId)).then(() => queryClient.invalidateQueries({ queryKey: ['admin-banners'] }));
        } else {
            Alert.alert('Delete', 'Delete this banner?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteDoc(doc(db, 'banners', b._docId)).then(() => queryClient.invalidateQueries({ queryKey: ['admin-banners'] })) },
            ]);
        }
    };

    const toggleActive = async (b: BannerDoc) => {
        await updateDoc(doc(db, 'banners', b._docId), { isActive: !b.isActive });
        queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    };

    const renderBanner = ({ item }: { item: BannerDoc }) => (
        <View style={styles.card}>
            <Image
                source={{ uri: item.imageUrl }}
                style={styles.bannerPreview}
                contentFit="cover"
                placeholder={{ color: Colors.border }}
            />
            <View style={styles.bannerMeta}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.bannerOrder}>Order: {item.order}</Text>
                    {item.targetScreen && <Text style={styles.bannerTarget}>→ {item.targetScreen}{item.targetId ? `/${item.targetId}` : ''}</Text>}
                </View>
                <Switch value={item.isActive} onValueChange={() => toggleActive(item)} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={item.isActive ? Colors.primary : '#ccc'} />
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}><MaterialIcons name="edit" size={18} color={Colors.info} /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}><MaterialIcons name="delete" size={18} color={Colors.error} /></TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Banners ({banners.length})</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : (
                <FlatList
                    data={banners}
                    keyExtractor={b => b._docId}
                    renderItem={renderBanner}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={
                        <View style={styles.emptyCenter}>
                            <MaterialIcons name="photo-library" size={64} color={Colors.text.disabled} />
                            <Text style={styles.emptyText}>No banners yet. Upload your first promotional banner!</Text>
                        </View>
                    }
                />
            )}

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color={Colors.text.primary} /></TouchableOpacity>
                        <Text style={styles.modalTitle}>{editTarget ? 'Edit Banner' : 'New Banner'}</Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: Spacing.base }}>
                        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                            {localImageUri || form.imageUrl ? (
                                <Image source={{ uri: localImageUri ?? form.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                            ) : (
                                <View style={{ alignItems: 'center', gap: 8 }}>
                                    <MaterialIcons name="add-photo-alternate" size={40} color={Colors.text.disabled} />
                                    <Text style={{ color: Colors.text.disabled, fontSize: Typography.fontSize.sm }}>Tap to select banner image</Text>
                                    <Text style={{ color: Colors.text.disabled, fontSize: Typography.fontSize.xs }}>Recommended: 1200×450px</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Image URL (or pick above)</Text>
                            <TextInput style={styles.input} value={form.imageUrl} onChangeText={v => setForm(f => ({ ...f, imageUrl: v }))} placeholder="https://..." placeholderTextColor={Colors.text.disabled} />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Target Screen (optional)</Text>
                            <TextInput style={styles.input} value={form.targetScreen} onChangeText={v => setForm(f => ({ ...f, targetScreen: v }))} placeholder="e.g. product, category" placeholderTextColor={Colors.text.disabled} />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Target ID (optional)</Text>
                            <TextInput style={styles.input} value={form.targetId} onChangeText={v => setForm(f => ({ ...f, targetId: v }))} placeholder="Product/Category ID" placeholderTextColor={Colors.text.disabled} />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Display Order</Text>
                            <TextInput style={styles.input} value={form.order.toString()} onChangeText={v => setForm(f => ({ ...f, order: parseInt(v) || 0 }))} placeholder="0" placeholderTextColor={Colors.text.disabled} keyboardType="numeric" />
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
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
    bannerPreview: { width: '100%', height: 160, backgroundColor: Colors.border },
    bannerMeta: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.sm },
    bannerOrder: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    bannerTarget: { fontSize: Typography.fontSize.xs, color: Colors.info },
    iconBtn: { padding: 4 },
    emptyCenter: { alignItems: 'center', paddingTop: 80, gap: Spacing.base },
    emptyText: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, textAlign: 'center' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
    modalTitle: { fontSize: Typography.fontSize.lg, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 8, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
    imagePicker: { height: 160, backgroundColor: Colors.border, borderRadius: BorderRadius.xl, marginBottom: Spacing.base, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
    formGroup: { marginBottom: Spacing.base },
    formLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontSize: Typography.fontSize.base, color: Colors.text.primary },
});
