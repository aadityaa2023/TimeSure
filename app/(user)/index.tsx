import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { getProducts, getCategories } from '@/services/products.service';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import type { Product, Category } from '@/types';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 180;

// --- Mock banners (replace with Firestore banners) ---
const banners = [
    { id: '1', color: ['#0C831F', '#34A853'] as const, emoji: '🥦', text: '50% off Fresh Veggies' },
    { id: '2', color: ['#1565C0', '#42A5F5'] as const, emoji: '🥛', text: 'Buy 2 Get 1 Dairy' },
    { id: '3', color: ['#7B1FA2', '#AB47BC'] as const, emoji: '🍫', text: 'Snacks Starting ₹10' },
];

// --- ProductCard Component ---
function ProductCard({ product }: { product: Product }) {
    const addItem = useCartStore(s => s.addItem);
    const cartItems = useCartStore(s => s.items);
    const cartItem = cartItems.find(i => i.product.id === product.id);
    const updateQty = useCartStore(s => s.updateQuantity);

    const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);

    return (
        <TouchableOpacity
            style={styles.productCard}
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: '/(user)/product/[id]', params: { id: product.id } })}
        >
            <View style={styles.productImageWrapper}>
                <Image source={{ uri: product.imageUrl }} style={styles.productImage} contentFit="contain" />
                {discountPct > 0 && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{discountPct}% OFF</Text>
                    </View>
                )}
            </View>
            <View style={styles.productInfo}>
                <Text style={styles.productUnit}>{product.unit}</Text>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{product.price}</Text>
                    {product.mrp > product.price && (
                        <Text style={styles.mrp}>₹{product.mrp}</Text>
                    )}
                </View>
                {cartItem ? (
                    <View style={styles.qtyRow}>
                        <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateQty(product.id, cartItem.quantity - 1)}
                        >
                            <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{cartItem.quantity}</Text>
                        <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateQty(product.id, cartItem.quantity + 1)}
                        >
                            <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.addBtn, product.stock === 0 && { opacity: 0.4 }]}
                        onPress={() => product.stock > 0 && addItem(product)}
                        disabled={product.stock === 0}
                    >
                        <Text style={styles.addBtnText}>
                            {product.stock === 0 ? 'Out of Stock' : '+ Add'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
}

// --- CategoryChip Component ---
function CategoryChip({ category, isSelected, onPress }: {
    category: Category;
    isSelected: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Image source={{ uri: category.imageUrl }} style={styles.categoryImage} contentFit="contain" />
            <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]} numberOfLines={2}>
                {category.name}
            </Text>
        </TouchableOpacity>
    );
}

export default function HomeScreen() {
    const { user } = useAuthStore();
    const [bannerIndex, setBannerIndex] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const scrollY = useSharedValue(0);

    const { data: categories = [], refetch: refetchCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    const { data: featuredProducts = [], refetch: refetchFeatured } = useQuery({
        queryKey: ['products', 'featured'],
        queryFn: () => getProducts({ isFeatured: true, limitCount: 10 }),
    });

    const { data: categoryProducts = [], refetch: refetchCategory } = useQuery({
        queryKey: ['products', selectedCategory],
        queryFn: () =>
            selectedCategory
                ? getProducts({ categoryId: selectedCategory, limitCount: 20 })
                : getProducts({ limitCount: 20 }),
        enabled: true,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetchCategories(), refetchFeatured(), refetchCategory()]);
        setRefreshing(false);
    }, []);

    const headerAnimStyle = useAnimatedStyle(() => ({
        shadowOpacity: interpolate(scrollY.value, [0, 60], [0, 0.12], Extrapolate.CLAMP),
    }));

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Sticky Header */}
            <Animated.View style={[styles.header, headerAnimStyle]}>
                <LinearGradient colors={['#0C831F', '#34A853']} style={styles.headerGradient}>
                    <TouchableOpacity style={styles.locationBtn} activeOpacity={0.8}>
                        <Text style={styles.locationLabel}>Delivery to</Text>
                        <View style={styles.locationRow}>
                            <Text style={styles.locationAddress} numberOfLines={1}>
                                {user?.addresses?.[0]?.fullAddress ?? 'Set your location 📍'}
                            </Text>
                            <Text style={styles.locationChevron}>▾</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.deliveryBadge}>
                        <Text style={styles.deliveryBadgeText}>⚡ 10 min delivery</Text>
                    </View>
                </LinearGradient>
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                onScroll={e => { scrollY.value = e.nativeEvent.contentOffset.y; }}
                scrollEventThrottle={16}
            >
                {/* Search Bar */}
                <TouchableOpacity
                    style={styles.searchBar}
                    onPress={() => router.push('/(user)/search')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.searchIcon}>🔍</Text>
                    <Text style={styles.searchPlaceholder}>Search for groceries, vegetables, fruits...</Text>
                </TouchableOpacity>

                {/* Banner Carousel */}
                <View style={styles.bannerSection}>
                    <FlatList
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        data={banners}
                        keyExtractor={b => b.id}
                        onMomentumScrollEnd={e => {
                            setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / (width - Spacing['2xl'] * 2)));
                        }}
                        renderItem={({ item }) => (
                            <LinearGradient colors={item.color} style={styles.bannerCard}>
                                <Text style={styles.bannerEmoji}>{item.emoji}</Text>
                                <Text style={styles.bannerText}>{item.text}</Text>
                                <Text style={styles.bannerCta}>Shop Now →</Text>
                            </LinearGradient>
                        )}
                    />
                    <View style={styles.bannerDots}>
                        {banners.map((_, i) => (
                            <View
                                key={i}
                                style={[styles.bannerDot, i === bannerIndex && styles.bannerDotActive]}
                            />
                        ))}
                    </View>
                </View>

                {/* Categories */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Shop by Category</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesRow}
                >
                    {categories.map(cat => (
                        <CategoryChip
                            key={cat.id}
                            category={cat}
                            isSelected={selectedCategory === cat.id}
                            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                        />
                    ))}
                </ScrollView>

                {/* Featured Products */}
                {!selectedCategory && featuredProducts.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>🔥 Featured Deals</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAll}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            horizontal
                            data={featuredProducts}
                            keyExtractor={p => p.id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.productsRow}
                            renderItem={({ item }) => <ProductCard product={item} />}
                        />
                    </>
                )}

                {/* Products Grid */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {selectedCategory
                            ? categories.find(c => c.id === selectedCategory)?.name ?? 'Products'
                            : '🛒 All Products'}
                    </Text>
                </View>
                <View style={styles.productGrid}>
                    {categoryProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const CARD_WIDTH = (width - Spacing['2xl'] * 2 - Spacing.base) / 2;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    // Header
    header: { backgroundColor: Colors.primary, zIndex: 10 },
    headerGradient: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    locationBtn: { flex: 1 },
    locationLabel: {
        fontSize: Typography.fontSize.xs,
        color: 'rgba(255,255,255,0.7)',
        fontFamily: Typography.fontFamily.medium,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationAddress: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.bold,
        color: '#fff',
        maxWidth: width * 0.5,
    },
    locationChevron: { color: '#fff', fontSize: 12 },
    deliveryBadge: {
        backgroundColor: Colors.secondary,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    deliveryBadgeText: {
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
    },

    // Search
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.base,
        marginTop: Spacing.base,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
        ...Shadows.md,
    },
    searchIcon: { fontSize: 18 },
    searchPlaceholder: {
        flex: 1,
        fontSize: Typography.fontSize.base,
        color: Colors.text.disabled,
        fontFamily: Typography.fontFamily.regular,
    },

    // Banners
    bannerSection: { marginTop: Spacing.base },
    bannerCard: {
        width: width - Spacing['2xl'] * 2,
        marginHorizontal: Spacing['2xl'],
        height: BANNER_HEIGHT,
        borderRadius: BorderRadius.xl,
        padding: Spacing['2xl'],
        justifyContent: 'center',
        ...Shadows.lg,
    },
    bannerEmoji: { fontSize: 48, marginBottom: Spacing.sm },
    bannerText: {
        fontSize: Typography.fontSize.xl,
        fontFamily: Typography.fontFamily.bold,
        color: '#fff',
        marginBottom: Spacing.sm,
    },
    bannerCta: {
        fontSize: Typography.fontSize.base,
        color: 'rgba(255,255,255,0.9)',
        fontFamily: Typography.fontFamily.medium,
    },
    bannerDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.sm,
        gap: 4,
    },
    bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
    bannerDotActive: { width: 18, backgroundColor: Colors.primary },

    // Sections
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        marginTop: Spacing['2xl'],
        marginBottom: Spacing.base,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
    },
    seeAll: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.semiBold,
        color: Colors.primary,
    },

    // Categories
    categoriesRow: { paddingHorizontal: Spacing.base, gap: Spacing.sm, paddingBottom: 4 },
    categoryChip: {
        width: 80,
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        ...Shadows.sm,
    },
    categoryChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    categoryImage: { width: 48, height: 48, marginBottom: 4 },
    categoryName: {
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.secondary,
        textAlign: 'center',
    },
    categoryNameSelected: { color: Colors.primary },

    // Products horizontal
    productsRow: { paddingHorizontal: Spacing.base, gap: Spacing.sm },

    // Products grid
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.base,
        gap: Spacing.sm,
    },

    // Product Card
    productCard: {
        width: CARD_WIDTH,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadows.md,
    },
    productImageWrapper: {
        backgroundColor: '#F9F9F9',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    productImage: { width: 90, height: 90 },
    discountBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: Colors.accent,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    discountText: { fontSize: 9, fontFamily: 'Poppins-Bold', color: '#fff' },
    productInfo: { padding: Spacing.sm },
    productUnit: {
        fontSize: Typography.fontSize.xs,
        color: Colors.text.disabled,
        fontFamily: Typography.fontFamily.regular,
        marginBottom: 2,
    },
    productName: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.semiBold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
        minHeight: 32,
    },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
    price: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
    },
    mrp: {
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.disabled,
        textDecorationLine: 'line-through',
    },
    addBtn: {
        backgroundColor: Colors.primaryLight,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderRadius: BorderRadius.md,
        paddingVertical: 6,
        alignItems: 'center',
    },
    addBtnText: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.primary,
    },
    qtyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 2,
    },
    qtyBtn: { padding: 6, minWidth: 28, alignItems: 'center' },
    qtyBtnText: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.bold,
        color: '#fff',
    },
    qtyText: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.bold,
        color: '#fff',
        minWidth: 24,
        textAlign: 'center',
    },
});
