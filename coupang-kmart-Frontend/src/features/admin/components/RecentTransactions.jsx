import React from 'react';
import { DUMMY_TRANSACTIONS } from '../../../services/dummyData';
import { CreditCard, Banknote, Clock, ArrowRight } from 'lucide-react';

export default function RecentTransactions() {
  const TRXS = DUMMY_TRANSACTIONS;

  return (
    <div className="table-responsive-premium">
      <table className="admin-table-v2">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Cashier</th>
            <th>Statement</th>
            <th>Timeline</th>
          </tr>
        </thead>
        <tbody>
          {TRXS.map(trx => (
            <tr key={trx.id} className="row-hover-premium">
              <td className="trx-col">
                <div className="trx-id-wrap">
                  <div className="trx-tag">TRX</div>
                  <span className="trx-number">{trx.id.split('-')[1]}</span>
                </div>
              </td>
              <td className="cashier-col">
                <div className="cashier-pill">
                  <div className="cashier-initial">{trx.cashier[0]}</div>
                  <span>{trx.cashier}</span>
                </div>
              </td>
              <td className="amount-col">
                <div className="amount-stack">
                  <span className="amt-val">{trx.amount}</span>
                  <div className={`method-pill ${trx.method.toLowerCase().includes('card') ? 'card' : 'cash'}`}>
                    {trx.method.toLowerCase().includes('card') ? <CreditCard size={12} /> : <Banknote size={12} />}
                    <span>{trx.method}</span>
                  </div>
                </div>
              </td>
              <td className="time-col">
                <div className="time-badge">
                  <Clock size={12} />
                  <span>{trx.time}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-footer-premium">
        <button className="view-all-btn-v2">
          View All Activity <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
