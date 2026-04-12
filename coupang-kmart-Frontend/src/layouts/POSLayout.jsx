import React from 'react';
import { LogOut, ShoppingCart, User, Search, Calculator, Clock, RotateCcw, BarChart2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import './POSLayout.css';

const POSLayout = ({ children }) => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        const shiftStatus = localStorage.getItem('shift_status');

        if (user.role === 'cashier' && shiftStatus !== 'closed') {
            alert('CRITICAL: You must complete the End-of-Day (EOD) Close procedure before logging out.');
            navigate('/pos/eod');
            return;
        }

        localStorage.removeItem('user');
        localStorage.removeItem('shift_status'); // Clear for next login
        navigate('/login');
    };

    return (
        <div className="pos-layout">
            {/* Top Header Bar */}
            <header className="pos-header-premium">
                <div className="pos-logo-premium">
                    <div className="logo-icon-premium">CK</div>
                    <div className="logo-text-premium">
                        Coupang <span>Kmart</span>
                        <small>Premium POS</small>
                    </div>
                </div>

                <div className="pos-header-center-premium">
                    <div className="pos-status-badge">
                        <span className="status-dot pulse"></span>
                        <Clock size={14} />
                        <span>Shift Active: Colombo Branch</span>
                    </div>
                </div>

                <div className="pos-header-actions-premium">
                    <div className="pos-user-profile">
                        <div className="user-avatar">
                            <User size={18} />
                        </div>
                        <div className="user-info-text">
                            <span className="user-name">{user.email ? user.email.split('@')[0] : 'Cashier'}</span>
                            <span className="user-role">Lead Cashier</span>
                        </div>
                    </div>
                    <button className="pos-logout-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main POS Content */}
            <main className="pos-main">
                {children}
            </main>

            {/* Footer / Status Bar */}
            <footer className="pos-footer">
                <div className="pos-footer-shortcuts">
                    <Link to="/pos" className="shortcut-link"><Calculator size={14} /> <span>Billing</span></Link>
                    <Link to="/pos/refund" className="shortcut-link"><RotateCcw size={14} /> <span>Returns</span></Link>
                    <Link to="/pos/eod" className="shortcut-link"><BarChart2 size={14} /> <span>EOD Close</span></Link>
                </div>
                <div className="pos-footer-info">
                    <span>Register #01</span>
                    <span>Branch: Colombo Central</span>
                </div>
            </footer>
        </div>
    );
};

export default POSLayout;
