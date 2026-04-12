import React from 'react';

import { DUMMY_TRANSACTIONS } from '../../../services/dummyData';

const TRXS = DUMMY_TRANSACTIONS;

export default function RecentTransactions() {
  return (
    <div className="panel table-panel">
      <div className="panel-header">
        <h2>Recent Transactions</h2>
        <button className="btn-link">View All</button>
      </div>
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Cashier</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {TRXS.map(trx => (
              <tr key={trx.id}>
                <td className="fw-600">{trx.id}</td>
                <td>{trx.cashier}</td>
                <td className="fw-600 color-blue">{trx.amount}</td>
                <td>
                  <span className={`badge-method ${trx.method === 'Cash' ? 'method-cash' : 'method-card'}`}>
                    {trx.method}
                  </span>
                </td>
                <td className="color-muted">{trx.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
