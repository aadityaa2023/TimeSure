import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useCartStore } from '@/stores/cartStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface TabIconProps {
    name: IconName;
    activeName: IconName;
    focused: boolean;
    color: string;
    size?: number;
}

function TabIcon({ name, activeName, focused, color, size = 24 }: TabIconProps) {
    return (
        <View style={focused ? styles.activeIconWrap : null}>
            <MaterialCommunityIcons
                name={focused ? activeName : name}
                size={size}
                color={focused ? '#0C831F' : '#9E9E9E'}
            />
        </View>
    );
}

export default function UserTabLayout() {
    const itemCount = useCartStore(s => s.itemCount);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#0C831F',
                tabBarInactiveTintColor: '#9E9E9E',
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon name="home-outline" activeName="home" focused={focused} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon name="magnify" activeName="magnify" focused={focused} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: 'Cart',
                    tabBarIcon: ({ focused, color }) => (
                        <View>
                            <TabIcon name="cart-outline" activeName="cart" focused={focused} color={color} />
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
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon name="package-variant" activeName="package-variant-closed" focused={focused} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon name="account-circle-outline" activeName="account-circle" focused={focused} color={color} />
                    ),
                }}
            />

            {/* Hidden tabs */}
            <Tabs.Screen
                name="checkout"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="order/[id]"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="product/[id]"
                options={{
                    href: null,
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
        paddingTop: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 12,
    },
    tabLabel: {
        fontSize: 10,
        fontFamily: 'Poppins-Medium',
        marginTop: 1,
    },
    activeIconWrap: {
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -10,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
