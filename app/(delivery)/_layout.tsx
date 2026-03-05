import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabIcon({ name, activeName, focused }: { name: IconName; activeName: IconName; focused: boolean }) {
    return (
        <View style={focused ? styles.activeIconWrap : null}>
            <MaterialCommunityIcons
                name={focused ? activeName : name}
                size={24}
                color={focused ? '#6A1B9A' : '#9E9E9E'}
            />
        </View>
    );
}

export default function DeliveryTabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: '#6A1B9A',
                tabBarInactiveTintColor: '#9E9E9E',
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="view-dashboard-outline" activeName="view-dashboard" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Orders',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="map-marker-path" activeName="map-marker-path" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    title: 'Earnings',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="cash-multiple" activeName="cash-multiple" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon name="account-circle-outline" activeName="account-circle" focused={focused} />
                    ),
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
        backgroundColor: '#F3E5F5',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
});

