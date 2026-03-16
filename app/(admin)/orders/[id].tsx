import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    FlatList,
    Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { getOrderById, updateOrderStatus, assignDeliveryPartner } from '@/services/orders.service';
import { getOnlineDeliveryPartners } from '@/services/deliveryPartners.service';
import type { Order, OrderStatus, DeliveryPartner } from '@/types';

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'packed', 'picked_up', 'on_the_way', 'delivered'];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }> = {
    pending: { label: 'Pending', color: Colors.status.pending, icon: 'schedule' },
    confirmed: { label: 'Confirmed', color: Colors.status.confirmed, icon: 'check-circle' },
    packed: { label: 'Packed', color: Colors.status.packed, icon: 'inventory' },
    picked_up: { label: 'Picked Up', color: Colors.status.picked_up, icon: 'directions-bike' },
    on_the_way: { label: 'On the Way', color: Colors.status.on_the_way, icon: 'delivery-dining' },
    delivered: { label: 'Delivered', color: Colors.status.delivered, icon: 'check' },
    cancelled: { label: 'Cancelled', color: Colors.status.cancelled, icon: 'cancel' },
};

export default function AdminOrderDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [statusLoading, setStatusLoading] = useState<string | null>(null);
    const [partnerModalVisible, setPartnerModalVisible] = useState(false);
    const [assigningPartner, setAssigningPartner] = useState<string | null>(null);

    const { data: order, isLoading } = useQuery({
        queryKey: ['admin-order', id],
        queryFn: () => getOrderById(id!),
        enabled: !!id,
    });

    const { data: partners = [] } = useQuery({
        queryKey: ['online-delivery-partners'],
        queryFn: getOnlineDeliveryPartners,
        enabled: partnerModalVisible,
    });

    const handleStatusUpdate = async (status: OrderStatus) => {
        if (!order) return;
        if (Platform.OS === 'web') {
            if (!window.confirm(`Update order status to "${STATUS_CONFIG[status].label}"?`)) return;
        } else {
            await new Promise<void>((resolve, reject) => {
                Alert.alert('Update Status', `Change to "${STATUS_CONFIG[status].label}"?`, [
                    { text: 'Cancel', style: 'cancel', onPress: () => reject() },
                    { text: 'Confirm', onPress: () => resolve() },
                ]);
            }).catch(() => { return; });
        }
        setStatusLoading(status);
        try {
            await updateOrderStatus(order.id, status, `Status updated by admin`);
            queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        } catch {
            Alert.alert('Error', 'Failed to update order status.');
        } finally {
            setStatusLoading(null);
        }
    };

    const handleAssignPartner = async (partner: DeliveryPartner) => {
        if (!order) return;
        setAssigningPartner(partner.uid);
        try {
            await assignDeliveryPartner(order.id, partner.uid, partner.name);
            queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            setPartnerModalVisible(false);
        } catch {
            Alert.alert('Error', 'Failed to assign delivery partner.');
        } finally {
            setAssigningPartner(null);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}><MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Order Detail</Text>
                    <View style={{ width: 30 }} />
                </View>
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}><MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Order Not Found</Text>
                    <View style={{ width: 30 }} />
                </View>
            </SafeAreaView>
        );
    }

    const statusConfig = STATUS_CONFIG[order.status];
    const currentStatusIndex = STATUS_FLOW.indexOf(order.status);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} /></TouchableOpacity>
                <Text style={styles.headerTitle}>#{order.id.slice(-8).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '22' }]}>
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label.toUpperCase()}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Order Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Items ({order.items.length})</Text>
                    {order.items.map((item, i) => (
                        <View key={i} style={styles.itemRow}>
                            {item.imageUrl ? (
                                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} contentFit="contain" />
                            ) : (
                                <View style={[styles.itemImage, { backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' }]}>
                                    <MaterialCommunityIcons name="package-variant-closed" size={20} color={Colors.primary} />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemUnit}>{item.unit} × {item.quantity}</Text>
                            </View>
                            <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                        </View>
                    ))}
                </View>

                {/* Price Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Price Summary</Text>
                    <View style={styles.priceRow}><Text style={styles.priceLabel}>Subtotal</Text><Text style={styles.priceValue}>₹{order.subtotal}</Text></View>
                    <View style={styles.priceRow}><Text style={styles.priceLabel}>Delivery</Text><Text style={styles.priceValue}>₹{order.deliveryFee}</Text></View>
                    {order.couponDiscount > 0 && (
                        <View style={styles.priceRow}><Text style={styles.priceLabel}>Coupon ({order.couponCode})</Text><Text style={[styles.priceValue, { color: Colors.primary }]}>-₹{order.couponDiscount}</Text></View>
                    )}
                    <View style={[styles.priceRow, { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border }]}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>₹{order.total}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Payment</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialIcons name={order.paymentMethod === 'cod' ? 'money' : 'credit-card'} size={14} color={Colors.text.secondary} />
                            <Text style={styles.priceValue}>{order.paymentMethod.toUpperCase()} · {order.paymentStatus.toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                {/* Delivery Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Information</Text>
                    <View style={styles.infoRow}>
                        <MaterialIcons name="location-on" size={18} color={Colors.primary} />
                        <Text style={styles.infoText}>{order.deliveryAddress.fullAddress}</Text>
                    </View>
                    {order.deliveryAddress.landmark && (
                        <View style={styles.infoRow}>
                            <MaterialIcons name="place" size={18} color={Colors.text.secondary} />
                            <Text style={styles.infoText}>{order.deliveryAddress.landmark}</Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <MaterialIcons name="schedule" size={18} color={Colors.info} />
                        <Text style={styles.infoText}>Slot: {order.deliverySlot?.label} · {order.deliverySlot?.date}</Text>
                    </View>
                    {order.otp && (
                        <View style={styles.infoRow}>
                            <MaterialIcons name="lock" size={18} color={Colors.warning} />
                            <Text style={styles.infoText}>Delivery OTP: <Text style={{ fontFamily: 'Poppins-Bold', color: Colors.warning, letterSpacing: 4 }}>{order.otp}</Text></Text>
                        </View>
                    )}
                </View>

                {/* Delivery Partner */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                        <Text style={styles.sectionTitle}>Delivery Partner</Text>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <TouchableOpacity style={styles.assignBtn} onPress={() => setPartnerModalVisible(true)}>
                                <MaterialIcons name="person-add" size={14} color={Colors.primary} />
                                <Text style={styles.assignBtnText}>{order.deliveryPartnerId ? 'Reassign' : 'Assign'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {order.deliveryPartnerId ? (
                        <View style={styles.partnerChip}>
                            <MaterialCommunityIcons name="moped" size={18} color={Colors.primary} />
                            <Text style={styles.partnerName}>{order.deliveryPartnerName || 'Partner assigned'}</Text>
                            <Text style={styles.partnerId}>ID: {order.deliveryPartnerId.slice(-6)}</Text>
                        </View>
                    ) : (
                        <Text style={{ color: Colors.text.secondary, fontSize: Typography.fontSize.sm }}>No partner assigned yet</Text>
                    )}
                </View>

                {/* Update Status */}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Update Status</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
                            {STATUS_FLOW.filter((s, i) => i > currentStatusIndex).map(status => {
                                const cfg = STATUS_CONFIG[status];
                                const loading = statusLoading === status;
                                return (
                                    <TouchableOpacity
                                        key={status}
                                        style={[styles.statusBtn, { borderColor: cfg.color, backgroundColor: cfg.color + '15' }]}
                                        onPress={() => handleStatusUpdate(status)}
                                        disabled={!!statusLoading}
                                    >
                                        {loading ? <ActivityIndicator size="small" color={cfg.color} /> : <MaterialIcons name={cfg.icon} size={16} color={cfg.color} />}
                                        <Text style={[styles.statusBtnText, { color: cfg.color }]}>{cfg.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                            <TouchableOpacity
                                style={[styles.statusBtn, { borderColor: Colors.error, backgroundColor: Colors.error + '15' }]}
                                onPress={() => handleStatusUpdate('cancelled')}
                                disabled={!!statusLoading}
                            >
                                {statusLoading === 'cancelled' ? <ActivityIndicator size="small" color={Colors.error} /> : <MaterialIcons name="cancel" size={16} color={Colors.error} />}
                                <Text style={[styles.statusBtnText, { color: Colors.error }]}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}

                {/* Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Timeline</Text>
                    {[...order.timeline].reverse().map((event, i) => {
                        const cfg = STATUS_CONFIG[event.status] ?? {};
                        return (
                            <View key={i} style={styles.timelineRow}>
                                <View style={[styles.timelineDot, { backgroundColor: cfg.color ?? Colors.text.disabled }]}>
                                    <MaterialIcons name={(cfg as any).icon ?? 'circle'} size={12} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.timelineStatus}>{(cfg as any).label ?? event.status}</Text>
                                    {event.note && <Text style={styles.timelineNote}>{event.note}</Text>}
                                    <Text style={styles.timelineTime}>{new Date(event.timestamp).toLocaleString('en-IN')}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Assign Delivery Partner Modal */}
            <Modal visible={partnerModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPartnerModalVisible(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
                    <View style={[styles.header, { justifyContent: 'space-between' }]}>
                        <TouchableOpacity onPress={() => setPartnerModalVisible(false)}><MaterialIcons name="close" size={24} color={Colors.text.primary} /></TouchableOpacity>
                        <Text style={styles.headerTitle}>Assign Partner</Text>
                        <View style={{ width: 30 }} />
                    </View>
                    {partners.length === 0 ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.base }}>
                            <MaterialCommunityIcons name="moped-outline" size={64} color={Colors.text.disabled} />
                            <Text style={{ color: Colors.text.secondary, fontSize: Typography.fontSize.base }}>No online partners available</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={partners}
                            keyExtractor={p => p.uid}
                            contentContainerStyle={{ padding: Spacing.base }}
                            ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                            renderItem={({ item: partner }) => (
                                <TouchableOpacity
                                    style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: Spacing.base }]}
                                    onPress={() => handleAssignPartner(partner)}
                                    disabled={assigningPartner === partner.uid}
                                >
                                    <View style={[styles.partnerAvatar, { backgroundColor: Colors.primaryLight }]}>
                                        <MaterialCommunityIcons name="moped" size={24} color={Colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemName}>{partner.name}</Text>
                                        <Text style={styles.itemUnit}>{partner.phone} · {partner.vehicleType ?? 'bike'}</Text>
                                        <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.primary }}>⭐ {partner.rating?.toFixed(1) ?? '—'} · {partner.totalDeliveries ?? 0} deliveries</Text>
                                    </View>
                                    {assigningPartner === partner.uid ? (
                                        <ActivityIndicator size="small" color={Colors.primary} />
                                    ) : (
                                        <MaterialIcons name="chevron-right" size={20} color={Colors.text.disabled} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    statusBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
    statusText: { fontSize: 9, fontFamily: 'Poppins-Bold', letterSpacing: 0.5 },
    scroll: { padding: Spacing.base },
    section: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, marginBottom: Spacing.base, ...Shadows.sm },
    sectionTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.base },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    itemImage: { width: 48, height: 48, borderRadius: BorderRadius.md },
    itemName: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    itemUnit: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, marginTop: 2 },
    itemPrice: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    priceLabel: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
    priceValue: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-Medium', color: Colors.text.primary },
    totalLabel: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    totalValue: { fontSize: Typography.fontSize.lg, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
    infoText: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.text.primary, lineHeight: 20 },
    assignBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.md },
    assignBtnText: { fontSize: Typography.fontSize.xs, color: Colors.primary, fontFamily: 'Poppins-Medium' },
    partnerChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryLight, padding: Spacing.sm, borderRadius: BorderRadius.lg },
    partnerName: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.primary },
    partnerId: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    partnerAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5 },
    statusBtnText: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold' },
    timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
    timelineDot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    timelineStatus: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    timelineNote: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    timelineTime: { fontSize: Typography.fontSize.xs, color: Colors.text.disabled, marginTop: 2 },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
});
