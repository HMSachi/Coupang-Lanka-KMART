import React from 'react';
import { Store, ShoppingBag, Users } from 'lucide-react';

const BRANCH_DATA = [
  { name: 'Colombo Flagship', sales: 'LKR 1.8M', orders: 450, status: 'high' },
  { name: 'Kandy City Centre', sales: 'LKR 850K', orders: 320, status: 'normal' },
  { name: 'Galle Fort Outlet', sales: 'LKR 620K', orders: 210, status: 'normal' },
  { name: 'Negombo Hub', sales: 'LKR 410K', orders: 150, status: 'low' },
];

export default function BranchOverview() {
  return (
    <React.Fragment>
      <div className="panel branch-panel">
        <div className="panel-header">
          <h2>Branch Overview</h2>
        </div>
        <div className="branch-list">
          {BRANCH_DATA.map(branch => (
            <div className="branch-item" key={branch.name}>
              <div className="branch-info">
                <div className="b-name">{branch.name}</div>
                <div className="b-metrics">{branch.orders} Orders</div>
              </div>
              <div className="branch-sales">
                {branch.sales}
                <div className={`status-dot ${branch.status}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel action-panel">
        <div className="panel-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <button className="action-btn">
            <Store size={18}/> New Branch
          </button>
          <button className="action-btn">
            <ShoppingBag size={18}/> Add Product
          </button>
          <button className="action-btn">
            <Users size={18}/> Add User
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}
