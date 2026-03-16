import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProductById, getCategories } from '@/services/products.service';
import { uploadProductImage } from '@/services/storage.service';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';
import type { Category } from '@/types';

export default function AdminProductEditScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const queryClient = useQueryClient();
    const isNew = id === 'new';

    const { data: existing, isLoading: loadingProduct } = useQuery({
        queryKey: ['product', id],
        queryFn: () => getProductById(id!),
        enabled: !isNew,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: getCategories,
    });

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [mrp, setMrp] = useState('');
    const [stock, setStock] = useState('');
    const [brand, setBrand] = useState('');
    const [unit, setUnit] = useState('');
    const [desc, setDesc] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isFeatured, setIsFeatured] = useState(false);
    const [saving, setSaving] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Populate form fields once existing data loads
    useEffect(() => {
        if (existing && !initialized) {
            setName(existing.name ?? '');
            setPrice(existing.price?.toString() ?? '');
            setMrp(existing.mrp?.toString() ?? '');
            setStock(existing.stock?.toString() ?? '');
            setBrand(existing.brand ?? '');
            setUnit(existing.unit ?? '');
            setDesc(existing.description ?? '');
            setCategoryId(existing.categoryId ?? '');
            setImageUri(existing.imageUrl ?? null);
            setIsFeatured(existing.isFeatured ?? false);
            setInitialized(true);
        }
    }, [existing, initialized]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handleSave = async () => {
        if (!name.trim() || !price || !stock) {
            Alert.alert('Required', 'Name, price and stock are required.');
            return;
        }
        setSaving(true);
        try {
            const productId = isNew ? `product_${Date.now()}` : id!;
            let imageUrl = imageUri ?? '';
            if (imageUri && !imageUri.startsWith('http')) {
                imageUrl = await uploadProductImage(productId, imageUri);
            }
            const data = {
                name: name.trim(),
                price: parseFloat(price),
                mrp: parseFloat(mrp || price),
                stock: parseInt(stock),
                brand: brand.trim(),
                unit: unit.trim(),
                description: desc.trim(),
                categoryId: categoryId.trim(),
                imageUrl,
                isActive: true,
                isFeatured,
                updatedAt: serverTimestamp(),
                ...(isNew ? { createdAt: serverTimestamp() } : {}),
            };
            if (isNew) {
                await setDoc(doc(db, 'products', productId), data);
            } else {
                await updateDoc(doc(db, 'products', productId), data);
            }
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['product', id] });
            if (Platform.OS === 'web') {
                window.alert(`Product ${isNew ? 'created' : 'updated'} successfully!`);
                router.back();
            } else {
                Alert.alert('Success', `Product ${isNew ? 'created' : 'updated'} successfully!`, [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            }
        } catch {
            Alert.alert('Error', 'Failed to save product.');
        } finally {
            setSaving(false);
        }
    };

    if (!isNew && loadingProduct) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}><MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Loading...</Text>
                    <View style={{ width: 30 }} />
                </View>
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            </SafeAreaView>
        );
    }

    const fields = [
        { label: 'Product Name *', value: name, setter: setName, placeholder: 'e.g. Amul Butter 500g' },
        { label: 'Brand', value: brand, setter: setBrand, placeholder: 'e.g. Amul' },
        { label: 'Unit', value: unit, setter: setUnit, placeholder: 'e.g. 500g, 1 L, 1 dozen' },
        { label: 'Selling Price (₹) *', value: price, setter: setPrice, placeholder: '99', keyboardType: 'numeric' as const },
        { label: 'MRP (₹)', value: mrp, setter: setMrp, placeholder: '120', keyboardType: 'numeric' as const },
        { label: 'Stock *', value: stock, setter: setStock, placeholder: '0', keyboardType: 'numeric' as const },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isNew ? 'Add Product' : 'Edit Product'}</Text>
                <View style={{ width: 30 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Image Picker */}
                <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.image} contentFit="contain" />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <MaterialIcons name="add-a-photo" size={40} color={Colors.text.disabled} />
                            <Text style={styles.imageLabel}>Tap to add image</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Fields */}
                {fields.map(f => (
                    <View key={f.label} style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{f.label}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={f.placeholder}
                            placeholderTextColor={Colors.text.disabled}
                            value={f.value}
                            onChangeText={f.setter}
                            keyboardType={f.keyboardType}
                        />
                    </View>
                ))}

                {/* Category Picker */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Category</Text>
                    {categories.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.catChip, categoryId === cat.id && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                                    onPress={() => setCategoryId(cat.id)}
                                >
                                    <Text style={[styles.catChipText, categoryId === cat.id && { color: '#fff' }]}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <TextInput style={styles.input} placeholder="Firestore category doc ID" placeholderTextColor={Colors.text.disabled} value={categoryId} onChangeText={setCategoryId} />
                    )}
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="Product description..."
                        placeholderTextColor={Colors.text.disabled}
                        value={desc}
                        onChangeText={setDesc}
                        multiline
                    />
                </View>

                {/* Featured Toggle */}
                <TouchableOpacity style={styles.toggleRow} onPress={() => setIsFeatured(v => !v)}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Featured Product</Text>
                        <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.disabled }}>Show in featured section on home</Text>
                    </View>
                    <View style={[styles.toggle, isFeatured && { backgroundColor: Colors.primary }]}>
                        <View style={[styles.toggleThumb, isFeatured && { transform: [{ translateX: 20 }] }]} />
                    </View>
                </TouchableOpacity>

                {/* Save */}
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{isNew ? 'Create Product' : 'Save Changes'}</Text>}
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    scroll: { padding: Spacing.base },
    imageBtn: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.base, overflow: 'hidden', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
    image: { width: '100%', height: '100%' },
    imagePlaceholder: { alignItems: 'center', gap: Spacing.sm },
    imageLabel: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
    inputGroup: { marginBottom: Spacing.base },
    inputLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, fontSize: Typography.fontSize.base, color: Colors.text.primary },
    catChip: { paddingHorizontal: Spacing.base, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
    catChipText: { fontSize: Typography.fontSize.sm, color: Colors.text.primary, fontFamily: 'Poppins-Medium' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.base, gap: Spacing.base },
    toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.border, padding: 2 },
    toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', ...Shadows.sm },
    saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, paddingVertical: Spacing.base, alignItems: 'center', ...Shadows.primary },
    saveBtnText: { color: '#fff', fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold' },
});
