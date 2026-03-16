import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, Modal, ScrollView, Switch, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadProductImage } from '@/services/storage.service';
import { getCategories } from '@/services/products.service';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Product } from '@/types';

const EMPTY: Partial<Product> & { description: string } = { name: '', price: 0, mrp: 0, stock: 0, brand: '', unit: '', categoryId: '', description: '', isActive: true, isFeatured: false };

export default function ProductsSection() {
    const queryClient = useQueryClient();
    const [modal, setModal] = useState(false);
    const [edit, setEdit] = useState<(Product & { description: string }) | null>(null);
    const [form, setForm] = useState({ ...EMPTY });
    const [imgUri, setImgUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const F = (k: string) => (v: any) => setForm(f => ({ ...f, [k]: v }));

    const { data: products = [], isLoading } = useQuery({
        queryKey: ['admin-products-list'],
        queryFn: async () => {
            const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
            return snap.docs.map(d => ({ id: d.id, ...d.data() as any })) as Product[];
        },
    });

    const { data: categories = [] } = useQuery({ queryKey: ['admin-categories'], queryFn: getCategories });

    const filtered = products.filter(p =>
        !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase())
    );

    const openAdd = () => { setEdit(null); setForm({ ...EMPTY }); setImgUri(null); setModal(true); };
    const openEdit = (p: Product) => { setEdit(p as any); setForm({ ...EMPTY, ...p } as any); setImgUri(null); setModal(true); };

    const pickImage = async () => {
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
        if (!r.canceled) setImgUri(r.assets[0].uri);
    };

    const handleSave = async () => {
        if (!form.name || !form.price) { Alert.alert('Required', 'Name and price required.'); return; }
        setSaving(true);
        try {
            const pid = edit?.id ?? `prod_${Date.now()}`;
            let imageUrl = (form as any).imageUrl ?? '';
            if (imgUri && !imgUri.startsWith('http')) imageUrl = await uploadProductImage(pid, imgUri);
            const data: any = { ...form, imageUrl, price: +form.price!, mrp: +(form.mrp || form.price!), stock: +(form.stock ?? 0), updatedAt: serverTimestamp() };
            if (!edit) data.createdAt = serverTimestamp();
            edit ? await updateDoc(doc(db, 'products', pid), data) : await setDoc(doc(db, 'products', pid), data);
            queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
            setModal(false);
        } catch { Alert.alert('Error', 'Failed to save.'); }
        finally { setSaving(false); }
    };

    const handleDelete = (p: Product) => {
        const go = () => deleteDoc(doc(db, 'products', p.id)).then(() => queryClient.invalidateQueries({ queryKey: ['admin-products-list'] }));
        Platform.OS === 'web' ? window.confirm('Delete product?') && go() : Alert.alert('Delete', 'Delete product?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: go }]);
    };

    const toggleActive = async (p: Product) => {
        await updateDoc(doc(db, 'products', p.id), { isActive: !p.isActive });
        queryClient.invalidateQueries({ queryKey: ['admin-products-list'] });
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Toolbar */}
            <View style={styles.toolbar}>
                <View style={styles.searchBox}>
                    <MaterialIcons name="search" size={18} color={Colors.text.disabled} />
                    <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search products..." placeholderTextColor={Colors.text.disabled} />
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Add Product</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} /> : (
                <FlatList
                    data={filtered}
                    keyExtractor={p => p.id}
                    numColumns={Platform.OS === 'web' ? 3 : 1}
                    key={Platform.OS === 'web' ? 'grid' : 'list'}
                    contentContainerStyle={styles.grid}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={<View style={styles.empty}><MaterialCommunityIcons name="package-variant" size={64} color={Colors.text.disabled} /><Text style={styles.emptyText}>No products found</Text></View>}
                    renderItem={({ item: p }) => (
                        <View style={styles.productCard}>
                            {p.imageUrl ? <Image source={{ uri: p.imageUrl }} style={styles.productImg} contentFit="contain" /> : <View style={[styles.productImg, { backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' }]}><MaterialCommunityIcons name="package-variant-closed" size={32} color={Colors.primary} /></View>}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
                                <Text style={styles.productMeta}>{p.brand} · {p.unit}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                    <Text style={styles.productPrice}>₹{p.price}</Text>
                                    {p.mrp > p.price && <Text style={styles.productMrp}>₹{p.mrp}</Text>}
                                </View>
                                <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.secondary }}>Stock: {p.stock}</Text>
                            </View>
                            <View style={{ gap: 6 }}>
                                <Switch value={!!p.isActive} onValueChange={() => toggleActive(p)} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={p.isActive ? Colors.primary : '#ccc'} />
                                <TouchableOpacity onPress={() => openEdit(p)}><MaterialIcons name="edit" size={18} color={Colors.info} /></TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(p)}><MaterialIcons name="delete" size={18} color={Colors.error} /></TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}

            {/* Add/Edit Modal */}
            <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
                <View style={{ flex: 1, backgroundColor: Colors.background }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModal(false)}><MaterialIcons name="close" size={24} color={Colors.text.primary} /></TouchableOpacity>
                        <Text style={styles.modalTitle}>{edit ? 'Edit Product' : 'New Product'}</Text>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: Spacing.base }}>
                        <TouchableOpacity style={styles.imgPicker} onPress={pickImage}>
                            {imgUri || (form as any).imageUrl ? <Image source={{ uri: imgUri ?? (form as any).imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" /> : <View style={{ alignItems: 'center', gap: 8 }}><MaterialIcons name="add-a-photo" size={32} color={Colors.text.disabled} /><Text style={{ color: Colors.text.disabled, fontSize: Typography.fontSize.sm }}>Add Image</Text></View>}
                        </TouchableOpacity>
                        {[
                            { label: 'Name *', key: 'name', ph: 'Product name' },
                            { label: 'Brand',  key: 'brand', ph: 'e.g. Amul' },
                            { label: 'Unit',   key: 'unit',  ph: 'e.g. 500g, 1L' },
                            { label: 'Price *', key: 'price', ph: '99', numeric: true },
                            { label: 'MRP',    key: 'mrp',   ph: '120', numeric: true },
                            { label: 'Stock',  key: 'stock', ph: '0', numeric: true },
                        ].map(f => (
                            <View key={f.key} style={styles.formGroup}>
                                <Text style={styles.formLabel}>{f.label}</Text>
                                <TextInput style={styles.input} value={String((form as any)[f.key] ?? '')} onChangeText={F(f.key)} placeholder={f.ph} placeholderTextColor={Colors.text.disabled} keyboardType={f.numeric ? 'numeric' : 'default'} />
                            </View>
                        ))}
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {categories.map(c => (
                                    <TouchableOpacity key={c.id} style={[styles.chip, (form as any).categoryId === c.id && styles.chipActive]} onPress={() => setForm(f => ({ ...f, categoryId: c.id }))}>
                                        <Text style={[(form as any).categoryId === c.id ? styles.chipTextActive : styles.chipText]}>{c.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Description</Text>
                            <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} value={(form as any).description ?? ''} onChangeText={F('description')} multiline placeholder="Description..." placeholderTextColor={Colors.text.disabled} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.base }}>
                            <Text style={styles.formLabel}>Featured Product</Text>
                            <Switch value={!!(form as any).isFeatured} onValueChange={v => setForm(f => ({ ...f, isFeatured: v }))} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={(form as any).isFeatured ? Colors.primary : '#ccc'} />
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    toolbar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.background, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
    searchInput: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.text.primary },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 8 },
    addBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
    grid: { padding: Spacing.base },
    productCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.base, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, marginHorizontal: Platform.OS === 'web' ? Spacing.xs : 0, ...Shadows.sm },
    productImg: { width: 56, height: 56, borderRadius: BorderRadius.md },
    productName: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    productMeta: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    productPrice: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.primary },
    productMrp: { fontSize: Typography.fontSize.xs, color: Colors.text.disabled, textDecorationLine: 'line-through' },
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
    chip: { paddingHorizontal: Spacing.base, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
    chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    chipText: { fontSize: Typography.fontSize.sm, color: Colors.text.primary },
    chipTextActive: { color: Colors.primary, fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
});
