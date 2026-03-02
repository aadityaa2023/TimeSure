import { useEffect } from 'react';
import { Stack, router, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToAuthState, getUserProfile } from '@/services/auth.service';
import { MD3LightTheme, PaperProvider, configureFonts } from 'react-native-paper';
import { useState } from 'react';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 2,
        },
    },
});

const fontConfig = {
    fontFamily: 'Poppins-Regular',
};

const blinkitTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#F8CB46',
        secondary: '#0C831F', // Often used for delivery estimates / money
        background: '#FFFFFF',
        surface: '#FFFFFF',
        text: '#000000',
    },
};

export default function RootLayout() {
    const { setUser, setLoading, role } = useAuthStore();
    const [initialRoute, setInitialRoute] = useState<string | null>(null);
    const navigationState = useRootNavigationState();

    const [fontsLoaded] = useFonts({
        'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
        'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
        'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
        'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
        'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync().catch(() => { });
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
                        setInitialRoute('/(admin)');
                    } else if (profile.role === 'delivery') {
                        setInitialRoute('/(delivery)');
                    } else {
                        setInitialRoute('/(user)');
                    }
                } else {
                    // New user: go to profile setup
                    setInitialRoute('/(auth)/profile-setup');
                }
            } else {
                setUser(null);
                setInitialRoute('/(auth)');
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!fontsLoaded || !navigationState?.key || !initialRoute) return;
        router.replace(initialRoute as any);
        setInitialRoute(null);
    }, [fontsLoaded, navigationState?.key, initialRoute]);

    if (!fontsLoaded) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <QueryClientProvider client={queryClient}>
                    <PaperProvider theme={blinkitTheme}>
                        <StatusBar style="auto" />
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="(auth)" />
                            <Stack.Screen name="(user)" />
                            <Stack.Screen name="(delivery)" />
                            <Stack.Screen name="(admin)" />
                        </Stack>
                        <Toast />
                    </PaperProvider>
                </QueryClientProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
