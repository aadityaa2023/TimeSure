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
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getProducts } from '@/services/products.service';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import type { Product } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';

export default function AdminProductsScreen() {
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();

    const { data: products = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-products'],
        queryFn: () => getProducts({ limitCount: 100 }),
    });

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()),
    );

    const toggleActive = async (product: Product) => {
        try {
            await updateDoc(doc(db, 'products', product.id), { isActive: !product.isActive });
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        } catch {
            Alert.alert('Error', 'Failed to update product status.');
        }
    };

    const deleteProduct = (product: Product) => {
        Alert.alert('Delete Product', `Delete "${product.name}"? This cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteDoc(doc(db, 'products', product.id));
                    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
                },
            },
        ]);
    };

    const renderProduct = ({ item }: { item: Product }) => (
        <View style={styles.productCard}>
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} contentFit="contain" />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productSub}>{item.brand} · {item.unit}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{item.price}</Text>
                    <View style={[styles.stockBadge, { backgroundColor: item.stock > 0 ? Colors.primaryLight : '#FFEBEE' }]}>
                        <Text style={[styles.stockText, { color: item.stock > 0 ? Colors.primary : Colors.error }]}>
                            Stock: {item.stock}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => toggleActive(item)}>
                    <MaterialIcons
                        name={item.isActive ? "check-circle" : "cancel"}
                        size={20}
                        color={item.isActive ? Colors.primary : Colors.error}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() =>
                    router.push({ pathname: '/(admin)/products/[id]', params: { id: item.id } })
                }>
                    <MaterialIcons name="edit" size={20} color={Colors.info} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => deleteProduct(item)}>
                    <MaterialIcons name="delete" size={20} color={Colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Products</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push({ pathname: '/(admin)/products/[id]', params: { id: 'new' } })}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="add" size={18} color="#fff" />
                        <Text style={styles.addBtnText}>Add</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
                <MaterialIcons name="search" size={20} color={Colors.text.disabled} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    placeholderTextColor={Colors.text.disabled}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={p => p.id}
                    renderItem={renderProduct}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No products found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    backText: { fontSize: 24, color: Colors.text.primary },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    addBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 6 },
    addBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.sm },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
    searchInput: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.text.primary, fontFamily: 'Poppins-Regular' },
    listContent: { padding: Spacing.base },
    productCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, gap: Spacing.base, ...Shadows.sm },
    productImage: { width: 64, height: 64 },
    productInfo: { flex: 1 },
    productName: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary, marginBottom: 2 },
    productSub: { fontSize: Typography.fontSize.xs, color: Colors.text.disabled, marginBottom: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    price: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    stockBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
    stockText: { fontSize: 9, fontFamily: 'Poppins-SemiBold' },
    actions: { gap: 4 },
    actionBtn: { padding: 4 },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: Typography.fontSize.base, color: Colors.text.secondary },
});
