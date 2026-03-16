import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, Modal, ScrollView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Typography';
import { MaterialIcons } from '@expo/vector-icons';
import { getAllUsers, updateUserRole } from '@/services/users.service';
import type { User, UserRole } from '@/types';

const ROLES: UserRole[] = ['user','delivery','admin'];
const ROLE_COLORS: Record<UserRole, string> = { user: Colors.info, delivery: Colors.warning, admin: Colors.primary };
const FILTERS = ['all', ...ROLES] as const;

export default function UsersSection() {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<'all' | UserRole>('all');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<User | null>(null);
    const [roleModal, setRoleModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    const { data: users = [], isLoading } = useQuery({ queryKey: ['admin-users-section'], queryFn: () => getAllUsers(200) });

    const filtered = users.filter(u => {
        const matchFilter = filter === 'all' || u.role === filter;
        const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search) || u.email?.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const handleChangeRole = async (role: UserRole) => {
        if (!selected) return;
        setUpdating(true);
        try {
            await updateUserRole(selected.uid, role);
            queryClient.invalidateQueries({ queryKey: ['admin-users-section'] });
            setRoleModal(false); setSelected(null);
        } catch { Alert.alert('Error', 'Failed to update role.'); }
        finally { setUpdating(false); }
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.toolbar}>
                <View style={styles.searchBox}>
                    <MaterialIcons name="search" size={16} color={Colors.text.disabled} />
                    <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search users..." placeholderTextColor={Colors.text.disabled} />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {FILTERS.map(f => (
                        <TouchableOpacity key={f} style={[styles.filterTab, filter === f && { backgroundColor: Colors.primary, borderColor: Colors.primary }]} onPress={() => setFilter(f)}>
                            <Text style={[styles.filterText, filter === f && { color: '#fff' }]}>{f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? users.length : users.filter(u => u.role === f).length})</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {isLoading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} /> : (
                <FlatList
                    data={filtered}
                    keyExtractor={u => u.uid}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="group-off" size={64} color={Colors.text.disabled} /><Text style={styles.emptyText}>No users found</Text></View>}
                    renderItem={({ item: u }) => {
                        const color = ROLE_COLORS[u.role] ?? '#999';
                        const initials = (u.name ?? 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                        return (
                            <TouchableOpacity style={styles.card} onPress={() => { setSelected(u); setRoleModal(true); }}>
                                <View style={[styles.avatar, { backgroundColor: color + '20' }]}>
                                    {u.photoURL ? <Image source={{ uri: u.photoURL }} style={styles.avatar} contentFit="cover" /> : <Text style={[styles.initials, { color }]}>{initials}</Text>}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.userName}>{u.name || 'Anonymous'}</Text>
                                    <Text style={styles.userMeta}>{u.phone || u.email || '—'}</Text>
                                </View>
                                <View style={[styles.roleBadge, { backgroundColor: color + '20' }]}>
                                    <Text style={[styles.roleText, { color }]}>{u.role.toUpperCase()}</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={18} color={Colors.text.disabled} />
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            <Modal visible={roleModal} animationType="slide" transparent onRequestClose={() => setRoleModal(false)}>
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.base }}>
                        {selected && (
                            <>
                                <Text style={styles.modalTitle}>Change Role for {selected.name || 'User'}</Text>
                                {ROLES.map(role => (
                                    <TouchableOpacity key={role} style={[styles.roleOption, selected.role === role && { borderColor: ROLE_COLORS[role], backgroundColor: ROLE_COLORS[role] + '15' }]} onPress={() => selected.role !== role && handleChangeRole(role)} disabled={updating}>
                                        <Text style={[styles.roleOptionText, selected.role === role && { color: ROLE_COLORS[role], fontFamily: 'Poppins-SemiBold' }]}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
                                        {selected.role === role && <MaterialIcons name="check" size={18} color={ROLE_COLORS[role]} style={{ marginLeft: 'auto' as any }} />}
                                    </TouchableOpacity>
                                ))}
                                {updating && <ActivityIndicator color={Colors.primary} style={{ marginTop: 8 }} />}
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setRoleModal(false)}><Text style={styles.cancelText}>Close</Text></TouchableOpacity>
                            </>
                        )}
                        <View style={{ height: 20 }} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    toolbar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, flexWrap: 'wrap' },
    searchBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.background, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border, minWidth: 200 },
    searchInput: { fontSize: Typography.fontSize.sm, color: Colors.text.primary, minWidth: 120 },
    filterTab: { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
    filterText: { fontSize: Typography.fontSize.xs, fontFamily: 'Poppins-Medium', color: Colors.text.secondary },
    list: { padding: Spacing.base },
    card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.base, ...Shadows.sm },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    initials: { fontSize: 16, fontFamily: 'Poppins-Bold' },
    userName: { fontSize: Typography.fontSize.sm, fontFamily: 'Poppins-SemiBold', color: Colors.text.primary },
    userMeta: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary },
    roleBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
    roleText: { fontSize: 9, fontFamily: 'Poppins-Bold', letterSpacing: 0.5 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { color: Colors.text.secondary, fontSize: Typography.fontSize.base },
    modalTitle: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Bold', color: Colors.text.primary, marginBottom: Spacing.base },
    roleOption: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, marginBottom: Spacing.sm },
    roleOptionText: { fontSize: Typography.fontSize.base, fontFamily: 'Poppins-Medium', color: Colors.text.primary },
    cancelBtn: { backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: Spacing.base, alignItems: 'center', marginTop: Spacing.sm },
    cancelText: { color: Colors.text.secondary, fontFamily: 'Poppins-Medium' },
});
