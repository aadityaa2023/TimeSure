import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    ViewToken,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        icon: 'shopping-cart' as const,
        title: 'Premium Ecommerce\nPlatform',
        subtitle: 'Shop top-quality products across multiple categories delivered right to your door.',
        bg: ['#0C831F', '#34A853'] as const,
    },
    {
        id: '2',
        icon: 'local-offer' as const,
        title: 'Best Prices &\nExclusive Offers',
        subtitle: 'Save more with daily deals, coupons, and cashback offers on every order.',
        bg: ['#1565C0', '#42A5F5'] as const,
    },
    {
        id: '3',
        icon: 'location-on' as const,
        title: 'Real-Time Order\nTracking',
        subtitle: 'Track your delivery partner live on the map and know exactly when to expect your order.',
        bg: ['#6A1B9A', '#AB47BC'] as const,
    },
];

export default function OnboardingScreen() {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useSharedValue(0);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

    const handleNext = () => {
        if (activeIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
        } else {
            router.push('/(auth)/login');
        }
    };

    const handleSkip = () => router.push('/(auth)/login');

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id}
                onScrollToIndexFailed={() => { }}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => (
                    <LinearGradient colors={item.bg} style={styles.slide}>
                        <View style={Platform.OS === 'web' ? styles.webContainer : styles.mobileContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.skipBtn,
                                    Platform.OS === 'web' && { cursor: 'pointer' } as any
                                ]}
                                onPress={handleSkip}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.skipText}>Skip</Text>
                            </TouchableOpacity>

                            <View style={styles.emojiContainer}>
                                <MaterialIcons name={item.icon} size={80} color="#fff" />
                            </View>

                            <View style={styles.textContainer}>
                                <Text style={styles.title}>{item.title}</Text>
                                <Text style={styles.subtitle}>{item.subtitle}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                )}
            />

            {/* Pagination Dots */}
            <View style={styles.bottomContainer}>
                <View style={[styles.bottomInnerContainer, Platform.OS === 'web' && styles.webContainer]}>
                    <View style={styles.dots}>
                        {slides.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    { width: activeIndex === index ? 24 : 8, opacity: activeIndex === index ? 1 : 0.4 },
                                ]}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.nextButton,
                            Platform.OS === 'web' && { cursor: 'pointer' } as any
                        ]}
                        onPress={handleNext}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#0C831F', '#34A853']}
                            style={styles.nextGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.nextText}>
                                    {activeIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                                </Text>
                                <MaterialIcons
                                    name={activeIndex === slides.length - 1 ? 'auto-awesome' : 'arrow-forward'}
                                    size={20}
                                    color="#fff"
                                />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    webContainer: {
        width: '100%',
        maxWidth: 500,
        height: '100%',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mobileContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    slide: {
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing['2xl'],
    },
    skipBtn: {
        position: 'absolute',
        top: 60,
        right: Spacing.base, // Reverted to normal right margin since it's aligned to webContainer
        padding: Spacing.sm,
    },
    skipText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.medium,
    },
    emojiContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing['3xl'],
    },
    emoji: { fontSize: 80 },
    textContainer: { alignItems: 'center' },
    title: {
        fontSize: Typography.fontSize['3xl'],
        fontFamily: Typography.fontFamily.bold,
        color: '#fff',
        textAlign: 'center',
        marginBottom: Spacing.base,
        lineHeight: Typography.fontSize['3xl'] * 1.3,
    },
    subtitle: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.regular,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: Typography.fontSize.md * 1.6,
        paddingHorizontal: Spacing.base,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing['2xl'],
        alignItems: 'center',
    },
    bottomInnerContainer: {
        width: '100%',
        alignItems: 'center',
        gap: Spacing.lg,
    },
    dots: { flexDirection: 'row', gap: Spacing.xs },
    dot: {
        height: 8,
        borderRadius: BorderRadius.full,
        backgroundColor: '#fff',
    },
    nextButton: {
        width: '100%',
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...require('@/constants/Typography').Shadows.primary,
    },
    nextGradient: {
        paddingVertical: Spacing.base,
        paddingHorizontal: Spacing['2xl'],
        alignItems: 'center',
    },
    nextText: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.semiBold,
        color: '#fff',
    },
});
