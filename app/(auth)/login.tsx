import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const handleSendOTP = async () => {
        const cleaned = phoneNumber.replace(/\D/g, '');
        if (cleaned.length !== 10) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
            return;
        }
        setLoading(true);
        try {
            // reCAPTCHA and OTP sending is handled in the OTP screen
            // Pass phone to OTP screen via params
            router.push({ pathname: '/(auth)/otp', params: { phone: `+91${cleaned}` } });
        } catch (e) {
            Alert.alert('Error', 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* Header */}
                    <View style={styles.header}>
                        <LinearGradient colors={['#0C831F', '#34A853']} style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>⚡</Text>
                        </LinearGradient>
                        <Text style={styles.appName}>TimeSure</Text>
                        <Text style={styles.tagline}>Delivery in 10 minutes</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.card}>
                        <Text style={styles.welcomeText}>Welcome!</Text>
                        <Text style={styles.subText}>Enter your mobile number to get started</Text>

                        <View style={styles.phoneRow}>
                            <View style={styles.countryCode}>
                                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                            </View>
                            <TextInput
                                ref={inputRef}
                                style={styles.phoneInput}
                                placeholder="Mobile number"
                                placeholderTextColor={Colors.text.disabled}
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.sendBtn, loading && { opacity: 0.7 }]}
                            onPress={handleSendOTP}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#0C831F', '#34A853']}
                                style={styles.sendGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.sendText}>
                                    {loading ? 'Sending OTP...' : 'Send OTP →'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={styles.termsText}>
                            By continuing, you agree to our{' '}
                            <Text style={styles.link}>Terms of Service</Text> and{' '}
                            <Text style={styles.link}>Privacy Policy</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: Spacing['2xl'],
        paddingTop: Spacing['4xl'],
        paddingBottom: Spacing['2xl'],
    },
    header: { alignItems: 'center', marginBottom: Spacing['3xl'] },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.base,
        ...Shadows.primary,
    },
    logoEmoji: { fontSize: 40 },
    appName: {
        fontSize: Typography.fontSize['3xl'],
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    tagline: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing['2xl'],
        ...Shadows.lg,
    },
    welcomeText: {
        fontSize: Typography.fontSize['2xl'],
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    subText: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
        marginBottom: Spacing['2xl'],
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing['2xl'],
        overflow: 'hidden',
    },
    countryCode: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        backgroundColor: Colors.primaryLight,
        borderRightWidth: 1.5,
        borderRightColor: Colors.border,
    },
    countryCodeText: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
        letterSpacing: 1.5,
    },
    sendBtn: {
        width: '100%',
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        marginBottom: Spacing.base,
        ...Shadows.primary,
    },
    sendGradient: {
        paddingVertical: Spacing.base,
        alignItems: 'center',
    },
    sendText: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.semiBold,
        color: '#fff',
    },
    termsText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    link: { color: Colors.primary, fontFamily: Typography.fontFamily.medium },
});
