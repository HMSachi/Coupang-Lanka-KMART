import { DUMMY_PRODUCTS, CATEGORIES, DUMMY_SHIFT_REPORT } from './dummyData';

/**
 * Dummy API Service
 * Simulate network latency and async data fetching.
 * Use these functions in your components instead of direct dummyData imports
 * to prepare for a real REST/GraphQL API.
 */

const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Shift/EOD
    getShiftReport: async () => {
        await delay(1000);
        return DUMMY_SHIFT_REPORT;
    },

    // Dashboard Stats
    getDashboardStats: async () => {
        await delay(600);
        const lowStockCount = DUMMY_PRODUCTS.filter(p => p.stock < 20).length;
        const totalProducts = DUMMY_PRODUCTS.length;
        // Simple calculation mock
        return {
            totalSales: 'LKR 964,800',
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
        // Add real login logic here later
        return { success: true, user: { email, role: 'cashier' } };
    }
};
