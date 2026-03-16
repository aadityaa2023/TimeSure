import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Coupon } from '@/types';

// Get all coupons (admin)
export const getAllCoupons = async (): Promise<Coupon[]> => {
    const q = query(collection(db, 'coupons'), orderBy('expiresAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ code: d.id, ...d.data() }) as Coupon);
};

// Get coupon by code
export const getCouponByCode = async (code: string): Promise<Coupon | null> => {
    const snap = await getDoc(doc(db, 'coupons', code.toUpperCase()));
    if (!snap.exists()) return null;
    return { code: snap.id, ...snap.data() } as Coupon;
};

// Validate coupon for user order
export const validateCoupon = async (code: string, orderValue: number): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> => {
    const coupon = await getCouponByCode(code);
    if (!coupon) return { valid: false, error: 'Invalid coupon code' };
    if (!coupon.isActive) return { valid: false, error: 'This coupon is no longer active' };
    if (new Date(coupon.expiresAt) < new Date()) return { valid: false, error: 'This coupon has expired' };
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return { valid: false, error: 'This coupon has reached its usage limit' };
    if (orderValue < coupon.minOrderValue) return { valid: false, error: `Minimum order value of ₹${coupon.minOrderValue} required` };
    return { valid: true, coupon };
};

// Calculate coupon discount
export const calculateDiscount = (coupon: Coupon, orderValue: number): number => {
    let discount = 0;
    if (coupon.discountType === 'percentage') {
        discount = (orderValue * coupon.discountValue) / 100;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
        discount = coupon.discountValue;
    }
    return Math.round(discount);
};

// Create coupon
export const createCoupon = async (data: Omit<Coupon, 'usedCount'>): Promise<void> => {
    const id = data.code.toUpperCase().trim();
    await addDoc(collection(db, 'coupons'), {
        ...data,
        code: id,
        usedCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    // Also set the doc with the coupon code as ID for easy lookup
    await updateDoc(doc(db, 'coupons', id), {});
};

// Create coupon with code as document ID
export const createCouponWithId = async (data: Omit<Coupon, 'usedCount'>): Promise<void> => {
    const id = data.code.toUpperCase().trim();
    const { code, ...rest } = data;
    await addDoc(collection(db, 'coupons'), {
        code: id,
        ...rest,
        usedCount: 0,
    });
};

// Update coupon
export const updateCoupon = async (code: string, data: Partial<Coupon>): Promise<void> => {
    // Find the doc with code field matching
    const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Coupon not found');
    await updateDoc(snap.docs[0].ref, { ...data, updatedAt: serverTimestamp() });
};

// Delete coupon
export const deleteCoupon = async (docId: string): Promise<void> => {
    await deleteDoc(doc(db, 'coupons', docId));
};

// Toggle coupon active
export const toggleCouponActive = async (docId: string, isActive: boolean): Promise<void> => {
    await updateDoc(doc(db, 'coupons', docId), { isActive, updatedAt: serverTimestamp() });
};

// Increment coupon used count (called after successful order)
export const incrementCouponUsage = async (code: string): Promise<void> => {
    const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
        const current = snap.docs[0].data().usedCount ?? 0;
        await updateDoc(snap.docs[0].ref, { usedCount: current + 1 });
    }
};
