import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { app } from '@/lib/firebase';
import { sendOTP, verifyOTP, createUserProfile, getUserProfile } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import type { ConfirmationResult } from 'firebase/auth';

const OTP_LENGTH = 6;

export default function OTPScreen() {
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
    const { setUser } = useAuthStore();

    useEffect(() => {
        // Auto-send OTP on mount
        sendOTPToPhone();
        // Countdown timer
        const interval = setInterval(() => {
            setResendTimer(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const sendOTPToPhone = async () => {
        try {
            if (!recaptchaVerifier.current) return;
            const result = await sendOTP(phone!, recaptchaVerifier.current);
            setConfirmResult(result);
        } catch (e) {
            Alert.alert('Error', 'Failed to send OTP. Please go back and try again.');
        }
    };

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
        if (newOtp.every(d => d !== '') && newOtp.join('').length === OTP_LENGTH) {
            verifyCode(newOtp.join(''));
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const verifyCode = async (code: string) => {
        if (!confirmResult) return;
        setLoading(true);
        try {
            const firebaseUser = await verifyOTP(confirmResult, code);
            const profile = await getUserProfile(firebaseUser.uid);
            if (profile) {
                setUser(profile);
                // Root layout handles routing
            } else {
                // New user — create minimal profile and go to role select
                await createUserProfile(firebaseUser.uid, {
                    uid: firebaseUser.uid,
                    phone: phone!,
                    name: '',
                    email: '',
                    role: 'user',
                    addresses: [],
                });
                router.replace('/(auth)/role-select');
            }
        } catch (e) {
            Alert.alert('Invalid OTP', 'The code you entered is incorrect. Please try again.');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <FirebaseRecaptchaVerifierModal
                ref={recaptchaVerifier}
                firebaseConfig={app.options}
                attemptInvisibleVerification
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.content}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialIcons name="arrow-back" size={20} color={Colors.primary} />
                            <Text style={styles.backText}>Back</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Verify OTP</Text>
                        <Text style={styles.subtitle}>
                            We sent a 6-digit code to{'\n'}
                            <Text style={styles.phone}>{phone}</Text>
                        </Text>
                    </View>

                    {/* OTP Boxes */}
                    <View style={styles.otpRow}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => {
                                    inputRefs.current[index] = ref;
                                }}
                                style={[styles.otpBox, digit ? styles.otpBoxFilled : {}]}
                                value={digit}
                                onChangeText={v => handleOtpChange(v.slice(-1), index)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                keyboardType="numeric"
                                maxLength={1}
                                textAlign="center"
                                selectTextOnFocus
                                autoFocus={index === 0}
                            />
                        ))}
                    </View>

                    {loading && (
                        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
                    )}

                    {/* Resend */}
                    <View style={styles.resendRow}>
                        <Text style={styles.resendText}>Didn't receive the code? </Text>
                        {resendTimer > 0 ? (
                            <Text style={styles.timerText}>Resend in {resendTimer}s</Text>
                        ) : (
                            <TouchableOpacity onPress={() => { setResendTimer(30); sendOTPToPhone(); }}>
                                <Text style={styles.resendLink}>Resend OTP</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.verifyBtn, loading && { opacity: 0.6 }]}
                        onPress={() => verifyCode(otp.join(''))}
                        disabled={loading || otp.some(d => d === '')}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#0C831F', '#34A853']}
                            style={styles.verifyGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.verifyText}>Verify & Continue</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1, paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.base },
    backBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.sm },
    backText: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.primary,
    },
    header: { marginTop: Spacing['2xl'], marginBottom: Spacing['3xl'] },
    title: {
        fontSize: Typography.fontSize['3xl'],
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
        lineHeight: 24,
    },
    phone: {
        fontFamily: Typography.fontFamily.semiBold,
        color: Colors.text.primary,
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing['2xl'],
    },
    otpBox: {
        width: 50,
        height: 56,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        fontSize: Typography.fontSize.xl,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        ...Shadows.sm,
    },
    otpBoxFilled: { borderColor: Colors.primary },
    resendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
    },
    resendText: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.secondary,
    },
    timerText: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.disabled,
        fontFamily: Typography.fontFamily.medium,
    },
    resendLink: {
        fontSize: Typography.fontSize.base,
        color: Colors.primary,
        fontFamily: Typography.fontFamily.semiBold,
        textDecorationLine: 'underline',
    },
    verifyBtn: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadows.primary,
    },
    verifyGradient: {
        paddingVertical: Spacing.base,
        alignItems: 'center',
    },
    verifyText: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.semiBold,
        color: '#fff',
    },
});
