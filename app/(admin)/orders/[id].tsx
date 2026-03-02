import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing } from '@/constants/Typography';

export default function AdminOrderDetail() {
    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: Colors.background },
        header: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
        back: { fontSize: 24, color: Colors.text.primary },
        title: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    });
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
                <Text style={styles.title}>Order Detail</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.fontSize.base, color: Colors.text.secondary }}>Order detail coming soon</Text>
            </View>
        </SafeAreaView>
    );
}
