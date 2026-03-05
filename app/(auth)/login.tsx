import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { auth, db } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ActivityIndicator } from 'react-native';

const ROLES: { label: string; role: UserRole; icon: keyof typeof MaterialIcons.glyphMap; desc: string; colors: [string, string] }[] = [
    {
        label: 'Customer',
        role: 'user',
        icon: 'shopping-cart',
        desc: 'Browse products & place orders',
        colors: ['#0C831F', '#34A853'],
    },
    {
        label: 'Admin',
        role: 'admin',
        icon: 'admin-panel-settings',
        desc: 'Manage orders, products & users',
        colors: ['#1565C0', '#42A5F5'],
    },
    {
        label: 'Delivery Partner',
        role: 'delivery',
        icon: 'directions-bike',
        desc: 'View & deliver assigned orders',
        colors: ['#6A1B9A', '#AB47BC'],
    },
];

const ROUTE_MAP: Record<UserRole, string> = {
    user: '/(user)',
    admin: '/(admin)',
    delivery: '/(delivery)',
};

export default function LoginScreen() {
    const { setUser } = useAuthStore();
    const [isAuthenticating, setIsAuthenticating] = React.useState<string | null>(null);

    const handleRoleSelect = async (role: UserRole) => {
        setIsAuthenticating(role);
        try {
            // 1. Sign in anonymously to satisfy Firestore 'isAuthenticated()' rules
            const { user: firebaseUser } = await signInAnonymously(auth);

            // 2. Create/Update user document in Firestore to satisfy 'getUserRole()' rules
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userData = {
                uid: firebaseUser.uid,
                id: firebaseUser.uid,
                name: role === 'admin' ? 'Admin Dev' : role === 'delivery' ? 'Delivery Dev' : 'Customer Dev',
                phone: '+910000000000',
                role,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(userRef, userData, { merge: true });

            // 3. Update local store
            setUser(userData as any);

            router.replace(ROUTE_MAP[role] as any);
        } catch (error: any) {
            console.error('Bypass Auth Error:', error);
            alert(`Failed to authenticate: ${error.message}\n\nPlease ensure 'Anonymous Sign-in' is enabled in your Firebase Console.`);
        } finally {
            setIsAuthenticating(null);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={Platform.OS === 'web' ? styles.webContainer : styles.mobileContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <LinearGradient colors={['#0C831F', '#34A853']} style={styles.logoCircle}>
                            <MaterialIcons name="flash-on" size={48} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.appName}>TimeSure</Text>
                        <Text style={styles.tagline}>Delivery in 10 minutes</Text>
                    </View>

                    {/* Dev login notice */}
                    <View style={styles.devBadge}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MaterialIcons name="build" size={16} color="#F57F17" />
                            <Text style={styles.devText}>Dev Mode — No credentials required</Text>
                        </View>
                    </View>

                    {/* Role cards */}
                    <Text style={styles.pickLabel}>Continue as</Text>
                    {ROLES.map(item => (
                        <TouchableOpacity
                            key={item.role}
                            style={styles.card}
                            onPress={() => handleRoleSelect(item.role)}
                            activeOpacity={0.85}
                            // @ts-ignore
                            style={[
                                styles.card,
                                Platform.OS === 'web' && { cursor: 'pointer' }
                            ]}
                        >
                            <LinearGradient
                                colors={item.colors}
                                style={styles.cardGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <MaterialIcons name={item.icon} size={36} color="#fff" />
                                <View style={styles.cardText}>
                                    <Text style={styles.cardLabel}>{item.label}</Text>
                                    <Text style={styles.cardDesc}>{item.desc}</Text>
                                </View>
                                {isAuthenticating === item.role ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <MaterialIcons name="arrow-forward" size={24} color="#fff" />
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
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
    webContainer: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    mobileContainer: {
        width: '100%',
    },
    header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
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
    devBadge: {
        backgroundColor: '#FFF8E1',
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.base,
        marginBottom: Spacing['2xl'],
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD54F',
    },
    devText: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.medium,
        color: '#F57F17',
    },
    pickLabel: {
        fontSize: Typography.fontSize.lg,
        fontFamily: Typography.fontFamily.semiBold,
        color: Colors.text.primary,
        marginBottom: Spacing.base,
    },
    card: {
        borderRadius: BorderRadius['2xl'],
        overflow: 'hidden',
        marginBottom: Spacing.base,
        ...Shadows.lg,
    },
    cardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing['2xl'],
        gap: Spacing.base,
    },
    cardEmoji: { fontSize: 32 },
    cardText: { flex: 1 },
    cardLabel: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.semiBold,
        color: '#fff',
    },
    cardDesc: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    cardArrow: {
        fontSize: Typography.fontSize.xl,
        color: '#fff',
        fontFamily: Typography.fontFamily.bold,
    },
});
