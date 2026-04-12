import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import UserManagement from '../features/admin/pages/UserManagement';
import BranchManagement from '../features/admin/pages/BranchManagement';
import ProductCatalog from '../features/admin/pages/ProductCatalog';
import StockTransfer from '../features/admin/pages/StockTransfer';
import CashierDashboard from '../features/cashier/pages/CashierDashboard';
import RefundPage from '../features/cashier/pages/RefundPage';
import EodPage from '../features/cashier/pages/EodPage';

/**
 * Protected Route Wrapper
 * Enforces authentication and role-based access control (RBAC).
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
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

                {/* Operational POS Routes (Cashier) */}
                <Route
                    path="/pos"
                    element={
                        <ProtectedRoute allowedRoles={['cashier']}>
                            <CashierDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pos/refund"
                    element={
                        <ProtectedRoute allowedRoles={['cashier']}>
                            <RefundPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pos/eod"
                    element={
                        <ProtectedRoute allowedRoles={['cashier']}>
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
