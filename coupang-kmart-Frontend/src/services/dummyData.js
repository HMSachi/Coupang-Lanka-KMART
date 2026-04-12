/**
 * Dummy Data for Coupang Kmart POS
 * This file acts as a centralized data repository to decouple UI from hardcoded data.
 * Exporting these objects makes it easy to replace them with API calls later.
 */

export const DUMMY_USERS = {
    'admin@g.com': {
        id: 'u1',
        name: 'Admin User',
        password: '1234ab',
        role: 'superAdmin',
        branch: 'Headquarters'
    },
    'cashier@g.com': {
        id: 'u2',
        name: 'Lead Cashier',
        password: '1234ab',
        role: 'cashier',
        branch: 'Colombo Central'
    }
};

export const CATEGORIES = ['All', 'Face', 'Eyes', 'Lips', 'Skincare', 'Fragrances'];

export const DUMMY_PRODUCTS = [
    { id: 1, name: 'MAC Studio Fix Foundation', price: 9500, category: 'Face', stock: 24, image: '🎨' },
    { id: 2, name: 'Maybelline Fit Me Concealer', price: 2450, category: 'Face', stock: 18, image: '🖌️' },
    { id: 3, name: 'Fenty Beauty Gloss Bomb', price: 6800, category: 'Lips', stock: 45, image: '💄' },
    { id: 4, name: 'Huda Beauty Nude Palette', price: 18500, category: 'Eyes', stock: 12, image: '👁️' },
    { id: 5, name: 'Clinique Moisture Surge', price: 11500, category: 'Skincare', stock: 30, image: '🧴' },
    { id: 6, name: 'Dior Sauvage 100ml', price: 34500, category: 'Fragrances', stock: 50, image: '💨' },
    { id: 7, name: "L'Oreal Paris Mascara", price: 3200, category: 'Eyes', stock: 28, image: '👁️‍🗨️' },
    { id: 8, name: 'Chanel No 5 Parfum', price: 42000, category: 'Fragrances', stock: 15, image: '✨' },
    { id: 9, name: 'Anastasia Brow Wiz', price: 5400, category: 'Eyes', stock: 40, image: '✏️' },
    { id: 10, name: 'NARS Blush Orgasm', price: 8200, category: 'Face', stock: 60, image: '🌸' },
];

export const DUMMY_SHIFT_REPORT = {
    cashSales: 45200,
    cardSales: 128400,
    totalCollected: 173600,
    openingBalance: 5000,
    transactionsCount: 42,
    syncStatus: 'synced',
    pendingAlerts: 2
};

export const DUMMY_REFUND_HISTORY = [
    { id: 'TRX-9482', date: '2026-04-12', amount: 3200, status: 'Completed', item: "L'Oreal Mascara" },
    { id: 'TRX-9510', date: '2026-04-12', amount: 9500, status: 'Pending', item: "MAC Foundation" },
];

/* Admin Dashboard Data */
export const DUMMY_TRANSACTIONS = [
    { id: 'TRX-1092', cashier: 'Sara K.', amount: 'LKR 12,500', method: 'Credit Card', time: '10:42 AM', status: 'completed' },
    { id: 'TRX-1093', cashier: 'John D.', amount: 'LKR 4,200', method: 'Cash', time: '10:45 AM', status: 'completed' },
    { id: 'TRX-1094', cashier: 'Sara K.', amount: 'LKR 8,900', method: 'Debit Card', time: '10:55 AM', status: 'completed' },
    { id: 'TRX-1095', cashier: 'Amila W.', amount: 'LKR 11,500', method: 'Cash', time: '11:02 AM', status: 'completed' },
    { id: 'TRX-1096', cashier: 'Amila W.', amount: 'LKR 22,000', method: 'Credit Card', time: '11:15 AM', status: 'completed' },
];

export const DUMMY_SALES_DATA = [
    { name: 'Mon', sales: 45000 },
    { name: 'Tue', sales: 32000 },
    { name: 'Wed', sales: 58000 },
    { name: 'Thu', sales: 41000 },
    { name: 'Fri', sales: 85000 },
    { name: 'Sat', sales: 124000 },
    { name: 'Sun', sales: 98000 },
];
