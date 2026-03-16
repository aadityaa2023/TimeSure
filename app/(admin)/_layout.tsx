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
            <Stack.Screen name="coupons/index" />
            <Stack.Screen name="users" />
            <Stack.Screen name="analytics" />
            <Stack.Screen name="delivery-partners/index" />
            <Stack.Screen name="notifications/index" />
            <Stack.Screen name="banners/index" />
            <Stack.Screen name="dashboard/index" />
            <Stack.Screen name="dashboard/sections/DashboardOverview" />
            <Stack.Screen name="dashboard/sections/ProductsSection" />
            <Stack.Screen name="dashboard/sections/CategoriesSection" />
            <Stack.Screen name="dashboard/sections/OrdersSection" />
            <Stack.Screen name="dashboard/sections/UsersSection" />
            <Stack.Screen name="dashboard/sections/CouponsSection" />
            <Stack.Screen name="dashboard/sections/DeliverySection" />
            <Stack.Screen name="dashboard/sections/BannersSection" />
            <Stack.Screen name="dashboard/sections/NotificationsSection" />
            <Stack.Screen name="dashboard/sections/AnalyticsSection" />
        </Stack>
    );
}
