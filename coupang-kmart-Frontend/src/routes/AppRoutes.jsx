import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import CashierDashboard from '../features/cashier/pages/CashierDashboard';
import RefundPage from '../features/cashier/pages/RefundPage';
import EodPage from '../features/cashier/pages/EodPage';

// Placeholder for protected routes logic
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
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Admin Routes */}
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute allowedRoles={['superAdmin', 'admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Protected Cashier Routes */}
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
            </Routes>
        </Router>
    );
};

export default AppRoutes;
