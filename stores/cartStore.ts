import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '@/types';

interface CartState {
    items: CartItem[];
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;
    subtotal: number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            itemCount: 0,
            subtotal: 0,

            addItem: product => {
                const current = get().items;
                const existing = current.find(i => i.product.id === product.id);
                let updated: CartItem[];
                if (existing) {
                    updated = current.map(i =>
                        i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
                    );
                } else {
                    updated = [...current, { product, quantity: 1 }];
                }
                const itemCount = updated.reduce((sum, i) => sum + i.quantity, 0);
                const subtotal = updated.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
                set({ items: updated, itemCount, subtotal });
            },

            removeItem: productId => {
                const updated = get().items.filter(i => i.product.id !== productId);
                const itemCount = updated.reduce((sum, i) => sum + i.quantity, 0);
                const subtotal = updated.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
                set({ items: updated, itemCount, subtotal });
            },

            updateQuantity: (productId, quantity) => {
                let updated: CartItem[];
                if (quantity <= 0) {
                    updated = get().items.filter(i => i.product.id !== productId);
                } else {
                    updated = get().items.map(i =>
                        i.product.id === productId ? { ...i, quantity } : i,
                    );
                }
                const itemCount = updated.reduce((sum, i) => sum + i.quantity, 0);
                const subtotal = updated.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
                set({ items: updated, itemCount, subtotal });
            },

            clearCart: () => set({ items: [], itemCount: 0, subtotal: 0 }),
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: state => ({ items: state.items }),
            onRehydrateStorage: () => state => {
                if (state) {
                    state.itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
                    state.subtotal = state.items.reduce(
                        (sum, i) => sum + i.product.price * i.quantity,
                        0,
                    );
                }
            },
        },
    ),
);
