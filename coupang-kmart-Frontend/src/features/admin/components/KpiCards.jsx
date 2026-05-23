import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Store, AlertTriangle, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { apiService } from '../../../services/dummyApi';

export default function KpiCards() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="kpi-loading">
        <Loader2 className="animate-spin" size={32} />
        <p>Calculating live metrics...</p>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Sales', value: stats.totalSales, trend: stats.salesTrend, icon: TrendingUp, color: 'blue', type: 'success' },
    { title: 'Total Orders', value: stats.totalOrders, trend: stats.orderTrend, icon: ShoppingBag, color: 'green', type: 'success' },
    { title: 'Products', value: stats.productsCount, trend: 'Active Items', icon: Store, color: 'primary', type: 'neutral' },
    { title: 'Low Stock', value: `${stats.lowStockAlerts} Alerts`, trend: 'Immediate Restock', icon: AlertTriangle, color: 'red', type: 'danger' },
  ];

  return (
    <section className="kpi-grid">
      {kpis.map((kpi, idx) => (
        <div className="kpi-card" key={idx}>
          <div className={`kpi-icon ${kpi.color}`}>
            <kpi.icon size={24} />
          </div>
          <div className="kpi-details">
            <h3>{kpi.title}</h3>
            <div className="kpi-val">{kpi.value}</div>
            <div className={`kpi-trend ${kpi.type}`}>
              {kpi.type === 'success' && <ArrowUpRight size={14} />}
              {kpi.type === 'danger' && <ArrowDownRight size={14} />}
              <span>{kpi.trend}</span>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
