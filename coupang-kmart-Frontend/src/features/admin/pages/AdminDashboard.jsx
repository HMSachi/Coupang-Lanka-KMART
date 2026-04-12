import React, { useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import KpiCards from '../components/KpiCards';
import SalesAnalytics from '../components/SalesAnalytics';
import RecentTransactions from '../components/RecentTransactions';
import BranchOverview from '../components/BranchOverview';
import '../styles/admin.css';

export default function AdminDashboard({ onLogout, theme = 'light', onToggleTheme }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  return (
    <div className={`admin-layout ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <button
        className="dashboard-theme-toggle"
        onClick={onToggleTheme}
        type="button"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4V2M12 22v-2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 14.5A9 9 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"/>
          </svg>
        )}
      </button>
      <AdminSidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onLogout={onLogout} />

      <main className="admin-main">
        <AdminTopbar />

        <div className="admin-content">
          <div className="content-header">
            <h1>Overview</h1>
            <p>Welcome back! Here's what's happening today at Luxe Beauty Bar.</p>
          </div>

          <KpiCards />

          <div className="dashboard-grid">
            <div className="grid-col-left">
              <SalesAnalytics />
              <RecentTransactions />
            </div>

            <div className="grid-col-right">
              <BranchOverview />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
