import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { getProductById } from '@/services/products.service';
import { useCartStore } from '@/stores/cartStore';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const addItem = useCartStore(s => s.addItem);
    const cartItems = useCartStore(s => s.items);
    const updateQty = useCartStore(s => s.updateQuantity);

    const { data: product, isLoading } = useQuery({
        queryKey: ['product', id],
        queryFn: () => getProductById(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }
    if (!product) return null;

    const cartItem = cartItems.find(i => i.product.id === product.id);
    const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.imageSection}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.imageBg}>
                        <Image
                            source={{ uri: product.imageUrl }}
                            style={styles.productImage}
                            contentFit="contain"
                        />
                    </View>
                    {discountPct > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{discountPct}% OFF</Text>
                        </View>
                    )}
                </View>

                {/* Details */}
                <View style={styles.detailCard}>
                    <Text style={styles.brand}>{product.brand}</Text>
                    <Text style={styles.name}>{product.name}</Text>
                    <Text style={styles.unit}>{product.unit}</Text>

                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{product.price}</Text>
                        {product.mrp > product.price && (
                            <>
                                <Text style={styles.mrp}>₹{product.mrp}</Text>
                                <View style={styles.savingBadge}>
                                    <Text style={styles.savingText}>You save ₹{product.mrp - product.price}</Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Stock */}
                    <View style={[styles.stockBadge, { backgroundColor: product.stock > 10 ? Colors.primaryLight : '#FFF3E0' }]}>
                        <Text style={[styles.stockText, { color: product.stock > 10 ? Colors.primary : Colors.warning }]}>
                            {product.stock === 0
                                ? '❌ Out of Stock'
                                : product.stock <= 10
                                    ? `⚠️ Only ${product.stock} left`
                                    : '✅ In Stock'}
                        </Text>
                    </View>

                    {/* Description */}
                    {product.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About this item</Text>
                            <Text style={styles.description}>{product.description}</Text>
                        </View>
                    )}

                    {/* Nutrition */}
                    {product.nutritionInfo && Object.keys(product.nutritionInfo).length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Nutrition Info</Text>
                            {Object.entries(product.nutritionInfo).map(([k, v]) => (
                                <View key={k} style={styles.nutritionRow}>
                                    <Text style={styles.nutritionKey}>{k}</Text>
                                    <Text style={styles.nutritionVal}>{v}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomPrice}>
                    <Text style={styles.bottomPriceLabel}>Total</Text>
                    <Text style={styles.bottomPriceVal}>
                        ₹{cartItem ? product.price * cartItem.quantity : product.price}
                    </Text>
                </View>

                {cartItem ? (
                    <View style={styles.qtyRow}>
                        <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateQty(product.id, cartItem.quantity - 1)}
                        >
                            <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyCount}>{cartItem.quantity}</Text>
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
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#0C831F', '#34A853']}
                            style={styles.addGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.addBtnText}>
                                {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    imageSection: {
        backgroundColor: '#F9F9F9',
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    backBtn: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        ...Shadows.md,
    },
    backIcon: { fontSize: 20, color: Colors.text.primary },
    imageBg: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    productImage: { width: width * 0.6, height: 220 },
    discountBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: Colors.accent,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    discountText: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-Bold', color: '#fff' },
    detailCard: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: BorderRadius['3xl'],
        borderTopRightRadius: BorderRadius['3xl'],
        marginTop: -24,
        padding: Spacing['2xl'],
        ...Shadows.lg,
    },
    brand: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    name: {
        fontSize: Typography.fontSize['2xl'],
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: 4,
    },
    unit: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.secondary,
        marginBottom: Spacing.base,
    },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.base },
    price: { fontSize: Typography.fontSize['2xl'], fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    mrp: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.disabled,
        textDecorationLine: 'line-through',
    },
    savingBadge: {
        backgroundColor: Colors.primaryLight,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    savingText: { fontSize: Typography.fontSize.xs, color: Colors.primary, fontFamily: 'Poppins-SemiBold' },
    stockBadge: {
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 6,
        alignSelf: 'flex-start',
        marginBottom: Spacing['2xl'],
    },
    stockText: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold' },
    section: { marginBottom: Spacing['2xl'] },
    sectionTitle: {
        fontSize: Typography.fontSize.base,
        fontFamily: 'Poppins-SemiBold',
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    description: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.secondary,
        lineHeight: 22,
    },
    nutritionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    nutritionKey: { fontSize: Typography.fontSize.base, color: Colors.text.secondary },
    nutritionVal: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Medium', color: Colors.text.primary },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing['2xl'],
        paddingVertical: Spacing.base,
        paddingBottom: Spacing['2xl'],
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        gap: Spacing.base,
        ...Shadows.lg,
    },
    bottomPrice: { flex: 1 },
    bottomPriceLabel: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    bottomPriceVal: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    addBtn: { flex: 2, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.primary },
    addGradient: { paddingVertical: Spacing.base, alignItems: 'center' },
    addBtnText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: '#fff' },
    qtyRow: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.xl,
        paddingVertical: 4,
        gap: Spacing.base,
        ...Shadows.primary,
    },
    qtyBtn: { padding: Spacing.sm },
    qtyBtnText: { fontSize: 24, color: '#fff', fontWeight: '700' },
    qtyCount: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: '#fff', minWidth: 32, textAlign: 'center' },
});
