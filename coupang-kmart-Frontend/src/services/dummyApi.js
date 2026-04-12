import {
    DUMMY_PRODUCTS,
    CATEGORIES,
    DUMMY_SHIFT_REPORT,
    DUMMY_REPORTS,
    DUMMY_NOTIFICATIONS,
    DUMMY_SETTINGS,
    DUMMY_ROLES
} from './dummyData';

/**
 * Dummy API Service
 * Simulate network latency and async data fetching.
 */

const delay = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
    // Products
    getProducts: async () => {
        await delay();
        return DUMMY_PRODUCTS;
    },

    // Categories
    getCategories: async () => {
        await delay(300);
        return CATEGORIES;
    },

    // Reports
    getReports: async () => {
        await delay(900);
        return DUMMY_REPORTS;
    },

    // Notifications
    getNotifications: async () => {
        await delay(400);
        return DUMMY_NOTIFICATIONS;
    },

    // Settings
    getSettings: async () => {
        await delay(500);
        return DUMMY_SETTINGS;
    },

    // Roles
    getRoles: async () => {
        await delay(600);
        return DUMMY_ROLES;
    },

    // Shift/EOD
    getShiftReport: async () => {
        await delay(1000);
        return DUMMY_SHIFT_REPORT;
    },

    // Dashboard Stats
    getDashboardStats: async () => {
        await delay(600);
        const lowStockCount = DUMMY_PRODUCTS.filter(p => p.stock < 20).length;
        return {
            totalSales: 'LKR 1,240,800',
            salesTrend: '+18.5%',
            totalOrders: 342,
            orderTrend: '+5.2%',
            productsCount: 840,
            lowStockAlerts: lowStockCount
        };
    },

    // Authentication (Simulated)
    login: async (email, password) => {
        await delay(1200);
        return { success: true, user: { email, role: 'superAdmin' } };
    }
};
