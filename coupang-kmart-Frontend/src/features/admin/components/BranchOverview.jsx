import React from 'react';
import { Store, ShoppingBag, Users, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

const BRANCH_DATA = [
  { name: 'Colombo Flagship', sales: 'LKR 1.8M', orders: 450, trend: 'up' },
  { name: 'Kandy City Centre', sales: 'LKR 850K', orders: 320, trend: 'up' },
  { name: 'Galle Fort Outlet', sales: 'LKR 620K', orders: 210, trend: 'down' },
];

export default function BranchOverview() {
  return (
    <div className="branch-overview-wrapper">
      <div className="branch-list-premium">
        {BRANCH_DATA.map(branch => (
          <div className="branch-row-v2" key={branch.name}>
            <div className="branch-main-info">
              <span className="branch-name-v2">{branch.name}</span>
              <span className="branch-orders-v2">{branch.orders} Orders</span>
            </div>
            <div className="branch-value-info">
              <span className="branch-sales-v2">{branch.sales}</span>
              <div className={`trend-chip ${branch.trend}`}>
                {branch.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-divider"></div>

      <div className="quick-actions-grid-v2">
        <h4 className="qa-title">Operations Control</h4>
        <div className="qa-buttons-v2">
          <button className="qa-btn-v2 branch">
            <div className="qa-icon-wrap"><Store size={20} /></div>
            <span>New Branch</span>
          </button>
          <button className="qa-btn-v2 product">
            <div className="qa-icon-wrap"><ShoppingBag size={20} /></div>
            <span>Add Product</span>
          </button>
          <button className="qa-btn-v2 user">
            <div className="qa-icon-wrap"><Users size={20} /></div>
            <span>Add User</span>
          </button>
        </div>
      </div>
    </div>
  );
}
