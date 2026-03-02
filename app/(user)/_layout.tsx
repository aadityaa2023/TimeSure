import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useCartStore } from '@/stores/cartStore';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
    return (
        <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
    );
}

export default function UserTabLayout() {
    const itemCount = useCartStore(s => s.itemCount);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.text.disabled,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: 'Cart',
                    tabBarIcon: ({ focused }) => (
                        <View>
                            <TabIcon emoji="🛒" focused={focused} />
                            {itemCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Orders',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
        height: 64,
        paddingBottom: 8,
        paddingTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 10,
    },
    tabLabel: {
        fontSize: 10,
        fontFamily: 'Poppins-Medium',
        marginTop: 2,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: Colors.accent,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
