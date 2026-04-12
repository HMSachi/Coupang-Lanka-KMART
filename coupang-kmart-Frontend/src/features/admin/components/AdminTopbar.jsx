import React from 'react';
import { Search, Bell } from 'lucide-react';

export default function AdminTopbar() {
  return (
    <header className="admin-topbar">
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Search orders, cosmetics, or reports..." />
      </div>

      <div className="topbar-actions">
        <button className="icon-btn pr" type="button" aria-label="Notifications">
          <Bell size={20} />
          <span className="badge">3</span>
        </button>
        <div className="user-profile">
          <div className="avatar">A</div>
          <div className="user-info">
            <span className="user-name">Super Admin</span>
            <span className="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
