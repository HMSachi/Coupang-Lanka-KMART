import React, { useState, useEffect } from 'react';
import { LogOut, User, Clock, RotateCcw, BarChart2, MonitorIcon, ChevronRight, Store, ShoppingCart, ShoppingBag } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './POSLayout.css';

const POSLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [time, setTime] = useState(new Date());

    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const updateCount = () => {
            const savedCart = localStorage.getItem('pos_cart');
            if (savedCart) {
                const cartItems = JSON.parse(savedCart);
                setCartCount(cartItems.reduce((sum, item) => sum + item.qty, 0));
            } else {
                setCartCount(0);
            }
        };

        updateCount();
        window.addEventListener('storage', updateCount);
        window.addEventListener('cartUpdated', updateCount);
        return () => {
            window.removeEventListener('storage', updateCount);
            window.removeEventListener('cartUpdated', updateCount);
        };
    }, []);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        const shiftStatus = localStorage.getItem('shift_status');
        if (user.role === 'cashier' && shiftStatus !== 'closed') {
            alert('CRITICAL: You must complete the End-of-Day (EOD) Close procedure before logging out.');
            navigate('/pos/eod');
            return;
        }

        localStorage.removeItem('user');
        localStorage.removeItem('shift_status');
        navigate('/login');
    };

    const navItems = [
        { path: '/pos', icon: <MonitorIcon size={20} />, label: 'Create Order' },
        { path: '/pos/online-orders', icon: <ShoppingBag size={20} />, label: 'Online Orders' },
        { path: '/pos/cart', icon: <ShoppingCart size={20} />, label: 'Cart' },
        { path: '/pos/refund', icon: <RotateCcw size={20} />, label: 'Returns & Refunds' },
        { path: '/pos/eod', icon: <BarChart2 size={20} />, label: 'My Session / EOD' }
    ];

    return (
        <div className="pos-layout-app">
            {/* Sidebar */}
            <aside className="pos-sidebar-new">
                <div className="pos-sidebar-header">
                    <div className="pos-sidebar-logo">CK</div>
                    <div className="pos-sidebar-title">
                        <span>Coupang <strong>Kmart</strong></span>
                        <small>Terminal POS</small>
                    </div>
                </div>

                <div className="pos-sidebar-nav">
                    <div className="pos-nav-title">Main Menu</div>
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path || (item.path === '/pos' && location.pathname === '/pos/');
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`pos-nav-item ${isActive ? 'active' : ''}`}
                            >
                                <div className="pos-nav-icon">{item.icon}</div>
                                <span className="pos-nav-label">{item.label}</span>
                                {isActive && <ChevronRight size={16} className="pos-nav-chevron" />}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom User Area */}
                <div className="pos-sidebar-user">
                    <div className="pos-user-card">
                        <div className="pos-user-info-wrapper">
                            <div className="pos-user-avatar">
                                <User size={18} />
                            </div>
                            <div className="pos-user-details">
                                <span className="pos-user-name">{user.email ? user.email.split('@')[0] : 'Cashier'}</span>
                                <span className="pos-user-status">
                                    <span className="status-dot-pulse"></span> Active Shift
                                </span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="pos-logout-btn-new">
                            <LogOut size={14} /> End Shift & Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="pos-main-wrapper">
                <header className="pos-top-header">
                    <div className="pos-header-left">
                        <h1>
                            {location.pathname === '/pos' && 'Create Order'}
                            {location.pathname === '/pos/online-orders' && 'Online Orders'}
                            {location.pathname === '/pos/refund' && 'Returns & Refunds'}
                            {location.pathname === '/pos/eod' && 'My Session'}
                        </h1>
                        <span className="pos-branch-badge">
                            <Store size={12} />
                            {user.branch_name || 'Main Branch'}
                        </span>
                    </div>

                    <div className="pos-header-right">
                        <div className="pos-header-actions">
                            <Link to="/pos/cart" className="pos-header-cart-btn-mini" title="View Current Order">
                                <div className="cart-icon-wrapper">
                                    <ShoppingCart size={22} />
                                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                </div>
                            </Link>
                        </div>
                        <div className="pos-time-widget">
                            <Clock size={16} className="time-icon" />
                            <span className="time-text">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            <div className="time-divider"></div>
                            <span className="register-text">Register #01</span>
                        </div>
                    </div>
                </header>

                <main className="pos-content-area">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default POSLayout;
