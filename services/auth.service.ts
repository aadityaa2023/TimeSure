import {
    signInWithPhoneNumber,
    signOut,
    onAuthStateChanged,
    updateProfile,
    User as FirebaseUser,
    ApplicationVerifier,
    ConfirmationResult,
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, UserRole } from '@/types';

// --- Phone Auth ---
export const sendOTP = async (
    phoneNumber: string,
    appVerifier: ApplicationVerifier,
): Promise<ConfirmationResult> => {
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
};

export const verifyOTP = async (
    confirmationResult: ConfirmationResult,
    otp: string,
): Promise<FirebaseUser> => {
    const result = await confirmationResult.confirm(otp);
    return result.user;
};

// --- User Profile ---
export const createUserProfile = async (
    uid: string,
    data: Partial<User>,
): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await setDoc(
        userRef,
        {
            ...data,
            uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        },
        { merge: true },
    );
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return snap.data() as User;
};

export const updateUserProfile = async (
    uid: string,
    data: Partial<User>,
): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role, updatedAt: serverTimestamp() });
};

// --- Sign Out ---
export const signOutUser = async (): Promise<void> => {
    await signOut(auth);
};

// --- Auth State Observer ---
export const subscribeToAuthState = (
    callback: (user: FirebaseUser | null) => void,
) => {
    return onAuthStateChanged(auth, callback);
};
