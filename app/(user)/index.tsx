import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    FlatList,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Appbar, Searchbar, Text, Card, Surface, Button, IconButton, useTheme, Avatar } from 'react-native-paper';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { getProducts, getCategories } from '@/services/products.service';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import type { Product, Category } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const banners = [
    { id: '1', color: '#1A237E', text: 'Daily \nEssentials', subtext: 'Get 20% OFF' },
    { id: '2', color: '#E65100', text: 'Fresh \nFruits', subtext: 'Starting ₹49' },
    { id: '3', color: '#004D40', text: 'Morning \nDairy', subtext: 'Farm Fresh' },
];

function ProductCard({ product }: { product: Product }) {
    const theme = useTheme();
    const addItem = useCartStore(s => s.addItem);
    const cartItems = useCartStore(s => s.items);
    const cartItem = cartItems.find(i => i.product.id === product.id);
    const updateQty = useCartStore(s => s.updateQuantity);

    const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);

    return (
        <Surface style={styles.productCard} elevation={1}>
            <TouchableOpacity
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
            </TouchableOpacity>

            <View style={styles.productInfo}>
                <View style={styles.timerRow}>
                    <MaterialCommunityIcons name="clock-fast" size={12} color="#0C831F" />
                    <Text style={styles.timerText}>8 MINS</Text>
                </View>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productUnit}>{product.unit}</Text>

                <View style={styles.priceActionRow}>
                    <View>
                        <Text style={styles.price}>₹{product.price}</Text>
                        {product.mrp > product.price && (
                            <Text style={styles.mrp}>₹{product.mrp}</Text>
                        )}
                    </View>

                    {cartItem ? (
                        <View style={styles.qtyContainer}>
                            <TouchableOpacity onPress={() => updateQty(product.id, cartItem.quantity - 1)} style={styles.qtyBtn}>
                                <Text style={styles.qtyBtnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{cartItem.quantity}</Text>
                            <TouchableOpacity onPress={() => updateQty(product.id, cartItem.quantity + 1)} style={styles.qtyBtn}>
                                <Text style={styles.qtyBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.addButton, product.stock === 0 && { borderColor: '#ccc' }]}
                            onPress={() => product.stock > 0 && addItem(product)}
                            disabled={product.stock === 0}
                        >
                            <Text style={[styles.addButtonText, product.stock === 0 && { color: '#ccc' }]}>
                                {product.stock === 0 ? 'SOLD OUT' : 'ADD'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Surface>
    );
}

function CategoryItem({ category, onPress }: { category: Category; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.categoryItem} onPress={onPress}>
            <Surface style={styles.categoryImageContainer} elevation={0}>
                <Image source={{ uri: category.imageUrl }} style={styles.categoryImg} contentFit="contain" />
            </Surface>
            <Text style={styles.categoryText} numberOfLines={2}>{category.name}</Text>
        </TouchableOpacity>
    );
}

export default function HomeScreen() {
    const { user } = useAuthStore();
    const theme = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Instead of filtering, we just tap into category. Blinkit usually has a grid for categories.
    const { data: categories = [], refetch: refetchCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    const { data: featuredProducts = [], refetch: refetchFeatured } = useQuery({
        queryKey: ['products', 'featured'],
        queryFn: () => getProducts({ isFeatured: true, limitCount: 15 }),
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetchCategories(), refetchFeatured()]);
        setRefreshing(false);
    }, []);

    const userFirstName = user?.name?.split(' ')[0] || 'User';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.locationContainer}>
                        <Text style={styles.deliveryTitle}>Delivery in 8 minutes</Text>
                        <TouchableOpacity style={styles.addressRow}>
                            <Text style={styles.addressText} numberOfLines={1}>
                                {user?.addresses?.[0]?.fullAddress || 'Setup your location'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="#000" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(user)/profile')}>
                        <Avatar.Text size={40} label={userFirstName.charAt(0)} style={{ backgroundColor: theme.colors.primary }} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(user)/search')}>
                    <Searchbar
                        placeholder='Search "milk"'
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        editable={false}
                        onPress={() => router.push('/(user)/search')}
                        style={styles.searchBar}
                        inputStyle={styles.searchInput}
                        iconColor="#000"
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F8CB46']} />}
            >
                {/* Banners */}
                <View style={styles.bannerContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        {banners.map((item) => (
                            <Surface key={item.id} style={[styles.bannerCard, { backgroundColor: item.color }]} elevation={2}>
                                <Text style={styles.bannerTitle}>{item.text}</Text>
                                <View style={styles.bannerTag}>
                                    <Text style={styles.bannerTagText}>{item.subtext}</Text>
                                </View>
                            </Surface>
                        ))}
                    </ScrollView>
                </View>

                {/* Categories Grid */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Shop by Category</Text>
                </View>
                <View style={styles.categoriesGrid}>
                    {categories.slice(0, 8).map((cat: Category) => (
                        <CategoryItem
                            key={cat.id}
                            category={cat}
                            onPress={() => router.push(`/(user)/category/${cat.id}` as any)}
                        />
                    ))}
                </View>

                {/* Best Sellers */}
                <View style={styles.sectionHeaderLine}>
                    <Text style={styles.sectionTitle}>Best Sellers</Text>
                    <Text style={styles.seeAllText}>See all</Text>
                </View>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.hList}
                    data={featuredProducts}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <ProductCard product={item} />}
                />

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    locationContainer: {
        flex: 1,
        marginRight: 16,
    },
    deliveryTitle: {
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
        color: '#000',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    addressText: {
        fontSize: 13,
        color: '#666',
        fontFamily: 'Poppins-Regular',
        flexWrap: 'nowrap',
        overflow: 'hidden',
    },
    searchBar: {
        marginTop: 8,
        backgroundColor: '#F5F5F5',
        height: 48,
        borderRadius: 12,
        elevation: 0,
    },
    searchInput: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        marginTop: -4,
    },
    bannerContainer: {
        marginTop: 20,
    },
    bannerCard: {
        width: width * 0.75,
        height: 140,
        borderRadius: 16,
        marginRight: 16,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    bannerTitle: {
        color: '#FFF',
        fontSize: 24,
        fontFamily: 'Poppins-Bold',
        lineHeight: 28,
        marginBottom: 12,
    },
    bannerTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    bannerTagText: {
        color: '#FFF',
        fontSize: 12,
        fontFamily: 'Poppins-SemiBold',
    },
    sectionHeader: {
        paddingHorizontal: 16,
        marginTop: 24,
        marginBottom: 16,
    },
    sectionHeaderLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
        color: '#000',
    },
    seeAllText: {
        color: '#0C831F',
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
    },
    categoryItem: {
        width: '25%',
        alignItems: 'center',
        padding: 8,
        marginBottom: 8,
    },
    categoryImageContainer: {
        width: 70,
        height: 70,
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryImg: {
        width: 45,
        height: 45,
    },
    categoryText: {
        fontSize: 12,
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
        lineHeight: 16,
    },
    hList: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        gap: 16,
    },
    productCard: {
        width: 150,
        backgroundColor: '#FFF',
        borderRadius: 12,
        overflow: 'hidden',
    },
    productImageWrapper: {
        height: 140,
        backgroundColor: '#FFF',
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    discountBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#318616',
        borderBottomRightRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 4,
        zIndex: 1,
    },
    discountText: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: 'Poppins-Bold',
    },
    productInfo: {
        padding: 12,
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 6,
    },
    timerText: {
        fontSize: 10,
        fontFamily: 'Poppins-Bold',
        color: '#000',
        marginLeft: 4,
    },
    productName: {
        fontSize: 13,
        fontFamily: 'Poppins-Medium',
        color: '#000',
        lineHeight: 18,
        height: 36,
        marginBottom: 4,
    },
    productUnit: {
        fontSize: 12,
        color: '#888',
        fontFamily: 'Poppins-Regular',
        marginBottom: 12,
    },
    priceActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: 14,
        fontFamily: 'Poppins-Bold',
        color: '#000',
    },
    mrp: {
        fontSize: 11,
        color: '#888',
        textDecorationLine: 'line-through',
        fontFamily: 'Poppins-Regular',
    },
    addButton: {
        borderColor: '#318616',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: '#FFF',
    },
    addButtonText: {
        color: '#318616',
        fontSize: 12,
        fontFamily: 'Poppins-Bold',
    },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#318616',
        borderRadius: 6,
        height: 30,
        overflow: 'hidden',
    },
    qtyBtn: {
        paddingHorizontal: 8,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Poppins-Bold',
    },
    qtyText: {
        color: '#FFF',
        fontSize: 12,
        fontFamily: 'Poppins-Bold',
        paddingHorizontal: 4,
    },
});
