import React from 'react';
import { LogOut, Home, Package, Users, BarChart2, Bell, Settings, Store, ArrowLeftRight, Shield } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './AdminLayout.css';

const navItems = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Store, label: 'Branches', path: '/admin/branches' },
    { icon: Package, label: 'Inventory', path: '/admin/inventory' },
    { icon: ArrowLeftRight, label: 'Stock Transfer', path: '/admin/transfers' },
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: Shield, label: 'Roles & Permissions', path: '/admin/roles' },
    { icon: BarChart2, label: 'Reports', path: '/admin/reports' },
    { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user')) || { email: 'Admin@g.com', role: 'superAdmin' };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const filteredNavItems = navItems.filter(item => {
        if (user.role === 'superAdmin') return true;
        // Restrict local Admins from sensitive cross-branch / user management
        const restricted = ['Branches', 'User Management', 'Roles & Permissions'];
        return !restricted.includes(item.label);
    });

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-icon">CK</div>
                    <span className="logo-text">Coupang <span>Kmart</span></span>
                </div>

                <nav className="sidebar-nav">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-container">
                <header className="main-header">
                    <div className="header-search">
                        {/* Search bar could go here */}
                    </div>
                    <div className="header-actions">
                        <button className="icon-btn"><Bell size={20} /></button>
                        <div className="user-profile">
                            <div className="user-info">
                                <span className="user-name">{user.email.split('@')[0]}</span>
                                <span className="user-role">{user.role}</span>
                            </div>
                            <div className="user-avatar">
                                {user.email[0].toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="content-area">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
