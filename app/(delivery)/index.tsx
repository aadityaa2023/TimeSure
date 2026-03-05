import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { useAuthStore } from '@/stores/authStore';
import { MaterialIcons } from '@expo/vector-icons';

export default function DeliveryDashboard() {
    const { user } = useAuthStore();
    const [isOnline, setIsOnline] = useState(false);
    const [stats, setStats] = useState({ todayOrders: 0, todayEarnings: 0, rating: 4.8 });

    useEffect(() => {
        if (!user?.uid) return;
        const unsub = onSnapshot(doc(db, 'deliveryPartners', user.uid), snap => {
            if (snap.exists()) {
                const data = snap.data();
                setIsOnline(data.isOnline ?? false);
                setStats({
                    todayOrders: data.earnings?.todayOrders ?? 0,
                    todayEarnings: data.earnings?.today ?? 0,
                    rating: data.rating ?? 4.8,
                });
            }
        });
        return unsub;
    }, [user?.uid]);

    const toggleOnline = async () => {
        if (!user?.uid) return;
        const newStatus = !isOnline;
        try {
            await updateDoc(doc(db, 'deliveryPartners', user.uid), { isOnline: newStatus });
            setIsOnline(newStatus);
        } catch {
            Alert.alert('Error', 'Failed to update status.');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] ?? 'Partner'}</Text>
                        <MaterialIcons name="moped" size={24} color="#fff" />
                    </View>
                    <Text style={styles.subGreeting}>Ready to earn today?</Text>
                </View>
                <View style={styles.onlineToggle}>
                    <Text style={styles.onlineLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
                    <Switch
                        value={isOnline}
                        onValueChange={toggleOnline}
                        trackColor={{ false: '#ccc', true: '#34A853' }}
                        thumbColor="#fff"
                    />
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: isOnline ? Colors.primaryLight : '#FFF3E0' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <MaterialIcons
                            name={isOnline ? 'check-circle' : 'warning'}
                            size={18}
                            color={isOnline ? Colors.primary : Colors.warning}
                        />
                        <Text style={[styles.statusText, { color: isOnline ? Colors.primary : Colors.warning }]}>
                            {isOnline ? 'You are online and ready to receive orders' : 'You are offline. Go online to receive orders'}
                        </Text>
                    </View>
                </View>

                {/* Today Stats */}
                <Text style={styles.sectionTitle}>Today's Summary</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <LinearGradient colors={['#0C831F', '#34A853']} style={styles.statGradient}>
                            <Text style={styles.statNum}>₹{stats.todayEarnings}</Text>
                            <Text style={styles.statLabel}>Earnings</Text>
                        </LinearGradient>
                    </View>
                    <View style={styles.statCard}>
                        <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.statGradient}>
                            <Text style={styles.statNum}>{stats.todayOrders}</Text>
                            <Text style={styles.statLabel}>Deliveries</Text>
                        </LinearGradient>
                    </View>
                    <View style={styles.statCard}>
                        <LinearGradient colors={['#7B1FA2', '#AB47BC']} style={styles.statGradient}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MaterialIcons name="star" size={16} color="#fff" />
                                <Text style={styles.statNum}>{stats.rating}</Text>
                            </View>
                            <Text style={styles.statLabel}>Rating</Text>
                        </LinearGradient>
                    </View>
                </View>

                {/* Tips */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.base, marginTop: Spacing.sm }}>
                    <MaterialIcons name="lightbulb" size={20} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>Tips to Earn More</Text>
                </View>
                <View style={styles.tipsCard}>
                    {[
                        'Stay online during peak hours (7-10 PM)',
                        'Complete deliveries on time for bonus pay',
                        'Maintain 4.5+ rating for priority orders',
                        'Accept orders in high-demand zones',
                    ].map((tip, i) => (
                        <View key={i} style={styles.tipRow}>
                            <Text style={styles.tipDot}>•</Text>
                            <Text style={styles.tipText}>{tip}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
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
        paddingVertical: Spacing['2xl'],
    },
    headerLeft: {},
    greeting: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: '#fff' },
    subGreeting: { fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins-Regular' },
    onlineToggle: { alignItems: 'center', gap: 4 },
    onlineLabel: { fontSize: Typography.fontSize.xs, color: '#fff', fontFamily: 'Poppins-SemiBold' },
    scroll: { padding: Spacing.base },
    statusBanner: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        marginBottom: Spacing.base,
    },
    statusText: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-Medium', textAlign: 'center' },
    sectionTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.base, marginTop: Spacing.sm },
    statsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
    statCard: { flex: 1, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.md },
    statGradient: { padding: Spacing.base, alignItems: 'center' },
    statNum: { fontSize: Typography.fontSize.lg, fontFamily: 'Poppins-Bold', color: '#fff', marginBottom: 2 },
    statLabel: { fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins-Regular' },
    tipsCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing['2xl'],
        ...Shadows.sm,
    },
    tipRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, alignItems: 'flex-start' },
    tipDot: { fontSize: 16, color: Colors.primary, marginTop: -2 },
    tipText: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.text.secondary, lineHeight: 20 },
});
