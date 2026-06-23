import React, { useState, useEffect } from 'react';
import { LogOut, User, Clock, RotateCcw, BarChart2, MonitorIcon, ChevronRight, Store, ShoppingCart, ShoppingBag, PackageX } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.jpeg';
import './POSLayout.css';

const POSLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [time, setTime] = useState(new Date());

    const [cartCount, setCartCount] = useState(0);
    const [isDarazSelectMode, setIsDarazSelectMode] = useState(false);
    const [darazPendingOrder, setDarazPendingOrder] = useState({});

    const checkDarazSelectMode = () => {
        const isSelect = localStorage.getItem('is_daraz_select') === 'true';
        setIsDarazSelectMode(isSelect);
        if (isSelect) {
            try {
                const pending = JSON.parse(localStorage.getItem('daraz_pending_order') || '{}');
                setDarazPendingOrder(pending);
            } catch (err) {
                console.error('Error parsing pending order:', err);
                setDarazPendingOrder({});
            }
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        checkDarazSelectMode();
        window.addEventListener('storage', checkDarazSelectMode);
        window.addEventListener('darazSelectModeChanged', checkDarazSelectMode);
        return () => {
            window.removeEventListener('storage', checkDarazSelectMode);
            window.removeEventListener('darazSelectModeChanged', checkDarazSelectMode);
        };
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
            checkDarazSelectMode();
        };

        updateCount();
        window.addEventListener('storage', updateCount);
        window.addEventListener('cartUpdated', updateCount);
        return () => {
            window.removeEventListener('storage', updateCount);
            window.removeEventListener('cartUpdated', updateCount);
        };
    }, []);

    const handleConfirmDarazSelection = () => {
        const savedCart = localStorage.getItem('pos_cart');
        if (!savedCart || JSON.parse(savedCart).length === 0) {
            alert('Please select at least one item first.');
            return;
        }

        const cartItems = JSON.parse(savedCart);
        
        let productName = '';
        let quantity = 1;
        let unitPrice = 0;

        if (cartItems.length === 1) {
            productName = cartItems[0].name;
            quantity = cartItems[0].qty;
            unitPrice = cartItems[0].price;
        } else {
            productName = cartItems.map(item => `${item.qty}x ${item.name}`).join(', ');
            quantity = 1;
            unitPrice = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
        }

        const pending = JSON.parse(localStorage.getItem('daraz_pending_order') || '{}');
        pending.product_name = productName;
        pending.quantity = quantity;
        pending.unit_price = unitPrice;

        // Map cart items to the new items format
        pending.items = cartItems.map(item => ({
            product_name: item.name,
            quantity: item.qty,
            unit_price: item.price
        }));
        
        const fee = parseFloat(pending.delivery_fee) || 0;
        const disc = parseFloat(pending.discount) || 0;
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
        pending.total_amount = subtotal + fee - disc;

        localStorage.setItem('daraz_pending_order', JSON.stringify(pending));
        localStorage.setItem('daraz_modal_reopen', 'true');

        localStorage.removeItem('is_daraz_select');
        localStorage.removeItem('pos_cart');
        
        window.dispatchEvent(new Event('cartUpdated'));
        window.dispatchEvent(new Event('darazSelectModeChanged'));
        
        navigate('/pos/daraz');
    };

    const handleCancelDarazSelection = () => {
        if (window.confirm('Cancel selecting items and return to Daraz orders?')) {
            localStorage.removeItem('is_daraz_select');
            localStorage.removeItem('pos_cart');
            localStorage.setItem('daraz_modal_reopen', 'true');
            window.dispatchEvent(new Event('cartUpdated'));
            window.dispatchEvent(new Event('darazSelectModeChanged'));
            navigate('/pos/daraz');
        }
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const pageTitle =
        location.pathname === '/pos/online-orders' ? 'Online Orders' :
        location.pathname === '/pos/daraz' ? 'Daraz Orders' :
            location.pathname === '/pos/refund' ? 'Returns & Refunds' :
                location.pathname === '/pos/wasted-items' ? 'Wasted Items' :
                location.pathname === '/pos/eod' ? 'My Session' : '';


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
        { path: '/pos/daraz', icon: <ShoppingBag size={20} />, label: 'Daraz Orders' },
        { path: '/pos/cart', icon: <ShoppingCart size={20} />, label: 'Cart' },
        { path: '/pos/refund', icon: <RotateCcw size={20} />, label: 'Returns & Refunds' },
        { path: '/pos/wasted-items', icon: <PackageX size={20} />, label: 'Wasted Items' },
        { path: '/pos/eod', icon: <BarChart2 size={20} />, label: 'My Session / EOD' }
    ];

    return (
        <div className="pos-layout-app">
            {/* Sidebar */}
            <aside className="pos-sidebar-new">
                <div className="pos-sidebar-header">
                    <div className="pos-sidebar-logo">
                        <img src={logo} alt="Coupang Kmart" />
                    </div>
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
                        {pageTitle && <h1>{pageTitle}</h1>}
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
                    {isDarazSelectMode && (
                        <div className="daraz-select-banner">
                            <div className="daraz-select-banner-content">
                                <span className="daraz-select-pulse-dot"></span>
                                <strong>Selecting items for Daraz Order:</strong>
                                <span className="daraz-select-order-id">#{darazPendingOrder.daraz_order_id || 'Draft'}</span>
                                <span className="daraz-select-items-count">({cartCount} items selected)</span>
                            </div>
                            <div className="daraz-select-banner-actions">
                                <button onClick={handleConfirmDarazSelection} className="daraz-select-btn-confirm">
                                    Confirm Selection
                                </button>
                                <button onClick={handleCancelDarazSelection} className="daraz-select-btn-cancel">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default POSLayout;
