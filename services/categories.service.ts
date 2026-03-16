import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category, Subcategory } from '@/types';

// Get all categories (including inactive for admin)
export const getAllCategories = async (): Promise<Category[]> => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Category);
};

// Get single category
export const getCategoryByIdAdmin = async (id: string): Promise<Category | null> => {
    const snap = await getDoc(doc(db, 'categories', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Category;
};

// Create new category
export const createCategory = async (data: Omit<Category, 'id'>): Promise<string> => {
    const ref = await addDoc(collection(db, 'categories'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
};

// Update category
export const updateCategory = async (id: string, data: Partial<Omit<Category, 'id'>>): Promise<void> => {
    await updateDoc(doc(db, 'categories', id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
};

// Delete category
export const deleteCategory = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'categories', id));
};

// Toggle category active status
export const toggleCategoryActive = async (id: string, isActive: boolean): Promise<void> => {
    await updateDoc(doc(db, 'categories', id), { isActive, updatedAt: serverTimestamp() });
};

// Add subcategory to category
export const addSubcategory = async (categoryId: string, subcategory: Subcategory, currentSubs: Subcategory[]): Promise<void> => {
    await updateDoc(doc(db, 'categories', categoryId), {
        subcategories: [...currentSubs, subcategory],
        updatedAt: serverTimestamp(),
    });
};

// Remove subcategory from category
export const removeSubcategory = async (categoryId: string, subcategoryId: string, currentSubs: Subcategory[]): Promise<void> => {
    await updateDoc(doc(db, 'categories', categoryId), {
        subcategories: currentSubs.filter(s => s.id !== subcategoryId),
        updatedAt: serverTimestamp(),
    });
};
