import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, Modal, ScrollView,
    Switch, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';
import {
    getCategories, createCategory, updateCategory,
    deleteCategory, toggleCategoryActive, addSubcategory, removeSubcategory,
} from '@/services/categories.service';
import { uploadImage } from '@/services/storage.service';
import type { Category } from '@/types';

const EMPTY_CAT = { name: '', imageUrl: '', isActive: true };

export default function CategoriesSection() {
    const queryClient = useQueryClient();
    const inv = () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] });

    const [modal, setModal] = useState(false);
    const [editCat, setEditCat] = useState<Category | null>(null);
    const [form, setForm] = useState(EMPTY_CAT);
    const [imgUri, setImgUri] = useState<string | null>(null);
    const [subInput, setSubInput] = useState('');
    const [subTarget, setSubTarget] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState<string | null>(null);

    const { data: cats = [], isLoading } = useQuery({ queryKey: ['admin-categories'], queryFn: getCategories });

    const pickImage = async () => {
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.85 });
        if (!r.canceled) setImgUri(r.assets[0].uri);
    };

    const openAdd = () => { setEditCat(null); setForm(EMPTY_CAT); setImgUri(null); setModal(true); };
    const openEdit = (c: Category) => { setEditCat(c); setForm({ name: c.name, imageUrl: c.imageUrl ?? '', isActive: c.isActive }); setImgUri(null); setModal(true); };

    const handleSave = async () => {
        if (!form.name.trim()) { Alert.alert('Required', 'Category name required.'); return; }
        setSaving(true);
        try {
            let imageUrl = form.imageUrl;
            if (imgUri && !imgUri.startsWith('http')) imageUrl = await uploadImage(imgUri, `categories/cat_${Date.now()}.jpg`);
            if (editCat) await updateCategory(editCat.id, { ...form, imageUrl });
            else await createCategory({ ...form, imageUrl });
            inv(); setModal(false);
        } catch { Alert.alert('Error', 'Failed to save category.'); }
        finally { setSaving(false); }
    };

    const handleDelete = (c: Category) => {
        const go = () => deleteCategory(c.id).then(inv);
        Platform.OS === 'web' ? window.confirm(`Delete "${c.name}"?`) && go() : Alert.alert('Delete', `Delete "${c.name}"?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: go }]);
    };

    const handleAddSub = async (cat: Category) => {
        if (!subInput.trim()) return;
        await addSubcategory(cat.id, subInput.trim());
        setSubInput(''); setSubTarget(null); inv();
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.toolbar}>
                <Text style={styles.count}>{cats.length} categories</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Add Category</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} /> : (
                <FlatList
                    data={cats}
                    keyExtractor={c => c.id}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="category" size={64} color={Colors.text.disabled} /><Text style={styles.emptyText}>No categories yet</Text></View>}
                    renderItem={({ item: cat }) => (
                        <View style={styles.card}>
                            <View style={styles.cardRow}>
                                {cat.imageUrl ? <Image source={{ uri: cat.imageUrl }} style={styles.catImg} contentFit="cover" /> : <View style={[styles.catImg, { backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' }]}><MaterialIcons name="category" size={20} color={Colors.primary} /></View>}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.catName}>{cat.name}</Text>
                                    <Text style={styles.catMeta}>{cat.subcategories?.length ?? 0} subcategories</Text>
                                </View>
                                <Switch value={cat.isActive} onValueChange={() => toggleCategoryActive(cat.id).then(inv)} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={cat.isActive ? Colors.primary : '#ccc'} />
                                <TouchableOpacity onPress={() => setExpanded(expanded === cat.id ? null : cat.id)} style={{ padding: 4 }}>
                                    <MaterialIcons name={expanded === cat.id ? 'expand-less' : 'expand-more'} size={22} color={Colors.text.secondary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => openEdit(cat)} style={{ padding: 4 }}><MaterialIcons name="edit" size={18} color={Colors.info} /></TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(cat)} style={{ padding: 4 }}><MaterialIcons name="delete" size={18} color={Colors.error} /></TouchableOpacity>
                            </View>
                            {expanded === cat.id && (
                                <View style={styles.subContainer}>
                                    {cat.subcategories?.map((sub, i) => (
                                        <View key={i} style={styles.subChip}>
                                            <Text style={styles.subText}>{sub}</Text>
                                            <TouchableOpacity onPress={() => removeSubcategory(cat.id, sub).then(inv)}>
                                                <MaterialIcons name="close" size={14} color={Colors.error} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    {subTarget?.id === cat.id ? (
                                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                                            <TextInput style={styles.subInput} value={subInput} onChangeText={setSubInput} placeholder="Subcategory name" placeholderTextColor={Colors.text.disabled} autoFocus />
                                            <TouchableOpacity style={styles.subSaveBtn} onPress={() => handleAddSub(cat)}><MaterialIcons name="check" size={16} color="#fff" /></TouchableOpacity>
                                            <TouchableOpacity style={[styles.subSaveBtn, { backgroundColor: Colors.border }]} onPress={() => setSubTarget(null)}><MaterialIcons name="close" size={16} color={Colors.text.primary} /></TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={styles.addSubBtn} onPress={() => setSubTarget(cat)}>
                                            <MaterialIcons name="add" size={14} color={Colors.primary} />
                                            <Text style={styles.addSubText}>Add Subcategory</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    )}
                />
            )}

            <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
                <View style={{ flex: 1, backgroundColor: Colors.background }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModal(false)}><MaterialIcons name="close" size={24} color={Colors.text.primary} /></TouchableOpacity>
                        <Text style={styles.modalTitle}>{editCat ? 'Edit Category' : 'New Category'}</Text>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: Spacing.base }}>
                        <TouchableOpacity style={styles.imgPicker} onPress={pickImage}>
                            {imgUri || form.imageUrl ? <Image source={{ uri: imgUri ?? form.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <View style={{ alignItems: 'center', gap: 8 }}><MaterialIcons name="add-photo-alternate" size={32} color={Colors.text.disabled} /><Text style={{ color: Colors.text.disabled, fontSize: Typography.fontSize.sm }}>Category Image</Text></View>}
                        </TouchableOpacity>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Name *</Text>
                            <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Category name" placeholderTextColor={Colors.text.disabled} />
                        </View>
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
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    catImg: { width: 44, height: 44, borderRadius: BorderRadius.md },
    catName: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    catMeta: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    subContainer: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    subChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
    subText: { fontSize: Typography.fontSize.xs, color: Colors.primary, fontFamily: 'Poppins-Medium' },
    subInput: { flex: 1, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: 6, fontSize: Typography.fontSize.sm, color: Colors.text.primary },
    subSaveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
    addSubBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
    addSubText: { fontSize: Typography.fontSize.xs, color: Colors.primary, fontFamily: 'Poppins-Medium' },
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
