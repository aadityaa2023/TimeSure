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
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryActive,
    addSubcategory,
    removeSubcategory,
} from '@/services/categories.service';
import { uploadImage } from '@/services/storage.service';
import type { Category, Subcategory } from '@/types';

const EMPTY_FORM = { name: '', imageUrl: '', order: 0, isActive: true, subcategories: [] as Subcategory[] };

export default function AdminCategoriesScreen() {
    const queryClient = useQueryClient();
    const [modalVisible, setModalVisible] = useState(false);
    const [editTarget, setEditTarget] = useState<Category | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [subModal, setSubModal] = useState(false);
    const [subForm, setSubForm] = useState({ name: '', imageUrl: '' });
    const [subTarget, setSubTarget] = useState<Category | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [localImageUri, setLocalImageUri] = useState<string | null>(null);

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: getAllCategories,
    });

    const openAdd = () => {
        setEditTarget(null);
        setForm({ ...EMPTY_FORM });
        setLocalImageUri(null);
        setModalVisible(true);
    };

    const openEdit = (cat: Category) => {
        setEditTarget(cat);
        setForm({ name: cat.name, imageUrl: cat.imageUrl, order: cat.order, isActive: cat.isActive, subcategories: cat.subcategories ?? [] });
        setLocalImageUri(null);
        setModalVisible(true);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
        if (!result.canceled) setLocalImageUri(result.assets[0].uri);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { Alert.alert('Required', 'Category name is required'); return; }
        setSaving(true);
        try {
            let imageUrl = form.imageUrl;
            if (localImageUri) {
                setUploadingImage(true);
                imageUrl = await uploadImage(localImageUri, `categories/${Date.now()}.jpg`);
                setUploadingImage(false);
            }
            const data = { name: form.name.trim(), imageUrl, order: form.order, isActive: form.isActive, subcategories: form.subcategories };
            if (editTarget) {
                await updateCategory(editTarget.id, data);
            } else {
                await createCategory(data);
            }
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            setModalVisible(false);
        } catch {
            Alert.alert('Error', 'Failed to save category.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (cat: Category) => {
        if (Platform.OS === 'web') {
            if (!window.confirm(`Delete "${cat.name}"?`)) return;
            deleteCategory(cat.id).then(() => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }));
        } else {
            Alert.alert('Delete', `Delete "${cat.name}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCategory(cat.id); queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); } },
            ]);
        }
    };

    const openSubModal = (cat: Category) => {
        setSubTarget(cat);
        setSubForm({ name: '', imageUrl: '' });
        setSubModal(true);
    };

    const handleAddSubcategory = async () => {
        if (!subForm.name.trim() || !subTarget) return;
        try {
            const newSub: Subcategory = { id: `sub_${Date.now()}`, name: subForm.name.trim(), imageUrl: subForm.imageUrl };
            await addSubcategory(subTarget.id, newSub, subTarget.subcategories ?? []);
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            setSubModal(false);
        } catch { Alert.alert('Error', 'Failed to add subcategory'); }
    };

    const handleDeleteSub = async (cat: Category, subId: string) => {
        try {
            await removeSubcategory(cat.id, subId, cat.subcategories ?? []);
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        } catch { Alert.alert('Error', 'Failed to delete subcategory'); }
    };

    const renderCategory = ({ item }: { item: Category }) => {
        const expanded = expandedId === item.id;
        return (
            <View style={styles.card}>
                <TouchableOpacity style={styles.catRow} onPress={() => setExpandedId(expanded ? null : item.id)} activeOpacity={0.85}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.catImage} contentFit="cover" />
                    ) : (
                        <View style={[styles.catImage, { backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                            <MaterialIcons name="category" size={22} color={Colors.primary} />
                        </View>
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={styles.catName}>{item.name}</Text>
                        <Text style={styles.catSub}>{(item.subcategories ?? []).length} subcategories · Order: {item.order}</Text>
                    </View>
                    <View style={styles.catActions}>
                        <Switch
                            value={item.isActive}
                            onValueChange={v => { toggleCategoryActive(item.id, v); queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); }}
                            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                            thumbColor={item.isActive ? Colors.primary : '#ccc'}
                        />
                        <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                            <MaterialIcons name="edit" size={18} color={Colors.info} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                            <MaterialIcons name="delete" size={18} color={Colors.error} />
                        </TouchableOpacity>
                        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={24} color={Colors.text.secondary} />
                    </View>
                </TouchableOpacity>

                {expanded && (
                    <View style={styles.subSection}>
                        <View style={styles.subHeader}>
                            <Text style={styles.subTitle}>Subcategories</Text>
                            <TouchableOpacity style={styles.addSubBtn} onPress={() => openSubModal(item)}>
                                <MaterialIcons name="add" size={14} color={Colors.primary} />
                                <Text style={styles.addSubText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                        {(item.subcategories ?? []).length === 0 ? (
                            <Text style={styles.emptyText}>No subcategories yet</Text>
                        ) : (item.subcategories ?? []).map(sub => (
                            <View key={sub.id} style={styles.subRow}>
                                <MaterialCommunityIcons name="subdirectory-arrow-right" size={16} color={Colors.text.disabled} />
                                <Text style={styles.subName}>{sub.name}</Text>
                                <TouchableOpacity onPress={() => handleDeleteSub(item, sub.id)}>
                                    <MaterialIcons name="close" size={16} color={Colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Categories ({categories.length})</Text>
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : (
                <FlatList
                    data={categories}
                    keyExtractor={c => c.id}
                    renderItem={renderCategory}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={<View style={styles.emptyCenter}><MaterialIcons name="category" size={56} color={Colors.text.disabled} /><Text style={styles.emptyText}>No categories yet. Add one!</Text></View>}
                />
            )}

            {/* Add/Edit Category Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <MaterialIcons name="close" size={24} color={Colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{editTarget ? 'Edit Category' : 'New Category'}</Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: Spacing.base }}>
                        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                            {localImageUri || form.imageUrl ? (
                                <Image source={{ uri: localImageUri ?? form.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                            ) : (
                                <View style={{ alignItems: 'center', gap: 6 }}>
                                    <MaterialIcons name="add-a-photo" size={36} color={Colors.text.disabled} />
                                    <Text style={{ color: Colors.text.disabled, fontSize: Typography.fontSize.sm }}>Tap to add image</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Category Name *</Text>
                            <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Fruits & Vegetables" placeholderTextColor={Colors.text.disabled} />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Image URL (optional)</Text>
                            <TextInput style={styles.input} value={form.imageUrl} onChangeText={v => setForm(f => ({ ...f, imageUrl: v }))} placeholder="https://..." placeholderTextColor={Colors.text.disabled} />
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

            {/* Add Subcategory Modal */}
            <Modal visible={subModal} animationType="slide" transparent onRequestClose={() => setSubModal(false)}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.base }}>
                        <Text style={styles.modalTitle}>Add Subcategory</Text>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Name *</Text>
                            <TextInput style={styles.input} value={subForm.name} onChangeText={v => setSubForm(f => ({ ...f, name: v }))} placeholder="e.g. Leafy Greens" placeholderTextColor={Colors.text.disabled} />
                        </View>
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Image URL (optional)</Text>
                            <TextInput style={styles.input} value={subForm.imageUrl} onChangeText={v => setSubForm(f => ({ ...f, imageUrl: v }))} placeholder="https://..." placeholderTextColor={Colors.text.disabled} />
                        </View>
                        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                            <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: Colors.border }]} onPress={() => setSubModal(false)}>
                                <Text style={[styles.saveBtnText, { color: Colors.text.primary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleAddSubcategory}>
                                <Text style={styles.saveBtnText}>Add</Text>
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
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 6 },
    addBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
    list: { padding: Spacing.base },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
    catRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.base },
    catImage: { width: 50, height: 50, borderRadius: BorderRadius.lg },
    catName: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    catSub: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, marginTop: 2 },
    catActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    iconBtn: { padding: 4 },
    subSection: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
    subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
    subTitle: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary },
    addSubBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.md },
    addSubText: { fontSize: Typography.fontSize.xs, color: Colors.primary, fontFamily: 'Poppins-Medium' },
    subRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4 },
    subName: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.text.primary },
    emptyCenter: { alignItems: 'center', paddingTop: 80, gap: Spacing.base },
    emptyText: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, textAlign: 'center' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
    modalTitle: { fontSize: Typography.fontSize.lg, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 8, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
    imagePicker: { height: 140, backgroundColor: Colors.border, borderRadius: BorderRadius.xl, marginBottom: Spacing.base, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
    formGroup: { marginBottom: Spacing.base },
    formLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontSize: Typography.fontSize.base, color: Colors.text.primary, fontFamily: 'Poppins-Regular' },
});
