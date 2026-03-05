import React, { useState } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';
import { auth } from '@/lib/firebase';
import { updateUserProfile } from '@/services/auth.service';
import { uploadProfileImage } from '@/services/storage.service';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileSetupScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const { setUser, user } = useAuthStore();

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter your name.');
            return;
        }
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        setUploading(true);
        try {
            let photoURL: string | undefined;
            if (photoUri) {
                photoURL = await uploadProfileImage(uid, photoUri);
            }
            const updates = {
                name: name.trim(),
                email: email.trim(),
                ...(photoURL ? { photoURL } : {}),
            };
            await updateUserProfile(uid, updates);
            setUser({ ...user!, ...updates });

            // Navigate based on role
            if (user?.role === 'delivery') {
                router.replace('/(delivery)');
            } else {
                router.replace('/(user)');
            }
        } catch {
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>Complete Your Profile</Text>
                    <Text style={styles.subtitle}>
                        Help us personalize your experience
                    </Text>

                    {/* Avatar Picker */}
                    <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                        {photoUri ? (
                            <Image source={{ uri: photoUri }} style={styles.avatar} contentFit="cover" />
                        ) : (
                            <LinearGradient colors={['#0C831F', '#34A853']} style={styles.avatarPlaceholder}>
                                {name ? (
                                    <Text style={styles.avatarInitial}>{name[0].toUpperCase()}</Text>
                                ) : (
                                    <MaterialIcons name="person" size={54} color="#fff" />
                                )}
                            </LinearGradient>
                        )}
                        <View style={styles.cameraIcon}>
                            <MaterialIcons name="camera-alt" size={18} color={Colors.text.primary} />
                        </View>
                    </TouchableOpacity>

                    {/* Inputs */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                placeholderTextColor={Colors.text.disabled}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email (optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={Colors.text.disabled}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, uploading && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={uploading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#0C831F', '#34A853']}
                            style={styles.saveGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={styles.saveText}>Save & Continue</Text>
                                    <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
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
        paddingTop: Spacing['3xl'],
        paddingBottom: Spacing['2xl'],
        alignItems: 'center',
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
        alignSelf: 'flex-start',
    },
    subtitle: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
        marginBottom: Spacing['2xl'],
        alignSelf: 'flex-start',
    },
    avatarContainer: {
        width: 110,
        height: 110,
        marginBottom: Spacing['2xl'],
        position: 'relative',
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
    },
    avatarPlaceholder: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.primary,
    },
    avatarInitial: {
        fontSize: 44,
        color: '#fff',
        fontFamily: Typography.fontFamily.bold,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.md,
    },
    form: { width: '100%', gap: Spacing.base, marginBottom: Spacing['2xl'] },
    inputGroup: { gap: Spacing.xs },
    label: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.semiBold,
        color: Colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.base,
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.primary,
        ...Shadows.sm,
    },
    saveBtn: {
        width: '100%',
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadows.primary,
    },
    saveGradient: { paddingVertical: Spacing.base + 2, alignItems: 'center' },
    saveText: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.semiBold,
        color: '#fff',
    },
});
