import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToAuthState, getUserProfile } from '@/services/auth.service';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 2,
        },
    },
});

export default function RootLayout() {
    const { setUser, setLoading, role } = useAuthStore();

    const [fontsLoaded] = useFonts({
        'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
        'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
        'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
        'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    useEffect(() => {
        const unsubscribe = subscribeToAuthState(async firebaseUser => {
            if (firebaseUser) {
                const profile = await getUserProfile(firebaseUser.uid);
                if (profile) {
                    setUser(profile);
                    // Route based on role
                    if (profile.role === 'admin') {
                        router.replace('/(admin)');
                    } else if (profile.role === 'delivery') {
                        router.replace('/(delivery)');
                    } else {
                        router.replace('/(user)');
                    }
                } else {
                    // New user: go to profile setup
                    router.replace('/(auth)/profile-setup');
                }
            } else {
                setUser(null);
                router.replace('/(auth)');
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    if (!fontsLoaded) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <QueryClientProvider client={queryClient}>
                    <StatusBar style="auto" />
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(user)" />
                        <Stack.Screen name="(delivery)" />
                        <Stack.Screen name="(admin)" />
                    </Stack>
                    <Toast />
                </QueryClientProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
