import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { createOrder } from '@/services/orders.service';
import type { PaymentMethod, DeliverySlot, Address } from '@/types';

const TODAY = new Date().toISOString().split('T')[0];
const TOMORROW = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const DELIVERY_SLOTS: DeliverySlot[] = [
    { id: '1', label: 'Express (10 min)', startTime: 'Now', endTime: '+10 min', date: TODAY, slotsLeft: 5 },
    { id: '2', label: 'Morning', startTime: '09:00 AM', endTime: '12:00 PM', date: TODAY, slotsLeft: 12 },
    { id: '3', label: 'Afternoon', startTime: '12:00 PM', endTime: '04:00 PM', date: TODAY, slotsLeft: 8 },
    { id: '4', label: 'Evening', startTime: '04:00 PM', endTime: '08:00 PM', date: TODAY, slotsLeft: 15 },
    { id: '5', label: 'Morning', startTime: '09:00 AM', endTime: '12:00 PM', date: TOMORROW, slotsLeft: 20 },
    { id: '6', label: 'Afternoon', startTime: '12:00 PM', endTime: '04:00 PM', date: TOMORROW, slotsLeft: 18 },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: keyof typeof MaterialIcons.glyphMap; description: string }[] = [
    { id: 'upi', label: 'UPI', icon: 'smartphone', description: 'Pay via any UPI app (GPay, PhonePe, etc.)' },
    { id: 'card', label: 'Card', icon: 'credit-card', description: 'Credit or Debit card' },
    { id: 'wallet', label: 'Wallet', icon: 'account-balance-wallet', description: 'Pay using TimeSure wallet balance' },
    { id: 'cod', label: 'Cash on Delivery', icon: 'payments', description: 'Pay when your order arrives' },
];

export default function CheckoutScreen() {
    const params = useLocalSearchParams<{
        subtotal: string;
        couponCode: string;
        couponDiscount: string;
        deliveryFee: string;
        total: string;
    }>();

    const subtotal = parseFloat(params.subtotal ?? '0');
    const couponDiscount = parseFloat(params.couponDiscount ?? '0');
    const deliveryFee = parseFloat(params.deliveryFee ?? '0');
    const total = parseFloat(params.total ?? '0');

    const { user } = useAuthStore();
    const { items, clearCart } = useCartStore();

    const [selectedSlot, setSelectedSlot] = useState<DeliverySlot>(DELIVERY_SLOTS[0]);
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('upi');
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(
        user?.addresses?.find(a => a.isDefault) ?? user?.addresses?.[0] ?? null,
    );
    const [loading, setLoading] = useState(false);

    const placeOrder = async () => {
        if (!selectedAddress) {
            Alert.alert('No Address', 'Please add a delivery address first.');
            return;
        }
        if (!user) return;
        setLoading(true);
        try {
            const orderItems = items.map(i => ({
                productId: i.product.id,
                name: i.product.name,
                imageUrl: i.product.imageUrl,
                price: i.product.price,
                quantity: i.quantity,
                unit: i.product.unit,
            }));
            const orderId = await createOrder({
                userId: user.uid,
                items: orderItems,
                deliveryAddress: selectedAddress,
                deliverySlot: selectedSlot,
                couponCode: params.couponCode ?? undefined,
                couponDiscount,
                subtotal,
                deliveryFee,
                total,
                paymentMethod: selectedPayment,
            });
            clearCart();
            router.replace({ pathname: '/(user)/order/[id]', params: { id: orderId } });
        } catch {
            Alert.alert('Order Failed', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const todaySlots = DELIVERY_SLOTS.filter(s => s.date === TODAY);
    const tomorrowSlots = DELIVERY_SLOTS.filter(s => s.date === TOMORROW);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 30 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Delivery Address */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="location-on" size={20} color={Colors.primary} />
                        <Text style={styles.sectionTitleText}>Delivery Address</Text>
                    </View>
                    {selectedAddress ? (
                        <View style={styles.addressCard}>
                            <View style={styles.addressLeft}>
                                <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                                <Text style={styles.addressText}>{selectedAddress.fullAddress}</Text>
                                {selectedAddress.landmark && (
                                    <Text style={styles.landmark}>Near: {selectedAddress.landmark}</Text>
                                )}
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.changeText}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.addAddressBtn}>
                            <Text style={styles.addAddressText}>+ Add Delivery Address</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Delivery Slots */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="access-time" size={20} color={Colors.primary} />
                        <Text style={styles.sectionTitleText}>Delivery Slot</Text>
                    </View>
                    <Text style={styles.slotGroupLabel}>Today</Text>
                    <View style={styles.slotsGrid}>
                        {todaySlots.map(slot => (
                            <TouchableOpacity
                                key={slot.id}
                                style={[styles.slotCard, selectedSlot.id === slot.id && styles.slotCardSelected]}
                                onPress={() => setSelectedSlot(slot)}
                            >
                                <Text style={[styles.slotLabel, selectedSlot.id === slot.id && styles.slotTextSelected]}>
                                    {slot.label}
                                </Text>
                                <Text style={[styles.slotTime, selectedSlot.id === slot.id && styles.slotTextSelected]}>
                                    {slot.startTime} – {slot.endTime}
                                </Text>
                                {slot.slotsLeft <= 5 && (
                                    <Text style={styles.slotFew}>Only {slot.slotsLeft} left</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.slotGroupLabel}>Tomorrow</Text>
                    <View style={styles.slotsGrid}>
                        {tomorrowSlots.map(slot => (
                            <TouchableOpacity
                                key={slot.id}
                                style={[styles.slotCard, selectedSlot.id === slot.id && styles.slotCardSelected]}
                                onPress={() => setSelectedSlot(slot)}
                            >
                                <Text style={[styles.slotLabel, selectedSlot.id === slot.id && styles.slotTextSelected]}>
                                    {slot.label}
                                </Text>
                                <Text style={[styles.slotTime, selectedSlot.id === slot.id && styles.slotTextSelected]}>
                                    {slot.startTime} – {slot.endTime}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Payment Methods */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="credit-card" size={20} color={Colors.primary} />
                        <Text style={styles.sectionTitleText}>Payment Method</Text>
                    </View>
                    {PAYMENT_METHODS.map(method => (
                        <TouchableOpacity
                            key={method.id}
                            style={[styles.paymentCard, selectedPayment === method.id && styles.paymentCardSelected]}
                            onPress={() => setSelectedPayment(method.id)}
                        >
                            <MaterialIcons name={method.icon} size={24} color={selectedPayment === method.id ? Colors.primary : Colors.text.secondary} />
                            <View style={styles.paymentInfo}>
                                <Text style={[styles.paymentLabel, selectedPayment === method.id && styles.paymentLabelSelected]}>
                                    {method.label}
                                </Text>
                                <Text style={styles.paymentDesc}>{method.description}</Text>
                            </View>
                            <View style={[styles.radio, selectedPayment === method.id && styles.radioSelected]}>
                                {selectedPayment === method.id && <View style={styles.radioDot} />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Bill Summary */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="receipt" size={20} color={Colors.primary} />
                        <Text style={styles.sectionTitleText}>Bill Summary</Text>
                    </View>
                    <View style={styles.billCard}>
                        <BillRow label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
                        {couponDiscount > 0 && (
                            <BillRow label="Coupon Discount" value={`−₹${couponDiscount.toFixed(2)}`} highlight />
                        )}
                        <BillRow
                            label="Delivery Fee"
                            value={deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                            highlight={deliveryFee === 0}
                        />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>

            {/* Place Order */}
            <View style={styles.placeOrderBar}>
                <View style={styles.orderSummary}>
                    <Text style={styles.orderTotal}>₹{total.toFixed(2)}</Text>
                    <Text style={styles.orderItems}>{items.length} items • {selectedSlot.label}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.placeBtn, loading && { opacity: 0.6 }]}
                    onPress={placeOrder}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    <LinearGradient colors={['#0C831F', '#34A853']} style={styles.placeGradient}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.placeBtnText}>Place Order</Text>
                                <MaterialIcons name="celebration" size={20} color="#fff" style={{ marginLeft: 8 }} />
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

function BillRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <View style={styles.billRow}>
            <Text style={styles.billKey}>{label}</Text>
            <Text style={[styles.billVal, highlight && styles.billHighlight]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backText: { fontSize: 24, color: Colors.text.primary },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    scroll: { padding: Spacing.base },
    section: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing['2xl'],
        marginBottom: Spacing.base,
        ...Shadows.sm,
    },
    sectionTitle: {
        marginBottom: Spacing.base,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.base,
    },
    sectionTitleText: {
        fontSize: Typography.fontSize.base,
        fontFamily: 'Poppins-Bold',
        color: Colors.text.primary,
    },
    // Address
    addressCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.primaryLight,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    addressLeft: { flex: 1 },
    addressLabel: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-Bold', color: Colors.primary, marginBottom: 2 },
    addressText: { fontSize: Typography.fontSize.base, color: Colors.text.primary, lineHeight: 20 },
    landmark: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary, marginTop: 2 },
    changeText: { fontSize: Typography.fontSize.base, color: Colors.primary, fontFamily: 'Poppins-SemiBold' },
    addAddressBtn: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        alignItems: 'center',
    },
    addAddressText: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, fontFamily: 'Poppins-Medium' },
    // Slots
    slotGroupLabel: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
    slotCard: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        padding: Spacing.sm,
        minWidth: 100,
        flex: 1,
        alignItems: 'center',
    },
    slotCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    slotLabel: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary, marginBottom: 2 },
    slotTime: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, textAlign: 'center' },
    slotTextSelected: { color: Colors.primary },
    slotFew: { fontSize: 9, color: Colors.warning, fontFamily: 'Poppins-SemiBold', marginTop: 2 },
    // Payment
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        marginBottom: Spacing.sm,
        gap: Spacing.sm,
    },
    paymentCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
    paymentEmoji: { fontSize: 24 },
    paymentInfo: { flex: 1 },
    paymentLabel: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    paymentLabelSelected: { color: Colors.primary },
    paymentDesc: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, marginTop: 2 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
    radioSelected: { borderColor: Colors.primary },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
    // Bill
    billCard: {},
    billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
    billKey: { fontSize: Typography.fontSize.base, color: Colors.text.secondary },
    billVal: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Medium', color: Colors.text.primary },
    billHighlight: { color: Colors.primary, fontFamily: 'Poppins-Bold' },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    totalLabel: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    totalAmount: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    // Bottom
    placeOrderBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.base,
        paddingBottom: Spacing['2xl'],
        gap: Spacing.base,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        ...Shadows.lg,
    },
    orderSummary: { flex: 0.8 },
    orderTotal: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    orderItems: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    placeBtn: { flex: 1.5, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.primary },
    placeGradient: { paddingVertical: Spacing.base, alignItems: 'center' },
    placeBtnText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: '#fff' },
});
