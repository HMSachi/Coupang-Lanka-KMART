import React from 'react';

const MOCK_TRANSACTIONS = [
  { id: 'TRX-1092', cashier: 'Sara K.', amount: 'LKR 12,500', method: 'Credit Card', time: '10:42 AM', status: 'completed' },
  { id: 'TRX-1093', cashier: 'John D.', amount: 'LKR 4,200', method: 'Cash', time: '10:45 AM', status: 'completed' },
  { id: 'TRX-1094', cashier: 'Sara K.', amount: 'LKR 8,900', method: 'Debit Card', time: '10:55 AM', status: 'completed' },
  { id: 'TRX-1095', cashier: 'Amila W.', amount: 'LKR 11,500', method: 'Cash', time: '11:02 AM', status: 'completed' },
  { id: 'TRX-1096', cashier: 'Amila W.', amount: 'LKR 22,000', method: 'Credit Card', time: '11:15 AM', status: 'completed' },
];

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
            {MOCK_TRANSACTIONS.map(trx => (
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
