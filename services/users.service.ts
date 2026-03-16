import {
    collection,
    doc,
    getDocs,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

// Get users by role
export const getUsersByRole = async (role: UserRole, limitCount = 50): Promise<User[]> => {
    const q = query(
        collection(db, 'users'),
        where('role', '==', role),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }) as User);
};

// Get all users (admin only)
export const getAllUsers = async (limitCount = 100): Promise<User[]> => {
    const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }) as User);
};

// Get user by ID
export const getUserById = async (uid: string): Promise<User | null> => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { uid: snap.id, ...snap.data() } as User;
};

// Update user role
export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
    await updateDoc(doc(db, 'users', uid), { role });
};

// Get user order count
export const getUserOrderCount = async (uid: string): Promise<number> => {
    const snap = await getCountFromServer(
        query(collection(db, 'orders'), where('userId', '==', uid))
    );
    return snap.data().count;
};

// Get counts per role
export const getUserCounts = async (): Promise<{ users: number; delivery: number; admins: number }> => {
    const [users, delivery, admins] = await Promise.all([
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'user'))),
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'delivery'))),
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'admin'))),
    ]);
    return {
        users: users.data().count,
        delivery: delivery.data().count,
        admins: admins.data().count,
    };
};
