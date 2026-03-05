import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';

export default function AdminCategoriesScreen() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface, gap: Spacing.base }}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary }}>Categories</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="category" size={64} color={Colors.primary} />
                <Text style={{ fontSize: Typography.fontSize.base, color: Colors.text.secondary, marginTop: Spacing.base }}>Category management coming soon</Text>
            </View>
        </SafeAreaView>
    );
}
