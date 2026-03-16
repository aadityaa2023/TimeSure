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
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DeliveryPartner } from '@/types';

// Get all delivery partners
export const getAllDeliveryPartners = async (): Promise<DeliveryPartner[]> => {
    const q = query(
        collection(db, 'users'),
        where('role', '==', 'delivery'),
        orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }) as DeliveryPartner);
};

// Get online delivery partners
export const getOnlineDeliveryPartners = async (): Promise<DeliveryPartner[]> => {
    const q = query(
        collection(db, 'users'),
        where('role', '==', 'delivery'),
        where('isOnline', '==', true),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }) as DeliveryPartner);
};

// Get partner by ID
export const getDeliveryPartnerById = async (uid: string): Promise<DeliveryPartner | null> => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { uid: snap.id, ...snap.data() } as DeliveryPartner;
};

// Update delivery partner fields
export const updateDeliveryPartner = async (uid: string, data: Partial<DeliveryPartner>): Promise<void> => {
    const { uid: _, ...rest } = data;
    await updateDoc(doc(db, 'users', uid), {
        ...rest,
        updatedAt: serverTimestamp(),
    });
};

// Toggle online status (admin override)
export const togglePartnerOnline = async (uid: string, isOnline: boolean): Promise<void> => {
    await updateDoc(doc(db, 'users', uid), { isOnline, updatedAt: serverTimestamp() });
};

// Get all orders for a delivery partner
export const getPartnerOrders = async (uid: string): Promise<any[]> => {
    const q = query(
        collection(db, 'orders'),
        where('deliveryPartnerId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(50),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
