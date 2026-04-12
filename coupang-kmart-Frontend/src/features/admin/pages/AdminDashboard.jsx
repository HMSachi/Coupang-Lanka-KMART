import React from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import KpiCards from '../components/KpiCards';
import SalesAnalytics from '../components/SalesAnalytics';
import RecentTransactions from '../components/RecentTransactions';
import BranchOverview from '../components/BranchOverview';
import Card from '../../../components/shared/Card';
import '../styles/admin.css';

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user')) || { role: 'superAdmin' };
  const isSuper = user.role === 'superAdmin';

  return (
    <AdminLayout>
      <div className="dashboard-content">
        <div className="content-header">
          <h1>{isSuper ? 'Global Overview' : 'Branch Dashboard'}</h1>
          <p>
            {isSuper
              ? 'Real-time analytics and performance metrics for all Coupang Kmart branches.'
              : `Managing operations and inventory for your assigned station.`
            }
          </p>
        </div>

        <KpiCards />

        <div className="dashboard-grid-premium">
          <div className="grid-main">
            <Card title="Sales Analytics" subtitle={isSuper ? "Organization performance trends" : "Branch performance trends"} className="analytics-card">
              <SalesAnalytics />
            </Card>

            <Card title="Recent Transactions" subtitle={isSuper ? "Latest sales across all branches" : "Latest sales for this branch"} className="transactions-card">
              <RecentTransactions />
            </Card>
          </div>

          <div className="grid-side">
            {isSuper ? (
              <Card title="Branch Performance" subtitle="Activity by location" className="branch-card">
                <BranchOverview />
              </Card>
            ) : (
              <Card title="Station Alerts" subtitle="Urgent action required" className="branch-card">
                <div className="station-alerts-placeholder">
                  <p className="color-muted" style={{ fontSize: '0.85rem' }}>All systems operational. No pending low-stock alerts for this branch.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
