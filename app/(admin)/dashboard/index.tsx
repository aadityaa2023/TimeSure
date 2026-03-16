import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { signOutUser } from '@/services/auth.service';

// Section components — using @/ alias for reliable module resolution
import DashboardOverview from '@/app/(admin)/dashboard/sections/DashboardOverview';
import ProductsSection from '@/app/(admin)/dashboard/sections/ProductsSection';
import CategoriesSection from '@/app/(admin)/dashboard/sections/CategoriesSection';
import OrdersSection from '@/app/(admin)/dashboard/sections/OrdersSection';
import UsersSection from '@/app/(admin)/dashboard/sections/UsersSection';
import CouponsSection from '@/app/(admin)/dashboard/sections/CouponsSection';
import DeliverySection from '@/app/(admin)/dashboard/sections/DeliverySection';
import BannersSection from '@/app/(admin)/dashboard/sections/BannersSection';
import NotificationsSection from '@/app/(admin)/dashboard/sections/NotificationsSection';
import AnalyticsSection from '@/app/(admin)/dashboard/sections/AnalyticsSection';

type SectionId = 'overview' | 'products' | 'categories' | 'orders' | 'users' | 'coupons' | 'delivery' | 'banners' | 'notifications' | 'analytics';

interface NavItem {
    id: SectionId;
    label: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    color: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'overview',       label: 'Dashboard',     icon: 'view-dashboard',         color: '#1A237E' },
    { id: 'products',       label: 'Products',      icon: 'package-variant-closed', color: '#0C831F' },
    { id: 'categories',     label: 'Categories',    icon: 'shape',                  color: '#1565C0' },
    { id: 'orders',         label: 'Orders',        icon: 'clipboard-list',         color: '#7B1FA2' },
    { id: 'users',          label: 'Users',         icon: 'account-group',          color: '#00695C' },
    { id: 'coupons',        label: 'Coupons',       icon: 'ticket-percent',         color: '#AD1457' },
    { id: 'delivery',       label: 'Delivery',      icon: 'moped',                  color: '#E65100' },
    { id: 'banners',        label: 'Banners',       icon: 'image-multiple',         color: '#4527A0' },
    { id: 'notifications',  label: 'Notify',        icon: 'bell-ring',              color: '#BF360C' },
    { id: 'analytics',      label: 'Analytics',     icon: 'chart-bar',              color: '#1A237E' },
];

const SECTION_COMPONENTS: Record<SectionId, React.ComponentType<any>> = {
    overview:       DashboardOverview,
    products:       ProductsSection,
    categories:     CategoriesSection,
    orders:         OrdersSection,
    users:          UsersSection,
    coupons:        CouponsSection,
    delivery:       DeliverySection,
    banners:        BannersSection,
    notifications:  NotificationsSection,
    analytics:      AnalyticsSection,
};

export default function AdminDashboardPage() {
    const [activeSection, setActiveSection] = useState<SectionId>('overview');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { logout } = useAuthStore();

    const handleLogout = async () => {
        if (Platform.OS === 'web' && !window.confirm('Logout from Admin Panel?')) return;
        await signOutUser();
        logout();
        router.replace('/(auth)');
    };

    const ActiveComponent = SECTION_COMPONENTS[activeSection];
    const activeNav = NAV_ITEMS.find(n => n.id === activeSection)!;

    return (
        <View style={styles.root}>
            {/* Sidebar */}
            <View style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
                {/* Logo */}
                <LinearGradient colors={['#1A237E', '#283593']} style={styles.sidebarHeader}>
                    <LinearGradient colors={['#0C831F', '#34A853']} style={styles.logoCircle}>
                        <MaterialIcons name="flash-on" size={20} color="#fff" />
                    </LinearGradient>
                    {!sidebarCollapsed && (
                        <View style={{ flex: 1 }}>
                            <Text style={styles.logoText}>TimeSure</Text>
                            <Text style={styles.logoSub}>Admin Panel</Text>
                        </View>
                    )}
                    <TouchableOpacity onPress={() => setSidebarCollapsed(v => !v)} style={styles.collapseBtn}>
                        <MaterialIcons
                            name={sidebarCollapsed ? 'chevron-right' : 'chevron-left'}
                            size={20}
                            color="rgba(255,255,255,0.7)"
                        />
                    </TouchableOpacity>
                </LinearGradient>

                {/* Nav Items */}
                <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
                    {NAV_ITEMS.map(item => {
                        const active = activeSection === item.id;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.navItem, active && styles.navItemActive]}
                                onPress={() => setActiveSection(item.id)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.navIcon, active && { backgroundColor: item.color + '25' }]}>
                                    <MaterialCommunityIcons
                                        name={item.icon}
                                        size={20}
                                        color={active ? item.color : Colors.text.secondary}
                                    />
                                </View>
                                {!sidebarCollapsed && (
                                    <Text style={[styles.navLabel, active && { color: item.color, fontFamily: 'Poppins-SemiBold' }]}>
                                        {item.label}
                                    </Text>
                                )}
                                {active && !sidebarCollapsed && (
                                    <View style={[styles.activeBar, { backgroundColor: item.color }]} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <MaterialIcons name="logout" size={20} color={Colors.error} />
                    {!sidebarCollapsed && <Text style={styles.logoutText}>Logout</Text>}
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.main}>
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <View style={styles.topBarLeft}>
                        <View style={[styles.sectionIconBadge, { backgroundColor: activeNav.color + '20' }]}>
                            <MaterialCommunityIcons name={activeNav.icon} size={18} color={activeNav.color} />
                        </View>
                        <Text style={styles.pageTitle}>{activeNav.label}</Text>
                    </View>
                    <Text style={styles.topBarTime}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                </View>

                {/* Section Content */}
                <View style={styles.contentArea}>
                    <ActiveComponent />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, flexDirection: 'row', backgroundColor: Colors.background },
    sidebar: { width: 220, backgroundColor: Colors.surface, borderRightWidth: 1, borderRightColor: Colors.border },
    sidebarCollapsed: { width: 64 },
    sidebarHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.sm },
    logoCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    logoText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: '#fff' },
    logoSub: { fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.6)' },
    collapseBtn: { padding: 4 },
    navList: { flex: 1, paddingTop: Spacing.sm },
    navItem: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
        paddingHorizontal: Spacing.base, gap: Spacing.sm, position: 'relative',
    },
    navItemActive: { backgroundColor: Colors.background },
    navIcon: { width: 32, height: 32, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
    navLabel: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.text.secondary },
    activeBar: { position: 'absolute', right: 0, top: 8, bottom: 8, width: 3, borderRadius: 2 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
    logoutText: { fontSize: Typography.fontSize.sm, color: Colors.error, fontFamily: 'Poppins-Medium' },
    main: { flex: 1 },
    topBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.base, paddingVertical: Spacing.base,
        backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    sectionIconBadge: { width: 32, height: 32, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
    pageTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    topBarTime: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary, fontFamily: 'Poppins-Regular' },
    contentArea: { flex: 1 },
});
