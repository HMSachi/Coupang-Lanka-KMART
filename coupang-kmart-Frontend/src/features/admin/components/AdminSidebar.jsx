import React from 'react';
import { LayoutDashboard, MonitorSmartphone, ShoppingBag, Rows3, FileText, Users, Store, Truck, Tag, Bell, Settings, LogOut } from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'POS', icon: <MonitorSmartphone size={20} /> },
  { label: 'Products', icon: <ShoppingBag size={20} /> },
  { label: 'Categories', icon: <Rows3 size={20} /> },
  { label: 'Reports', icon: <FileText size={20} /> },
  { label: 'Users', icon: <Users size={20} /> },
  { label: 'Branches', icon: <Store size={20} /> },
  { label: 'Suppliers', icon: <Truck size={20} /> },
  { label: 'Promotions', icon: <Tag size={20} /> },
  { label: 'Notifications', icon: <Bell size={20} /> },
  { label: 'Settings', icon: <Settings size={20} /> },
];

export default function AdminSidebar({ activeMenu, setActiveMenu, onLogout }) {
  return (
    <aside className="admin-sidebar" aria-label="Admin Navigation">
      <div className="sidebar-brand">
        <div className="brand-logo-small"></div>
        <h2>Luxe Beauty Bar</h2>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {MENU_ITEMS.map((item) => (
            <li key={item.label}>
              <button
                className={`nav-btn ${activeMenu === item.label ? 'active' : ''}`}
                onClick={() => setActiveMenu(item.label)}
                type="button"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout} type="button">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
