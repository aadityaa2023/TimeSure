import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing } from '@/constants/Typography';

export default function AdminAnalytics() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface, gap: Spacing.base }}>
                <TouchableOpacity onPress={() => router.back()}><Text style={{ fontSize: 24 }}>←</Text></TouchableOpacity>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary }}>Analytics</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 56 }}>📊</Text>
                <Text style={{ fontSize: Typography.fontSize.base, color: Colors.text.secondary, marginTop: Spacing.base }}>Analytics dashboard coming soon</Text>
                <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.disabled, marginTop: Spacing.xs }}>Integrate react-native-gifted-charts with Firestore aggregation</Text>
            </View>
        </SafeAreaView>
    );
}
