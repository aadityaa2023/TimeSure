import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { searchProducts } from '@/services/products.service';
import { useCartStore } from '@/stores/cartStore';
import type { Product } from '@/types';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = React.useState(value);
    React.useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const addItem = useCartStore(s => s.addItem);
    const cartItems = useCartStore(s => s.items);

    const debouncedQuery = useDebounce(query, 400);

    React.useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([]);
            setSearched(false);
            return;
        }
        const doSearch = async () => {
            setLoading(true);
            try {
                const data = await searchProducts(debouncedQuery.trim());
                setResults(data);
                setSearched(true);
            } finally {
                setLoading(false);
            }
        };
        doSearch();
    }, [debouncedQuery]);

    const renderItem = ({ item }: { item: Product }) => {
        const inCart = cartItems.find(c => c.product.id === item.id);
        return (
            <TouchableOpacity
                style={styles.resultCard}
                activeOpacity={0.85}
                onPress={() =>
                    router.push({ pathname: '/(user)/product/[id]', params: { id: item.id } })
                }
            >
                <Image source={{ uri: item.imageUrl }} style={styles.resultImage} contentFit="contain" />
                <View style={styles.resultInfo}>
                    <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.resultUnit}>{item.unit}</Text>
                    <View style={styles.resultPriceRow}>
                        <Text style={styles.resultPrice}>₹{item.price}</Text>
                        {item.mrp > item.price && (
                            <Text style={styles.resultMrp}>₹{item.mrp}</Text>
                        )}
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.addBtn, inCart && styles.addBtnAdded]}
                    onPress={() => addItem(item)}
                >
                    {inCart
                        ? <MaterialIcons name="check" size={16} color="#fff" />
                        : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MaterialIcons name="add" size={16} color={Colors.primary} />
                                <Text style={styles.addBtnText}>Add</Text>
                            </View>
                        )
                    }
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.searchHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.searchInputWrap}>
                    <MaterialIcons name="search" size={18} color={Colors.text.disabled} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search groceries, vegetables..."
                        placeholderTextColor={Colors.text.disabled}
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : searched && results.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialIcons name="search" size={80} color="#BDBDBD" style={{ marginBottom: Spacing.base }} />
                    <Text style={styles.emptyTitle}>No results found</Text>
                    <Text style={styles.emptySubtitle}>Try different keywords</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={i => i.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: { padding: Spacing.xs },
    backText: { fontSize: 24, color: Colors.text.primary },
    searchInputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    searchIcon: { fontSize: 16 },
    searchInput: {
        flex: 1,
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.primary,
    },
    listContent: { padding: Spacing.base },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        gap: Spacing.base,
        ...Shadows.sm,
    },
    resultImage: { width: 64, height: 64 },
    resultInfo: { flex: 1 },
    resultName: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.semiBold,
        color: Colors.text.primary,
        marginBottom: 2,
    },
    resultUnit: {
        fontSize: Typography.fontSize.xs,
        color: Colors.text.disabled,
        marginBottom: 4,
    },
    resultPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    resultPrice: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
    },
    resultMrp: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.disabled,
        textDecorationLine: 'line-through',
    },
    addBtn: {
        backgroundColor: Colors.primaryLight,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.base,
    },
    addBtnAdded: { backgroundColor: Colors.primary },
    addBtnText: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.primary,
    },
    separator: { height: Spacing.sm },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyTitle: {
        fontSize: Typography.fontSize.xl,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    emptySubtitle: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.secondary,
    },
});
