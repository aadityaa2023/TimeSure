import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const NOTIFICATION_TYPES = [
    { type: 'promo', label: 'Promotional', icon: 'local-offer', color: Colors.secondary },
    { type: 'order', label: 'Order Update', icon: 'receipt', color: Colors.info },
    { type: 'system', label: 'System', icon: 'info', color: Colors.warning },
] as const;

const TARGET_OPTIONS = [
    { value: 'all', label: 'All Users' },
    { value: 'user', label: 'Customers Only' },
    { value: 'delivery', label: 'Delivery Partners Only' },
];

export default function AdminNotificationsScreen() {
    const [form, setForm] = useState({
        title: '',
        body: '',
        type: 'promo' as 'promo' | 'order' | 'system',
        target: 'all',
    });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = async () => {
        if (!form.title.trim() || !form.body.trim()) {
            Alert.alert('Required', 'Title and message are required.');
            return;
        }
        const confirm = Platform.OS === 'web'
            ? window.confirm(`Send notification to "${TARGET_OPTIONS.find(t => t.value === form.target)?.label}"?`)
            : await new Promise<boolean>(resolve => {
                Alert.alert('Send Notification', 'Confirm sending this notification?', [
                    { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
                    { text: 'Send', onPress: () => resolve(true) },
                ]);
            });
        if (!confirm) return;

        setSending(true);
        try {
            // Store notification record in Firestore
            await addDoc(collection(db, 'admin_notifications'), {
                title: form.title.trim(),
                body: form.body.trim(),
                type: form.type,
                target: form.target,
                sentAt: serverTimestamp(),
                status: 'sent',
            });
            setSent(true);
            setForm({ title: '', body: '', type: 'promo', target: 'all' });
            setTimeout(() => setSent(false), 3000);
        } catch {
            Alert.alert('Error', 'Failed to send notification. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Push Notifications</Text>
                <View style={{ width: 30 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <MaterialCommunityIcons name="bell-ring" size={20} color={Colors.info} />
                    <Text style={styles.infoText}>
                        Send push notifications to your users and delivery partners. Notifications will be saved in Firestore for FCM dispatch.
                    </Text>
                </View>

                {/* Success Banner */}
                {sent && (
                    <View style={styles.successBanner}>
                        <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                        <Text style={styles.successText}>Notification sent successfully!</Text>
                    </View>
                )}

                {/* Notification Type */}
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Notification Type</Text>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                        {NOTIFICATION_TYPES.map(t => (
                            <TouchableOpacity
                                key={t.type}
                                style={[styles.typeCard, form.type === t.type && { borderColor: t.color, backgroundColor: t.color + '15' }]}
                                onPress={() => setForm(f => ({ ...f, type: t.type }))}
                            >
                                <MaterialIcons name={t.icon as any} size={20} color={form.type === t.type ? t.color : Colors.text.secondary} />
                                <Text style={[styles.typeCardLabel, form.type === t.type && { color: t.color }]}>{t.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Target Audience */}
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Target Audience</Text>
                    <View style={{ gap: Spacing.sm }}>
                        {TARGET_OPTIONS.map(t => (
                            <TouchableOpacity
                                key={t.value}
                                style={[styles.targetOption, form.target === t.value && { borderColor: Colors.primary, backgroundColor: Colors.primaryLight }]}
                                onPress={() => setForm(f => ({ ...f, target: t.value }))}
                            >
                                <MaterialIcons
                                    name={t.value === 'all' ? 'people' : t.value === 'user' ? 'person' : 'delivery-dining'}
                                    size={18}
                                    color={form.target === t.value ? Colors.primary : Colors.text.secondary}
                                />
                                <Text style={[styles.targetText, form.target === t.value && { color: Colors.primary, fontFamily: 'Poppins-SemiBold' }]}>{t.label}</Text>
                                {form.target === t.value && <MaterialIcons name="check" size={18} color={Colors.primary} style={{ marginLeft: 'auto' }} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Title */}
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Title *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.title}
                        onChangeText={v => setForm(f => ({ ...f, title: v }))}
                        placeholder="e.g. 🎉 Weekend Sale is Live!"
                        placeholderTextColor={Colors.text.disabled}
                        maxLength={100}
                    />
                    <Text style={styles.charCount}>{form.title.length}/100</Text>
                </View>

                {/* Body */}
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Message *</Text>
                    <TextInput
                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                        value={form.body}
                        onChangeText={v => setForm(f => ({ ...f, body: v }))}
                        placeholder="Write your notification message here..."
                        placeholderTextColor={Colors.text.disabled}
                        multiline
                        maxLength={300}
                    />
                    <Text style={styles.charCount}>{form.body.length}/300</Text>
                </View>

                {/* Preview */}
                {(form.title || form.body) && (
                    <View style={styles.preview}>
                        <Text style={styles.previewHeader}>Preview</Text>
                        <View style={styles.previewCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                                <MaterialCommunityIcons name="bell" size={18} color={Colors.primary} />
                                <Text style={styles.appName}>TimeSure</Text>
                                <Text style={styles.previewTime}>now</Text>
                            </View>
                            <Text style={styles.previewTitle}>{form.title || 'Notification title'}</Text>
                            <Text style={styles.previewBody}>{form.body || 'Notification message...'}</Text>
                        </View>
                    </View>
                )}

                {/* Send Button */}
                <TouchableOpacity
                    style={[styles.sendBtn, sending && { opacity: 0.7 }]}
                    onPress={handleSend}
                    disabled={sending}
                >
                    {sending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                            <MaterialCommunityIcons name="send" size={18} color="#fff" />
                            <Text style={styles.sendBtnText}>Send Notification</Text>
                        </View>
                    )}
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
    infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.info + '15', borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.base },
    infoText: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.info, lineHeight: 20 },
    successBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.success + '15', borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.base },
    successText: { fontSize: Typography.fontSize.sm, color: Colors.success, fontFamily: 'Poppins-Medium' },
    formGroup: { marginBottom: Spacing.base },
    formLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    typeCard: { flex: 1, alignItems: 'center', gap: 4, padding: Spacing.sm, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border },
    typeCardLabel: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, fontFamily: 'Poppins-Medium', textAlign: 'center' },
    targetOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, padding: Spacing.base, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border },
    targetText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Medium', color: Colors.text.primary },
    input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontSize: Typography.fontSize.base, color: Colors.text.primary },
    charCount: { fontSize: Typography.fontSize.xs, color: Colors.text.disabled, textAlign: 'right', marginTop: 4 },
    preview: { marginBottom: Spacing.base },
    previewHeader: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    previewCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, gap: 4, ...Shadows.sm },
    appName: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.primary },
    previewTime: { fontSize: Typography.fontSize.xs, color: Colors.text.disabled, marginLeft: 'auto' as any },
    previewTitle: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    previewBody: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    sendBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.base, alignItems: 'center', ...Shadows.primary },
    sendBtnText: { color: '#fff', fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold' },
});
