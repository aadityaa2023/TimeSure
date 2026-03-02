import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    ViewToken,
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

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        emoji: '🛒',
        title: '10-Minute Grocery\nDelivery',
        subtitle: 'Get fresh fruits, vegetables, dairy & more delivered to your doorstep in minutes.',
        bg: ['#0C831F', '#34A853'] as const,
    },
    {
        id: '2',
        emoji: '🏷️',
        title: 'Best Prices &\nExclusive Offers',
        subtitle: 'Save more with daily deals, coupons, and cashback offers on every order.',
        bg: ['#1565C0', '#42A5F5'] as const,
    },
    {
        id: '3',
        emoji: '📍',
        title: 'Real-Time Order\nTracking',
        subtitle: 'Track your delivery partner live on the map and know exactly when to expect your order.',
        bg: ['#6A1B9A', '#AB47BC'] as const,
    },
];

export default function OnboardingScreen() {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useSharedValue(0);

    const onViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index ?? 0);
        }
    };

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
                viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
                renderItem={({ item }) => (
                    <LinearGradient colors={item.bg} style={styles.slide}>
                        <TouchableOpacity
                            style={styles.skipBtn}
                            onPress={handleSkip}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>

                        <View style={styles.emojiContainer}>
                            <Text style={styles.emoji}>{item.emoji}</Text>
                        </View>

                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.subtitle}>{item.subtitle}</Text>
                        </View>
                    </LinearGradient>
                )}
            />

            {/* Pagination Dots */}
            <View style={styles.bottomContainer}>
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
                    style={styles.nextButton}
                    onPress={handleNext}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={['#0C831F', '#34A853']}
                        style={styles.nextGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.nextText}>
                            {activeIndex === slides.length - 1 ? 'Get Started 🚀' : 'Next →'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
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
        right: Spacing.base,
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
