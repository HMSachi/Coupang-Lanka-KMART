import React from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import KpiCards from '../components/KpiCards';
import SalesAnalytics from '../components/SalesAnalytics';
import RecentTransactions from '../components/RecentTransactions';
import BranchOverview from '../components/BranchOverview';
import Card from '../../../components/shared/Card';
import '../styles/admin.css';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="dashboard-content">
        <div className="content-header">
          <h1>System Overview</h1>
          <p>Real-time analytics and performance metrics for all branches.</p>
        </div>

        <KpiCards />

        <div className="dashboard-grid-premium">
          <div className="grid-main">
            <Card title="Sales Analytics" subtitle="Monthly performance trends" className="analytics-card">
              <SalesAnalytics />
            </Card>

            <Card title="Recent Transactions" subtitle="Latest sales across all branches" className="transactions-card">
              <RecentTransactions />
            </Card>
          </div>

          <div className="grid-side">
            <Card title="Branch Performance" subtitle="Activity by location" className="branch-card">
              <BranchOverview />
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
