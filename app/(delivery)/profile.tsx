import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOutUser } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';

export default function DeliveryProfileScreen() {
    const { user, logout } = useAuthStore();
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.infoCard}>
                    <Text style={styles.name}>{user?.name ?? 'Partner'}</Text>
                    <Text style={styles.phone}>{user?.phone}</Text>
                </View>
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={async () => { await signOutUser(); logout(); router.replace('/(auth)'); }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialIcons name="logout" size={20} color={Colors.error} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    scroll: { padding: Spacing.base },
    infoCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing['2xl'], marginBottom: Spacing.base, ...Shadows.sm },
    name: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    phone: { fontSize: Typography.fontSize.base, color: Colors.text.secondary },
    logoutBtn: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base + 4, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.error },
    logoutText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: Colors.error },
});
