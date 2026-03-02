import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getDoc,
    doc,
    onSnapshot,
    QueryConstraint,
    Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Category } from '@/types';

// --- Products ---
export const getProducts = async (filters?: {
    categoryId?: string;
    subcategoryId?: string;
    isFeatured?: boolean;
    maxPrice?: number;
    limitCount?: number;
}): Promise<Product[]> => {
    const constraints: QueryConstraint[] = [where('isActive', '==', true)];
    if (filters?.categoryId) {
        constraints.push(where('categoryId', '==', filters.categoryId));
    }
    if (filters?.subcategoryId) {
        constraints.push(where('subcategoryId', '==', filters.subcategoryId));
    }
    if (filters?.isFeatured) {
        constraints.push(where('isFeatured', '==', true));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    if (filters?.limitCount) {
        constraints.push(limit(filters.limitCount));
    }
    const q = query(collection(db, 'products'), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Product);
};

export const getProductById = async (id: string): Promise<Product | null> => {
    const snap = await getDoc(doc(db, 'products', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Product;
};

export const searchProducts = async (searchQuery: string): Promise<Product[]> => {
    // Firestore doesn't support full-text search natively; we use prefix matching on name
    const q = query(
        collection(db, 'products'),
        where('isActive', '==', true),
        where('name', '>=', searchQuery),
        where('name', '<=', searchQuery + '\uf8ff'),
        limit(20),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Product);
};

export const subscribeToInventory = (
    productId: string,
    callback: (stock: number) => void,
): Unsubscribe => {
    return onSnapshot(doc(db, 'products', productId), snap => {
        if (snap.exists()) {
            callback(snap.data().stock as number);
        }
    });
};

// --- Categories ---
export const getCategories = async (): Promise<Category[]> => {
    const q = query(
        collection(db, 'categories'),
        where('isActive', '==', true),
        orderBy('order', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Category);
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
    const snap = await getDoc(doc(db, 'categories', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Category;
};
