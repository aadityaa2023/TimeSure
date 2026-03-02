import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function DeliveryTabLayout() {
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
                options={{ title: 'Dashboard', tabBarIcon: ({ focused }) => null }}
            />
            <Tabs.Screen
                name="orders"
                options={{ title: 'Orders', tabBarIcon: ({ focused }) => null }}
            />
            <Tabs.Screen
                name="earnings"
                options={{ title: 'Earnings', tabBarIcon: ({ focused }) => null }}
            />
            <Tabs.Screen
                name="profile"
                options={{ title: 'Profile', tabBarIcon: ({ focused }) => null }}
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
    },
    tabLabel: { fontSize: 10, fontFamily: 'Poppins-Medium' },
});
