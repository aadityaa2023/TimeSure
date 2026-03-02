import { Stack } from 'expo-router';

export default function AdminLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="products/index" />
            <Stack.Screen name="products/[id]" />
            <Stack.Screen name="orders/index" />
            <Stack.Screen name="orders/[id]" />
            <Stack.Screen name="categories/index" />
            <Stack.Screen name="analytics" />
            <Stack.Screen name="coupons/index" />
            <Stack.Screen name="users" />
        </Stack>
    );
}
