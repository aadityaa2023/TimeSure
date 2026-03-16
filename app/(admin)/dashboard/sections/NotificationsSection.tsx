import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert,
    TextInput, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const TYPES = [
    { type: 'promo',  label: 'Promotional', icon: 'local-offer',  color: Colors.secondary },
    { type: 'order',  label: 'Order Update', icon: 'receipt',      color: Colors.info },
    { type: 'system', label: 'System',       icon: 'info',         color: Colors.warning },
] as const;

const TARGETS = [
    { value: 'all',      label: 'All Users',         icon: 'people' },
    { value: 'user',     label: 'Customers Only',     icon: 'person' },
    { value: 'delivery', label: 'Delivery Partners',  icon: 'delivery-dining' },
] as const;

export default function NotificationsSection() {
    const [form, setForm] = useState({ title: '', body: '', type: 'promo', target: 'all' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSend = async () => {
        if (!form.title.trim() || !form.body.trim()) { Alert.alert('Required', 'Title and message required.'); return; }
        const confirmed = Platform.OS === 'web'
            ? window.confirm('Send this notification?')
            : await new Promise<boolean>(r => Alert.alert('Confirm', 'Send notification?', [{ text: 'Cancel', onPress: () => r(false), style: 'cancel' }, { text: 'Send', onPress: () => r(true) }]));
        if (!confirmed) return;
        setSending(true);
        try {
            await addDoc(collection(db, 'admin_notifications'), { ...form, sentAt: serverTimestamp(), status: 'sent' });
            setSent(true); setForm({ title: '', body: '', type: 'promo', target: 'all' });
            setTimeout(() => setSent(false), 4000);
        } catch { Alert.alert('Error', 'Failed to send.'); }
        finally { setSending(false); }
    };

    return (
        <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.infoBox}>
                <MaterialCommunityIcons name="bell-ring" size={18} color={Colors.info} />
                <Text style={styles.infoText}>Notifications are stored in Firestore. Deploy an FCM Cloud Function to dispatch them to user devices.</Text>
            </View>
            {sent && (
                <View style={styles.successBox}>
                    <MaterialIcons name="check-circle" size={18} color={Colors.success} />
                    <Text style={styles.successText}>Notification sent successfully!</Text>
                </View>
            )}
            {/* Type */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {TYPES.map(t => (
                        <TouchableOpacity key={t.type} style={[styles.typeCard, form.type === t.type && { borderColor: t.color, backgroundColor: t.color + '15' }]} onPress={() => setForm(f => ({ ...f, type: t.type }))}>
                            <MaterialIcons name={t.icon as any} size={18} color={form.type === t.type ? t.color : Colors.text.secondary} />
                            <Text style={[styles.typeLabel, form.type === t.type && { color: t.color }]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            {/* Target */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Target Audience</Text>
                {TARGETS.map(t => (
                    <TouchableOpacity key={t.value} style={[styles.targetRow, form.target === t.value && { borderColor: Colors.primary, backgroundColor: Colors.primaryLight }]} onPress={() => setForm(f => ({ ...f, target: t.value }))}>
                        <MaterialIcons name={t.icon as any} size={18} color={form.target === t.value ? Colors.primary : Colors.text.secondary} />
                        <Text style={[styles.targetText, form.target === t.value && { color: Colors.primary, fontFamily: 'Poppins-SemiBold' }]}>{t.label}</Text>
                        {form.target === t.value && <MaterialIcons name="check" size={16} color={Colors.primary} style={{ marginLeft: 'auto' as any }} />}
                    </TouchableOpacity>
                ))}
            </View>
            {/* Title */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. 🎉 Weekend Sale is Live!" placeholderTextColor={Colors.text.disabled} maxLength={100} />
                <Text style={styles.charCount}>{form.title.length}/100</Text>
            </View>
            {/* Body */}
            <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Message *</Text>
                <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]} value={form.body} onChangeText={v => setForm(f => ({ ...f, body: v }))} placeholder="Write your message here..." placeholderTextColor={Colors.text.disabled} multiline maxLength={300} />
                <Text style={styles.charCount}>{form.body.length}/300</Text>
            </View>
            {/* Preview */}
            {(form.title || form.body) && (
                <View style={[styles.preview, { marginBottom: Spacing.base }]}>
                    <Text style={[styles.formLabel, { marginBottom: 6 }]}>Preview</Text>
                    <View style={styles.previewCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <MaterialCommunityIcons name="bell" size={14} color={Colors.primary} />
                            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.primary }}>TimeSure</Text>
                            <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.disabled, marginLeft: 'auto' as any }}>now</Text>
                        </View>
                        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary }}>{form.title}</Text>
                        <Text style={{ fontSize: Typography.fontSize.xs, color: Colors.text.secondary }}>{form.body}</Text>
                    </View>
                </View>
            )}
            <TouchableOpacity style={[styles.sendBtn, sending && { opacity: 0.6 }]} onPress={handleSend} disabled={sending}>
                {sending ? <ActivityIndicator color="#fff" /> : <><MaterialCommunityIcons name="send" size={16} color="#fff" /><Text style={styles.sendText}>Send Notification</Text></>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: Spacing.base, maxWidth: 600 },
    infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.info + '15', borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.base },
    infoText: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.info, lineHeight: 20 },
    successBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.success + '15', borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.base },
    successText: { fontSize: Typography.fontSize.sm, color: Colors.success, fontFamily: 'Poppins-Medium' },
    formGroup: { marginBottom: Spacing.base },
    formLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    typeCard: { flex: 1, alignItems: 'center', gap: 4, padding: Spacing.sm, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border },
    typeLabel: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, textAlign: 'center' },
    targetRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, padding: Spacing.base, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 6 },
    targetText: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-Medium', color: Colors.text.primary },
    input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, fontSize: Typography.fontSize.base, color: Colors.text.primary },
    charCount: { fontSize: Typography.fontSize.xs, color: Colors.text.disabled, textAlign: 'right', marginTop: 2 },
    preview: {},
    previewCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
    sendBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    sendText: { color: '#fff', fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold' },
});
