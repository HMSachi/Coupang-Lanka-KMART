import React, { useEffect, useState } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import { AlertTriangle, CalendarDays, Eye, PackageX, RefreshCw, Receipt, Search, User, X } from 'lucide-react';
import './WastedItemsPage.css';

import { API_BASE_URL } from '../../../config';

const apiUrl = API_BASE_URL;

const filters = [
    { key: 'today', label: 'Today' },
    { key: 'last7', label: 'Last 07 Days' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All' }
];

export default function WastedItemsPage() {
    const [period, setPeriod] = useState('today');
    const [items, setItems] = useState([]);
    const [totals, setTotals] = useState({});
    const [selectedItem, setSelectedItem] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadWastedItems = async (selectedPeriod = period) => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/api/returns/wasted-items?period=${selectedPeriod}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to load wasted items');
            setItems(data.items || []);
            setTotals(data.totals || {});
        } catch (err) {
            console.error('Wasted items load failed:', err);
            setError(err.message || 'Unable to load wasted items.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWastedItems(period);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    const filteredItems = items.filter(item => {
        const text = search.trim().toLowerCase();
        if (!text) return true;
        return [
            item.return_ref,
            item.order_ref,
            item.product_name,
            item.customer_name,
            item.customer_phone,
            item.cashier_name,
            methodLabel(item.return_method)
        ].filter(Boolean).join(' ').toLowerCase().includes(text);
    });

    return (
        <POSLayout>
            <div className="wasted-page">
                <section className="wasted-hero">
                    <div>
                        <span>Return Inventory</span>
                        <h1>Wasted Items</h1>
                        <p>Returned items from all cashiers appear here automatically after a return is recorded.</p>
                    </div>
                    <button onClick={() => loadWastedItems(period)} disabled={loading}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                </section>

                <div className="wasted-summary-grid">
                    <SummaryBox icon={<PackageX size={18} />} label="Returned Records" value={totals.record_count || 0} />
                    <SummaryBox icon={<AlertTriangle size={18} />} label="Wasted Qty" value={totals.item_count || 0} />
                    <SummaryBox icon={<Receipt size={18} />} label="Total Value" value={formatMoney(totals.total_value)} />
                    <SummaryBox icon={<CalendarDays size={18} />} label="Cash Returns" value={formatMoney(totals.cash_refund_amount)} />
                </div>

                <section className="wasted-card">
                    <div className="wasted-toolbar">
                        <div className="wasted-search">
                            <Search size={16} />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search return ID, order ID, product, customer, cashier..."
                            />
                        </div>
                        <div className="wasted-filters">
                            {filters.map(filter => (
                                <button
                                    key={filter.key}
                                    className={period === filter.key ? 'active' : ''}
                                    onClick={() => setPeriod(filter.key)}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <div className="wasted-error">{error}</div>}

                    {loading ? (
                        <div className="wasted-empty">Loading wasted items...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="wasted-empty">No wasted items found for this filter.</div>
                    ) : (
                        <div className="wasted-table-wrap">
                            <table className="wasted-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Return / Order</th>
                                        <th>Customer</th>
                                        <th>Method</th>
                                        <th>Date & Cashier</th>
                                        <th className="text-right">Value</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(item => (
                                        <tr key={item.id} onClick={() => setSelectedItem(item)}>
                                            <td>
                                                <strong>{item.product_name}</strong>
                                                <span>Qty {item.quantity} x {formatMoney(item.unit_price)}</span>
                                            </td>
                                            <td>
                                                <strong>{item.return_ref}</strong>
                                                <span>{item.order_ref || 'No order ID'}</span>
                                            </td>
                                            <td>
                                                <strong>{item.customer_name || 'POS Customer'}</strong>
                                                <span>{item.customer_phone || item.customer_email || 'No contact'}</span>
                                            </td>
                                            <td><MethodPill method={item.return_method} /></td>
                                            <td>
                                                <strong>{new Date(item.created_at).toLocaleString()}</strong>
                                                <span>{item.cashier_name || 'Cashier'}</span>
                                            </td>
                                            <td className="text-right"><strong>{formatMoney(item.refund_amount)}</strong></td>
                                            <td className="text-right">
                                                <button className="wasted-view-btn" onClick={(event) => { event.stopPropagation(); setSelectedItem(item); }}>
                                                    <Eye size={14} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {selectedItem && <WastedItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </POSLayout>
    );
}

function SummaryBox({ icon, label, value }) {
    return (
        <div className="wasted-summary-box">
            <div>{icon}</div>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function WastedItemModal({ item, onClose }) {
    return (
        <div className="wasted-modal-overlay">
            <div className="wasted-modal">
                <div className="wasted-modal-header">
                    <div>
                        <h3>Wasted Item Details</h3>
                        <p>{item.return_ref}</p>
                    </div>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="wasted-modal-grid">
                    <InfoBox icon={<PackageX size={16} />} label="Item" value={item.product_name} meta={`Qty ${item.quantity} | ${formatMoney(item.refund_amount)}`} />
                    <InfoBox icon={<Receipt size={16} />} label="Return / Order" value={item.return_ref} meta={item.order_ref || 'No order ID'} />
                    <InfoBox icon={<User size={16} />} label="Customer" value={item.customer_name || 'POS Customer'} meta={item.customer_phone || item.customer_email || 'No contact'} />
                    <InfoBox icon={<User size={16} />} label="Cashier" value={item.cashier_name || 'Cashier'} meta={new Date(item.created_at).toLocaleString()} />
                </div>

                <div className="wasted-modal-section">
                    <h4>Return Details</h4>
                    <div className="wasted-detail-row"><span>Return Method</span><strong>{methodLabel(item.return_method)}</strong></div>
                    <div className="wasted-detail-row"><span>Reason</span><strong>{item.reason_text || 'N/A'}</strong></div>
                    <div className="wasted-detail-row"><span>Cashier Note</span><strong>{item.custom_note || 'No note'}</strong></div>
                    <div className="wasted-detail-row"><span>Order Status</span><strong>{item.order_status || 'N/A'}</strong></div>
                    <div className="wasted-detail-row"><span>Payment Method</span><strong>{item.payment_method || 'N/A'}</strong></div>
                    <div className="wasted-detail-row total"><span>Wasted Value</span><strong>{formatMoney(item.refund_amount)}</strong></div>
                </div>
            </div>
        </div>
    );
}

function InfoBox({ icon, label, value, meta }) {
    return (
        <div className="wasted-info-box">
            <div className="wasted-info-icon">{icon}</div>
            <div>
                <label>{label}</label>
                <strong>{value}</strong>
                <span>{meta}</span>
            </div>
        </div>
    );
}

function MethodPill({ method }) {
    return <span className={`wasted-method ${method || 'unknown'}`}>{methodLabel(method)}</span>;
}

function methodLabel(method) {
    return {
        refund_cash: 'Cash Return',
        store_credit: 'Store Credit',
        exchange_item: 'Exchange Item'
    }[method] || method || 'N/A';
}

function formatMoney(value) {
    return `LKR ${Number(value || 0).toLocaleString()}`;
}
