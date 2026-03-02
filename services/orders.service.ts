import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Unsubscribe,
    arrayUnion,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, OrderItem, Address, DeliverySlot, PaymentMethod } from '@/types';

export interface CreateOrderPayload {
    userId: string;
    items: OrderItem[];
    deliveryAddress: Address;
    deliverySlot: DeliverySlot;
    couponCode?: string;
    couponDiscount: number;
    subtotal: number;
    deliveryFee: number;
    total: number;
    paymentMethod: PaymentMethod;
}

// Generate random 4-digit OTP
const generateOTP = () =>
    Math.floor(1000 + Math.random() * 9000).toString();

export const createOrder = async (payload: CreateOrderPayload): Promise<string> => {
    const orderData = {
        ...payload,
        status: 'pending' as OrderStatus,
        paymentStatus: 'pending',
        otp: generateOTP(),
        timeline: [
            {
                status: 'pending',
                timestamp: new Date().toISOString(),
                note: 'Order placed successfully',
            },
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'orders'), orderData);
    return docRef.id;
};

export const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    note?: string,
): Promise<void> => {
    const timelineEvent = {
        status,
        timestamp: new Date().toISOString(),
        note: note ?? '',
    };
    await updateDoc(doc(db, 'orders', orderId), {
        status,
        timeline: arrayUnion(timelineEvent),
        updatedAt: serverTimestamp(),
    });
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Order;
};

export const getUserOrders = async (
    userId: string,
    limitCount = 20,
): Promise<Order[]> => {
    const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order);
};

export const subscribeToOrder = (
    orderId: string,
    callback: (order: Order) => void,
): Unsubscribe => {
    return onSnapshot(doc(db, 'orders', orderId), snap => {
        if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() } as Order);
        }
    });
};

export const subscribeToDeliveryOrders = (
    deliveryPartnerId: string,
    callback: (orders: Order[]) => void,
): Unsubscribe => {
    const q = query(
        collection(db, 'orders'),
        where('deliveryPartnerId', '==', deliveryPartnerId),
        where('status', 'in', ['confirmed', 'packed', 'picked_up', 'on_the_way']),
        orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order));
    });
};

export const assignDeliveryPartner = async (
    orderId: string,
    deliveryPartnerId: string,
    deliveryPartnerName: string,
): Promise<void> => {
    await updateDoc(doc(db, 'orders', orderId), {
        deliveryPartnerId,
        deliveryPartnerName,
        status: 'confirmed',
        updatedAt: serverTimestamp(),
    });
};

export const getPendingOrders = async (): Promise<Order[]> => {
    const q = query(
        collection(db, 'orders'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Order);
};
