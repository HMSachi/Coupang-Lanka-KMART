import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import UserManagement from '../features/admin/pages/UserManagement';
import BranchManagement from '../features/admin/pages/BranchManagement';
import ProductCatalog from '../features/admin/pages/ProductCatalog';
import StockTransfer from '../features/admin/pages/StockTransfer';
import Reports from '../features/admin/pages/Reports';
import Notifications from '../features/admin/pages/Notifications';
import Settings from '../features/admin/pages/Settings';
import RolesPermissions from '../features/admin/pages/RolesPermissions';
import CashierDashboard from '../features/cashier/pages/CashierDashboard';
import PosCartPage from '../features/cashier/pages/PosCartPage';
import CheckoutPage from '../features/cashier/pages/CheckoutPage';
import PaymentPage from '../features/cashier/pages/PaymentPage';
import RefundPage from '../features/cashier/pages/RefundPage';
import WastedItemsPage from '../features/cashier/pages/WastedItemsPage';
import EodPage from '../features/cashier/pages/EodPage';
import SessionStartPage from '../features/cashier/pages/SessionStartPage';
import OnlineOrdersPage from '../features/cashier/pages/OnlineOrdersPage';
import DarazOrdersPage from '../features/cashier/pages/DarazOrdersPage';
import CashierReports from '../features/admin/pages/CashierReports';
import SalesAnalyticsPage from '../features/admin/pages/SalesAnalyticsPage';

/**
 * Protected Route Wrapper
 * Enforces authentication and role-based access control (RBAC).
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles) {
        const userRole = user.role ? user.role.toLowerCase() : '';
        const lowerAllowedRoles = allowedRoles.map(r => r.toLowerCase());
        if (!lowerAllowedRoles.includes(userRole)) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Administrative Routes (Management & Inventory) */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={['superAdmin', 'admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/branches"
                    element={
                        <ProtectedRoute allowedRoles={['superAdmin']}>
                            <BranchManagement />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/inventory"
                    element={
                        <ProtectedRoute allowedRoles={['superAdmin', 'admin']}>
                            <ProductCatalog />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/transfers"
                    element={
                        <ProtectedRoute allowedRoles={['superAdmin', 'admin']}>
                            <StockTransfer />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <ProtectedRoute allowedRoles={['superAdmin']}>
                            <UserManagement />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/roles"
                    element={
                        <ProtectedRoute allowedRoles={['superAdmin']}>
                            <RolesPermissions />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/reports"
                    element={
                        <ProtectedRoute allowedRoles={['superAdmin', 'admin']}>
                            <Reports />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/analytics"
                    element={
                        <ProtectedRoute allowedRoles={['superAdmin', 'admin']}>
                            <SalesAnalyticsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/cashier-reports"
                    element={
                        <ProtectedRoute allowedRoles={['superAdmin', 'admin']}>
                            <CashierReports />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/notifications"
                    element={
                        <ProtectedRoute allowedRoles={['superAdmin', 'admin']}>
                            <Notifications />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/settings"
                    element={
                        <ProtectedRoute allowedRoles={['superAdmin']}>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

                {/* Operational POS Routes (Cashier) */}
                <Route
                    path="/pos"
                    element={
                        <ProtectedRoute allowedRoles={['cashier', 'admin', 'superAdmin']}>
                            <CashierDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pos/online-orders"
                    element={
                        <ProtectedRoute allowedRoles={['cashier', 'admin', 'superAdmin']}>
                            <OnlineOrdersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pos/daraz"
                    element={
                        <ProtectedRoute allowedRoles={['cashier', 'admin', 'superAdmin']}>
                            <DarazOrdersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pos/refund"
                    element={
                        <ProtectedRoute allowedRoles={['cashier', 'admin', 'superAdmin']}>
                            <RefundPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pos/wasted-items"
                    element={
                        <ProtectedRoute allowedRoles={['cashier', 'admin', 'superAdmin']}>
                            <WastedItemsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pos/cart"
                    element={
                        <ProtectedRoute allowedRoles={['cashier', 'admin', 'superAdmin']}>
                            <PosCartPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pos/checkout"
                    element={
                        <ProtectedRoute allowedRoles={['cashier', 'admin', 'superAdmin']}>
                            <CheckoutPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pos/payment"
                    element={
                        <ProtectedRoute allowedRoles={['cashier', 'admin', 'superAdmin']}>
                            <PaymentPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pos/session-start"
                    element={
                        <ProtectedRoute allowedRoles={['cashier', 'admin', 'superAdmin']}>
                            <SessionStartPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pos/eod"
                    element={
                        <ProtectedRoute allowedRoles={['cashier', 'admin', 'superAdmin']}>
                            <EodPage />
                        </ProtectedRoute>
                    }
                />

                {/* Default Redirect */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;
