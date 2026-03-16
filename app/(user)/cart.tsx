import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { useCartStore } from '@/stores/cartStore';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const DELIVERY_FEE = 30;
const FREE_DELIVERY_THRESHOLD = 199;

export default function CartScreen() {
    const { items, removeItem, updateQuantity, subtotal, clearCart } = useCartStore();
    const [coupon, setCoupon] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponDiscount, setCouponDiscount] = useState(0);

    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const total = subtotal - couponDiscount + deliveryFee;

    const applyCoupon = () => {
        if (coupon.toUpperCase() === 'WELCOME50') {
            const disc = Math.min(subtotal * 0.5, 100);
            setCouponDiscount(disc);
            setCouponApplied(true);
        } else if (coupon.toUpperCase() === 'FLAT20') {
            setCouponDiscount(20);
            setCouponApplied(true);
        } else {
            Alert.alert('Invalid Coupon', 'This coupon code is not valid or has expired.');
        }
    };

    const removeCoupon = () => {
        setCoupon('');
        setCouponApplied(false);
        setCouponDiscount(0);
    };

    if (items.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Cart</Text>
                </View>
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="cart-outline" size={90} color="#BDBDBD" style={{ marginBottom: Spacing.base }} />
                    <Text style={styles.emptySubtitle}>Add some items to get started!</Text>
                    <TouchableOpacity
                        style={styles.shopBtn}
                        onPress={() => router.replace('/(user)')}
                        activeOpacity={0.85}
                    >
                        <LinearGradient colors={['#0C831F', '#34A853']} style={styles.shopGradient}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.shopBtnText}>Start Shopping</Text>
                                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Cart ({items.length})</Text>
                <TouchableOpacity onPress={() => Alert.alert('Clear Cart', 'Remove all items?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: clearCart },
                ])}>
                    <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Delivery Banner */}
                {subtotal < FREE_DELIVERY_THRESHOLD && (
                    <View style={styles.deliveryBanner}>
                        <MaterialCommunityIcons name="truck-fast-outline" size={16} color={Colors.secondary} />
                        <Text style={styles.deliveryBannerText}>
                            {` Add ₹${FREE_DELIVERY_THRESHOLD - subtotal} more for FREE delivery!`}
                        </Text>
                    </View>
                )}

                {/* Cart Items */}
                <View style={styles.itemsSection}>
                    {items.map(({ product, quantity }) => (
                        <View key={product.id} style={styles.cartItem}>
                            <Image source={{ uri: product.imageUrl }} style={styles.itemImage} contentFit="contain" />
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={2}>{product.name}</Text>
                                <Text style={styles.itemUnit}>{product.unit}</Text>
                                <Text style={styles.itemPrice}>₹{product.price * quantity}</Text>
                            </View>
                            <View style={styles.itemControls}>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => updateQuantity(product.id, quantity - 1)}
                                >
                                    <MaterialIcons name="remove" size={20} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{quantity}</Text>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => updateQuantity(product.id, quantity + 1)}
                                >
                                    <MaterialIcons name="add" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Coupon */}
                <View style={styles.couponSection}>
                    <View style={styles.couponLabelRow}>
                        <MaterialCommunityIcons name="tag-outline" size={18} color={Colors.text.primary} />
                        <Text style={styles.couponLabel}>Apply Coupon</Text>
                    </View>
                    {couponApplied ? (
                        <View style={styles.couponApplied}>
                            <View style={styles.couponAppliedLeft}>
                                <Text style={styles.couponAppliedCode}>{coupon.toUpperCase()}</Text>
                                <Text style={styles.couponAppliedSaving}>You saved ₹{couponDiscount.toFixed(0)}</Text>
                            </View>
                            <TouchableOpacity onPress={removeCoupon} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MaterialIcons name="close" size={16} color={Colors.error} />
                                <Text style={styles.couponRemove}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.couponRow}>
                            <TextInput
                                style={styles.couponInput}
                                placeholder="Enter coupon code"
                                placeholderTextColor={Colors.text.disabled}
                                value={coupon}
                                onChangeText={setCoupon}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={[styles.applyBtn, !coupon && { opacity: 0.4 }]}
                                onPress={applyCoupon}
                                disabled={!coupon}
                            >
                                <Text style={styles.applyBtnText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Bill Summary */}
                <View style={styles.billSection}>
                    <Text style={styles.billTitle}>Bill Details</Text>
                    <View style={styles.billRow}>
                        <Text style={styles.billKey}>Subtotal</Text>
                        <Text style={styles.billVal}>₹{subtotal.toFixed(2)}</Text>
                    </View>
                    {couponDiscount > 0 && (
                        <View style={styles.billRow}>
                            <Text style={[styles.billKey, { color: Colors.primary }]}>Coupon Discount</Text>
                            <Text style={[styles.billVal, { color: Colors.primary }]}>−₹{couponDiscount.toFixed(2)}</Text>
                        </View>
                    )}
                    <View style={styles.billRow}>
                        <Text style={styles.billKey}>Delivery Fee</Text>
                        <Text style={deliveryFee === 0 ? styles.freeDelivery : styles.billVal}>
                            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.billRow}>
                        <Text style={styles.totalKey}>Total</Text>
                        <Text style={styles.totalVal}>₹{total.toFixed(2)}</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Checkout CTA */}
            <View style={styles.checkoutBar}>
                <View style={styles.checkoutSummary}>
                    <Text style={styles.checkoutTotal}>₹{total.toFixed(2)}</Text>
                    <Text style={styles.checkoutItems}>{items.length} items</Text>
                </View>
                <TouchableOpacity
                    style={styles.checkoutBtn}
                    onPress={() =>
                        router.push({
                            pathname: '/(user)/checkout',
                            params: {
                                subtotal: subtotal.toString(),
                                couponCode: couponApplied ? coupon : '',
                                couponDiscount: couponDiscount.toString(),
                                deliveryFee: deliveryFee.toString(),
                                total: total.toString(),
                            },
                        })
                    }
                    activeOpacity={0.85}
                >
                    <LinearGradient colors={['#0C831F', '#34A853']} style={styles.checkoutGradient}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    clearText: { fontSize: Typography.fontSize.base, color: Colors.error, fontFamily: 'Poppins-Medium' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
    emptyTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.sm },
    emptySubtitle: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, marginBottom: Spacing['2xl'], textAlign: 'center' },
    shopBtn: { width: '100%', borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.primary },
    shopGradient: { paddingVertical: Spacing.base, alignItems: 'center' },
    shopBtnText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: '#fff' },
    deliveryBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.secondaryLight,
        margin: Spacing.base,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: Colors.secondary,
    },
    deliveryBannerText: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-Medium', color: Colors.text.primary },
    itemsSection: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.base,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        gap: Spacing.base,
    },
    itemImage: { width: 64, height: 64 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary, marginBottom: 2 },
    itemUnit: { fontSize: Typography.fontSize.xs, color: Colors.text.disabled, marginBottom: 4 },
    itemPrice: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    itemControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 2 },
    qtyBtn: { padding: Spacing.sm, minWidth: 28, alignItems: 'center' },
    qtyBtnText: { fontSize: 20, color: '#fff', fontWeight: '700' },
    qtyText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: '#fff', minWidth: 24, textAlign: 'center' },
    couponSection: {
        backgroundColor: Colors.surface,
        margin: Spacing.base,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        ...Shadows.sm,
    },
    couponLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
    couponLabel: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    couponRow: { flexDirection: 'row', gap: Spacing.sm },
    couponInput: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        fontSize: Typography.fontSize.base,
        fontFamily: 'Poppins-Medium',
        color: Colors.text.primary,
        letterSpacing: 1,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    applyBtn: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.base,
        justifyContent: 'center',
    },
    applyBtnText: { color: '#fff', fontFamily: 'Poppins-SemiBold', fontSize: Typography.fontSize.base },
    couponApplied: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    couponAppliedLeft: {},
    couponAppliedCode: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.primary },
    couponAppliedSaving: { fontSize: Typography.fontSize.sm, color: Colors.primary },
    couponRemove: { fontSize: Typography.fontSize.sm, color: Colors.error, fontFamily: 'Poppins-Medium' },
    billSection: {
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing.base,
        borderRadius: BorderRadius.xl,
        padding: Spacing['2xl'],
        ...Shadows.sm,
    },
    billTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.base },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
    billKey: { fontSize: Typography.fontSize.base, color: Colors.text.secondary },
    billVal: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Medium', color: Colors.text.primary },
    freeDelivery: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.primary },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
    totalKey: { fontSize: Typography.fontSize.md, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    totalVal: { fontSize: Typography.fontSize.md, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    checkoutBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        paddingBottom: Spacing['2xl'],
        gap: Spacing.base,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        ...Shadows.lg,
    },
    checkoutSummary: { flex: 0.8 },
    checkoutTotal: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    checkoutItems: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    checkoutBtn: { flex: 1.8, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.primary },
    checkoutGradient: { paddingVertical: Spacing.base, alignItems: 'center' },
    checkoutBtnText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: '#fff' },
});
