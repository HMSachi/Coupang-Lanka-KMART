import React from 'react';
import POSLayout from '../../../layouts/POSLayout';
import Card from '../../../components/shared/Card';
import { RotateCcw, Search } from 'lucide-react';
import { DUMMY_REFUND_HISTORY } from '../../../services/dummyData';
import './RefundPage.css';

export default function RefundPage() {
    const history = DUMMY_REFUND_HISTORY;

    return (
        <POSLayout>
            <div className="refund-container">

                <div className="refund-search-section">
                    <div className="search-row">
                        <div className="rfnd-input-group">
                            <Search size={16} className="text-slate-400" />
                            <input type="text" placeholder="Enter Transaction ID or Receipt Number..." />
                        </div>
                        <button className="search-btn-modern">Search Transaction</button>
                    </div>
                </div>

                <div className="refund-history">
                    <Card title="Recent Returns">
                        {history.length > 0 ? (
                            <div className="refund-table-container">
                                <table className="refund-table">
                                    <thead>
                                        <tr>
                                            <th>Transaction ID</th>
                                            <th>Item Name</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map(item => (
                                            <tr key={item.id}>
                                                <td><span className="trx-id-badge">{item.id}</span></td>
                                                <td>{item.item}</td>
                                                <td>{item.date}</td>
                                                <td className="rfnd-amount">LKR {item.amount.toLocaleString()}</td>
                                                <td>
                                                    <span className={`status-badge ${item.status.toLowerCase()}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state-refund">
                                <RotateCcw size={40} strokeWidth={1.5} />
                                <p>Search for a transaction to initiate a return.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </POSLayout>
    );
}
