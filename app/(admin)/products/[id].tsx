import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useQuery } from '@tanstack/react-query';
import { getProductById } from '@/services/products.service';
import { uploadProductImage } from '@/services/storage.service';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';

export default function AdminProductEditScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const isNew = id === 'new';

    const { data: existing } = useQuery({
        queryKey: ['product', id],
        queryFn: () => getProductById(id!),
        enabled: !isNew,
    });

    const [name, setName] = useState(existing?.name ?? '');
    const [price, setPrice] = useState(existing?.price?.toString() ?? '');
    const [mrp, setMrp] = useState(existing?.mrp?.toString() ?? '');
    const [stock, setStock] = useState(existing?.stock?.toString() ?? '');
    const [brand, setBrand] = useState(existing?.brand ?? '');
    const [unit, setUnit] = useState(existing?.unit ?? '');
    const [desc, setDesc] = useState(existing?.description ?? '');
    const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '');
    const [imageUri, setImageUri] = useState<string | null>(existing?.imageUrl ?? null);
    const [saving, setSaving] = useState(false);

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
                updatedAt: serverTimestamp(),
                ...(isNew ? { createdAt: serverTimestamp() } : {}),
            };
            if (isNew) {
                await setDoc(doc(db, 'products', productId), data);
            } else {
                await updateDoc(doc(db, 'products', productId), data);
            }
            Alert.alert('Success', `Product ${isNew ? 'created' : 'updated'} successfully!`, [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch {
            Alert.alert('Error', 'Failed to save product.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isNew ? 'Add Product' : 'Edit Product'}</Text>
                <View style={{ width: 30 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scroll}>
                <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.image} contentFit="contain" />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.imageIcon}>📷</Text>
                            <Text style={styles.imageLabel}>Tap to add image</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {[
                    { label: 'Product Name *', value: name, setter: setName, placeholder: 'e.g. Amul Butter 500g' },
                    { label: 'Brand', value: brand, setter: setBrand, placeholder: 'e.g. Amul' },
                    { label: 'Unit', value: unit, setter: setUnit, placeholder: 'e.g. 500g, 1 L, 1 dozen' },
                    { label: 'Category ID', value: categoryId, setter: setCategoryId, placeholder: 'Firestore category doc ID' },
                    { label: 'Selling Price (₹) *', value: price, setter: setPrice, placeholder: '99', keyboardType: 'numeric' as const },
                    { label: 'MRP (₹)', value: mrp, setter: setMrp, placeholder: '120', keyboardType: 'numeric' as const },
                    { label: 'Stock *', value: stock, setter: setStock, placeholder: '0', keyboardType: 'numeric' as const },
                ].map(f => (
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
    backText: { fontSize: 24, color: Colors.text.primary },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    scroll: { padding: Spacing.base },
    imageBtn: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.base, overflow: 'hidden', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
    image: { width: '100%', height: '100%' },
    imagePlaceholder: { alignItems: 'center', gap: Spacing.sm },
    imageIcon: { fontSize: 40 },
    imageLabel: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
    inputGroup: { marginBottom: Spacing.base },
    inputLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, fontSize: Typography.fontSize.base, color: Colors.text.primary },
    saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, paddingVertical: Spacing.base, alignItems: 'center', ...Shadows.primary },
    saveBtnText: { color: '#fff', fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold' },
});
