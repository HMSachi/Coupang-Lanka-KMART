import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import KpiCards from '../components/KpiCards';
import SalesAnalytics from '../components/SalesAnalytics';
import RecentTransactions from '../components/RecentTransactions';
import BranchOverview from '../components/BranchOverview';
import Card from '../../../components/shared/Card';
import { ArrowUpRight, RefreshCw, Clock, FileText, ShoppingBag } from 'lucide-react';
import '../styles/admin.css';

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user')) || { role: 'superAdmin' };
  const isSuper = user.role === 'superAdmin';
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    pendingOrders: 0,
    todayOrders: 0,
    reportsCount: 0,
    latestOrders: []
  });

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = useMemo(() => {
    const email = user?.email || 'admin@local';
    return email.split('@')[0] || 'Admin';
  }, [user]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [ordersRes, reportsRes] = await Promise.all([
        fetch(`${apiUrl}/api/orders?status=ALL`, { headers }),
        fetch(`${apiUrl}/api/reports`, { headers })
      ]);

      const ordersData = ordersRes.ok ? await ordersRes.json() : [];
      const reportsData = reportsRes.ok ? await reportsRes.json() : [];

      const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.data || []);
      const reports = Array.isArray(reportsData) ? reportsData : (reportsData?.data || []);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const normalizeStatus = (s) => (s || '').toString().toUpperCase();
      const isClosedStatus = (s) => ['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(normalizeStatus(s));

      const pendingOrders = orders.filter(o => !isClosedStatus(o.status)).length;
      const todayOrders = orders.filter(o => {
        const ts = o.created_at || o.createdAt || o.date || o.created_time;
        if (!ts) return false;
        const d = new Date(ts);
        return !Number.isNaN(d.getTime()) && d.getTime() >= todayStart.getTime();
      }).length;

      const latestOrders = orders
        .slice()
        .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0))
        .slice(0, 5);

      setOverview({
        pendingOrders,
        todayOrders,
        reportsCount: reports.length,
        latestOrders
      });
    } catch (e) {
      console.warn('Admin overview fetch failed:', e?.message || e);
      setOverview((prev) => ({ ...prev }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminLayout>
      <div className="admin-content-wrapper">
        <div className="page-header">
          <div className="header-info">
            <h1>{isSuper ? 'Global Overview' : 'Branch Dashboard'}</h1>
            <p>
              {isSuper
                ? 'Real-time analytics and performance metrics for all Coupang Kmart branches.'
                : `Managing operations and inventory for your assigned station.`
              }
            </p>
          </div>
        </div>

        <section className="admin-hero-card" aria-label="Admin dashboard greeting">
          <div className="admin-hero-left">
            <div className="admin-hero-kicker">Dashboard Overview</div>
            <div className="admin-hero-title">{greeting}, {displayName}.</div>
            <div className="admin-hero-subtitle">Operational snapshot and key actions</div>
          </div>
          <div className="admin-hero-right">
            <button className="admin-hero-refresh" onClick={fetchOverview} disabled={loading} title="Refresh overview">
              <RefreshCw size={16} />
              <span>{loading ? 'Refreshing' : 'Refresh'}</span>
            </button>
          </div>
        </section>

        <section className="admin-mini-kpis" aria-label="Operational snapshot">
          <div className="admin-mini-card">
            <div className="mini-label"><ShoppingBag size={14} /> Pending Orders</div>
            <div className="mini-value">{overview.pendingOrders}</div>
            <div className="mini-meta">Across all channels</div>
          </div>
          <div className="admin-mini-card">
            <div className="mini-label"><Clock size={14} /> Today’s Orders</div>
            <div className="mini-value">{overview.todayOrders}</div>
            <div className="mini-meta">Since midnight</div>
          </div>
          <div className="admin-mini-card">
            <div className="mini-label"><FileText size={14} /> Reports</div>
            <div className="mini-value">{overview.reportsCount}</div>
            <div className="mini-meta">Cashier submissions</div>
          </div>
        </section>

        <KpiCards />

        <div className="dashboard-grid-premium">
          <div className="grid-main">
            <Card title="Sales Analytics" subtitle={isSuper ? "Organization performance trends" : "Branch performance trends"} className="analytics-card">
              <SalesAnalytics />
            </Card>

            <Card title="Latest Web Orders" subtitle="Most recent orders requiring attention" className="transactions-card">
              <div className="admin-latest-orders">
                {overview.latestOrders.length === 0 ? (
                  <div className="admin-empty-inline">No recent orders available.</div>
                ) : (
                  <table className="admin-table-compact">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Status</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.latestOrders.map((o) => (
                        <tr key={o.id || o.order_id}>
                          <td>
                            <div className="order-cell">
                              <div className="order-id">{o.order_id || o.id}</div>
                              <div className="order-sub">{o.customer_name || o.customerName || 'Customer'}</div>
                            </div>
                          </td>
                          <td>
                            <span className="admin-status-pill">{o.status || 'PENDING'}</span>
                          </td>
                          <td className="text-right">
                            LKR {Number(o.total_amount || o.total || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
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

            <Card title="Quick Actions" subtitle="Common admin tasks" className="branch-card">
              <div className="admin-quick-actions">
                <a className="admin-qa" href="/admin/inventory">
                  <span>Inventory</span>
                  <ArrowUpRight size={16} />
                </a>
                <a className="admin-qa" href="/admin/users">
                  <span>Users</span>
                  <ArrowUpRight size={16} />
                </a>
                <a className="admin-qa" href="/admin/reports">
                  <span>Reports</span>
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
