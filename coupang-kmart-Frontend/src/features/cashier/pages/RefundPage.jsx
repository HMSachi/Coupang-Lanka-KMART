import React from 'react';
import POSLayout from '../../../layouts/POSLayout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import { RotateCcw, Search } from 'lucide-react';
import { DUMMY_REFUND_HISTORY } from '../../../services/dummyData';

export default function RefundPage() {
    const history = DUMMY_REFUND_HISTORY;

    return (
        <POSLayout>
            <div className="refund-container">
                <div className="content-header">
                    <h1>Refunds & Returns</h1>
                    <p>Process customer returns and issue refunds safely.</p>
                </div>

                <div className="refund-search-section">
                    <Card padding="md">
                        <div className="search-row">
                            <div className="input-group">
                                <Search size={18} />
                                <input type="text" placeholder="Enter Transaction ID or Receipt Number..." />
                            </div>
                            <Button variant="primary">Search Transaction</Button>
                        </div>
                    </Card>
                </div>

                <div className="refund-history">
                    <Card title="Recent Returns" subtitle="Showing last 10 processed refunds">
                        {history.length > 0 ? (
                            <div className="refund-list">
                                {history.map(item => (
                                    <div key={item.id} className="refund-list-item">
                                        <div className="refund-info">
                                            <span className="trx-id">{item.id}</span>
                                            <span className="item-name">{item.item}</span>
                                        </div>
                                        <div className="refund-meta">
                                            <span className="date">{item.date}</span>
                                            <span className="amount">LKR {item.amount.toLocaleString()}</span>
                                            <span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state-refund">
                                <RotateCcw size={48} />
                                <p>Search for a transaction to initiate a return.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </POSLayout>
    );
}
