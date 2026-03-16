import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
    ScrollView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { getAllUsers, getUserOrderCount, updateUserRole } from '@/services/users.service';
import type { User, UserRole } from '@/types';

const ROLES: UserRole[] = ['user', 'delivery', 'admin'];

const ROLE_COLORS: Record<UserRole, string> = {
    user: Colors.info,
    delivery: Colors.warning,
    admin: Colors.primary,
};

const ROLE_ICONS: Record<UserRole, React.ComponentProps<typeof MaterialIcons>['name']> = {
    user: 'person',
    delivery: 'delivery-dining',
    admin: 'admin-panel-settings',
};

type FilterRole = UserRole | 'all';

export default function AdminUsersScreen() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<FilterRole>('all');
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [roleModalVisible, setRoleModalVisible] = useState(false);
    const [updatingRole, setUpdatingRole] = useState(false);

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => getAllUsers(200),
    });

    const filtered = users.filter(u => {
        const matchesFilter = filter === 'all' || u.role === filter;
        const matchesSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search) || u.email?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleChangeRole = async (uid: string, role: UserRole) => {
        setUpdatingRole(true);
        try {
            await updateUserRole(uid, role);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setRoleModalVisible(false);
            setSelectedUser(null);
        } catch {
            Alert.alert('Error', 'Failed to update user role.');
        } finally {
            setUpdatingRole(false);
        }
    };

    const renderUser = ({ item }: { item: User }) => {
        const roleColor = ROLE_COLORS[item.role] ?? '#999';
        const roleIcon = ROLE_ICONS[item.role] ?? 'person';
        const initials = (item.name ?? 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => { setSelectedUser(item); setRoleModalVisible(true); }}
            >
                <View style={styles.avatarContainer}>
                    {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} style={styles.avatar} contentFit="cover" />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: roleColor + '22', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={[styles.initials, { color: roleColor }]}>{initials}</Text>
                        </View>
                    )}
                    <View style={[styles.roleDot, { backgroundColor: roleColor }]}>
                        <MaterialIcons name={roleIcon} size={10} color="#fff" />
                    </View>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.name || 'Anonymous'}</Text>
                    <Text style={styles.userPhone}>{item.phone || item.email || '—'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <View style={[styles.roleBadge, { backgroundColor: roleColor + '22' }]}>
                            <Text style={[styles.roleText, { color: roleColor }]}>{item.role.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.joinDate}>· Joined {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</Text>
                    </View>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.text.disabled} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Users ({filtered.length})</Text>
                <View style={{ width: 30 }} />
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
                <MaterialIcons name="search" size={20} color={Colors.text.disabled} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search name, phone, email..."
                    placeholderTextColor={Colors.text.disabled}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <MaterialIcons name="close" size={18} color={Colors.text.disabled} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: Spacing.base, gap: Spacing.sm }}>
                {(['all', ...ROLES] as FilterRole[]).map(role => (
                    <TouchableOpacity
                        key={role}
                        style={[styles.filterTab, filter === role && styles.filterTabActive]}
                        onPress={() => setFilter(role)}
                    >
                        <Text style={[styles.filterText, filter === role && styles.filterTextActive]}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                            {' '}({role === 'all' ? users.length : users.filter(u => u.role === role).length})
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={u => u.uid}
                    renderItem={renderUser}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={
                        <View style={styles.emptyCenter}>
                            <MaterialIcons name="group-off" size={64} color={Colors.text.disabled} />
                            <Text style={styles.emptyText}>No users found</Text>
                        </View>
                    }
                />
            )}

            {/* Change Role Modal */}
            <Modal visible={roleModalVisible} animationType="slide" transparent onRequestClose={() => setRoleModalVisible(false)}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
                    <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.base }}>
                        {selectedUser && (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.base, marginBottom: Spacing.base }}>
                                    <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[selectedUser.role] + '22', justifyContent: 'center', alignItems: 'center' }]}>
                                        <Text style={[styles.initials, { color: ROLE_COLORS[selectedUser.role] }]}>
                                            {(selectedUser.name ?? 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: 'Poppins-Bold', color: Colors.text.primary }}>{selectedUser.name || 'Anonymous'}</Text>
                                        <Text style={{ fontSize: Typography.fontSize.sm, color: Colors.text.secondary }}>{selectedUser.phone || selectedUser.email}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.formLabel, { marginBottom: Spacing.sm }]}>Change Role</Text>
                                {ROLES.map(role => (
                                    <TouchableOpacity
                                        key={role}
                                        style={[styles.roleOption, selectedUser.role === role && { backgroundColor: ROLE_COLORS[role] + '15', borderColor: ROLE_COLORS[role] }]}
                                        onPress={() => {
                                            if (role === selectedUser.role) return;
                                            if (Platform.OS === 'web') {
                                                if (window.confirm(`Change ${selectedUser.name}'s role to ${role}?`)) handleChangeRole(selectedUser.uid, role);
                                            } else {
                                                Alert.alert('Change Role', `Change ${selectedUser.name}'s role to "${role}"?`, [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    { text: 'Confirm', onPress: () => handleChangeRole(selectedUser.uid, role) },
                                                ]);
                                            }
                                        }}
                                        disabled={updatingRole}
                                    >
                                        <MaterialIcons name={ROLE_ICONS[role]} size={20} color={ROLE_COLORS[role]} />
                                        <Text style={[styles.roleOptionText, selectedUser.role === role && { color: ROLE_COLORS[role], fontFamily: 'Poppins-Bold' }]}>
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </Text>
                                        {selectedUser.role === role && <MaterialIcons name="check" size={18} color={ROLE_COLORS[role]} style={{ marginLeft: 'auto' }} />}
                                    </TouchableOpacity>
                                ))}
                                {updatingRole && <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.sm }} />}
                                <TouchableOpacity style={[styles.cancelBtn, { marginTop: Spacing.base }]} onPress={() => setRoleModalVisible(false)}>
                                    <Text style={styles.cancelBtnText}>Close</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        <View style={{ height: 20 }} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Poppins-Bold', color: Colors.text.primary },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
    searchInput: { flex: 1, fontSize: Typography.fontSize.base, color: Colors.text.primary, fontFamily: 'Poppins-Regular' },
    filterRow: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.sm, flexGrow: 0 },
    filterTab: { paddingHorizontal: Spacing.base, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.background },
    filterTabActive: { backgroundColor: Colors.primary },
    filterText: { fontSize: Typography.fontSize.sm, color: Colors.text.secondary, fontFamily: 'Poppins-Medium' },
    filterTextActive: { color: '#fff' },
    list: { padding: Spacing.base },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, gap: Spacing.base, ...Shadows.sm },
    avatarContainer: { position: 'relative' },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    roleDot: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.surface },
    initials: { fontSize: 16, fontFamily: 'Poppins-Bold' },
    userName: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    userPhone: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, marginTop: 1 },
    roleBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
    roleText: { fontSize: 9, fontFamily: 'Poppins-Bold', letterSpacing: 0.5 },
    joinDate: { fontSize: Typography.fontSize.xs, color: Colors.text.disabled },
    emptyCenter: { alignItems: 'center', paddingTop: 80, gap: Spacing.base },
    emptyText: { fontSize: Typography.fontSize.base, color: Colors.text.secondary },
    formLabel: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-SemiBold', color: Colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    roleOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, padding: Spacing.base, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, marginBottom: Spacing.sm },
    roleOptionText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Medium', color: Colors.text.primary },
    cancelBtn: { backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: Spacing.base, alignItems: 'center' },
    cancelBtnText: { fontSize: Typography.fontSize.base, color: Colors.text.secondary, fontFamily: 'Poppins-Medium' },
});
