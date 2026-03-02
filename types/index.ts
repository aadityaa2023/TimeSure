// User roles
export type UserRole = 'user' | 'delivery' | 'admin';

// Auth
export interface User {
    uid: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    photoURL?: string;
    addresses: Address[];
    fcmToken?: string;
    createdAt: string;
}

// Address
export interface Address {
    id: string;
    label: string; // 'Home' | 'Work' | 'Other'
    fullAddress: string;
    landmark?: string;
    lat: number;
    lng: number;
    isDefault: boolean;
}

// Product
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    mrp: number;
    imageUrl: string;
    images?: string[];
    categoryId: string;
    subcategoryId?: string;
    brand: string;
    unit: string; // '500g' | '1 kg' | '1 L' etc.
    stock: number;
    isActive: boolean;
    isFeatured?: boolean;
    tags?: string[];
    nutritionInfo?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

// Category
export interface Category {
    id: string;
    name: string;
    imageUrl: string;
    subcategories: Subcategory[];
    order: number;
    isActive: boolean;
}

export interface Subcategory {
    id: string;
    name: string;
    imageUrl?: string;
}

// Cart
export interface CartItem {
    product: Product;
    quantity: number;
}

// Order
export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'packed'
    | 'picked_up'
    | 'on_the_way'
    | 'delivered'
    | 'cancelled';

export interface OrderItem {
    productId: string;
    name: string;
    imageUrl: string;
    price: number;
    quantity: number;
    unit: string;
}

export interface TimelineEvent {
    status: OrderStatus;
    timestamp: string;
    note?: string;
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    status: OrderStatus;
    deliveryAddress: Address;
    deliveryPartnerId?: string;
    deliveryPartnerName?: string;
    deliverySlot: DeliverySlot;
    couponCode?: string;
    couponDiscount: number;
    subtotal: number;
    deliveryFee: number;
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: 'pending' | 'paid' | 'refunded';
    timeline: TimelineEvent[];
    otp: string;
    estimatedDelivery?: string;
    createdAt: string;
    updatedAt: string;
}

// Payment
export type PaymentMethod = 'cod' | 'upi' | 'card' | 'wallet';

// Delivery Slot
export interface DeliverySlot {
    id: string;
    label: string;
    startTime: string; // '10:00 AM'
    endTime: string;   // '12:00 PM'
    date: string;      // 'YYYY-MM-DD'
    slotsLeft: number;
}

// Delivery Partner
export interface DeliveryPartner {
    uid: string;
    name: string;
    phone: string;
    photoURL?: string;
    isOnline: boolean;
    currentLocation?: { lat: number; lng: number };
    rating: number;
    totalDeliveries: number;
    earnings: DeliveryEarnings;
    fcmToken?: string;
    vehicleType: 'bike' | 'scooter' | 'cycle';
    vehicleNumber: string;
}

export interface DeliveryEarnings {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
}

// Coupon
export interface Coupon {
    code: string;
    description: string;
    discountType: 'percentage' | 'flat';
    discountValue: number;
    minOrderValue: number;
    maxDiscount?: number;
    expiresAt: string;
    isActive: boolean;
    usageLimit: number;
    usedCount: number;
}

// Wallet
export interface WalletTransaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    orderId?: string;
    timestamp: string;
}

export interface Wallet {
    userId: string;
    balance: number;
    transactions: WalletTransaction[];
}

// Banner
export interface Banner {
    id: string;
    imageUrl: string;
    targetScreen?: string;
    targetId?: string;
    order: number;
    isActive: boolean;
}

// Notification
export interface AppNotification {
    id: string;
    title: string;
    body: string;
    type: 'order' | 'promo' | 'system';
    orderId?: string;
    isRead: boolean;
    createdAt: string;
}
