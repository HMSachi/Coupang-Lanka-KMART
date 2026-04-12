import React from 'react';
import { TrendingUp, ShoppingBag, Store, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function KpiCards() {
  return (
    <section className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-icon blue">
          <TrendingUp size={24} />
        </div>
        <div className="kpi-details">
          <h3>Total Sales</h3>
          <div className="kpi-val">LKR 9,64,800</div>
          <div className="kpi-trend success">
            <ArrowUpRight size={16} />
            <span>+18.5% from yesterday</span>
          </div>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon green">
          <ShoppingBag size={24} />
        </div>
        <div className="kpi-details">
          <h3>Total Orders</h3>
          <div className="kpi-val">342</div>
          <div className="kpi-trend success">
            <ArrowUpRight size={16} />
            <span>+5.2% from yesterday</span>
          </div>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon primary">
          <Store size={24} />
        </div>
        <div className="kpi-details">
          <h3>Products</h3>
          <div className="kpi-val">840</div>
          <div className="kpi-trend muted">
            <span>Currently active items</span>
          </div>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon red">
          <AlertTriangle size={24} />
        </div>
        <div className="kpi-details">
          <h3>Low Stock</h3>
          <div className="kpi-val">12 Alerts</div>
          <div className="kpi-trend danger">
            <ArrowDownRight size={16} />
            <span>Requires immediate restock</span>
          </div>
        </div>
      </div>
    </section>
  );
}
