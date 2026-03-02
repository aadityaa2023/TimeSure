import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '@/types';

interface AuthState {
    user: User | null;
    role: UserRole | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    setRole: (role: UserRole) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        set => ({
            user: null,
            role: null,
            isLoading: true,
            isAuthenticated: false,

            setUser: user =>
                set({
                    user,
                    isAuthenticated: !!user,
                    role: user?.role ?? null,
                    isLoading: false,
                }),

            setRole: role => set(state => ({ role, user: state.user ? { ...state.user, role } : null })),

            setLoading: loading => set({ isLoading: loading }),

            logout: () =>
                set({
                    user: null,
                    role: null,
                    isAuthenticated: false,
                    isLoading: false,
                }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: state => ({ user: state.user, role: state.role }),
        },
    ),
);
