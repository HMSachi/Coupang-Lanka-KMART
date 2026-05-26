import React, { useEffect, useState } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import Card from '../../../components/shared/Card';
import {
    AlertTriangle,
    Banknote,
    CalendarDays,
    CheckCircle,
    CreditCard,
    Eye,
    FileText,
    Plus,
    Receipt,
    RotateCcw,
    Search,
    Trash2,
    User,
    X
} from 'lucide-react';
import logo from '../../../assets/logo.jpeg';
import './RefundPage.css';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function RefundPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [returnHistory, setReturnHistory] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeReturnReport, setActiveReturnReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');
    const [returnMode, setReturnMode] = useState(false);
    const [returnItems, setReturnItems] = useState([]);
    const [submitError, setSubmitError] = useState('');
    const [submittingReturn, setSubmittingReturn] = useState(false);
    const [cashBatchModal, setCashBatchModal] = useState(null);
    const [storeCreditInvoice, setStoreCreditInvoice] = useState(null);
    const [exchangeBatchModal, setExchangeBatchModal] = useState(null);
    const [batchError, setBatchError] = useState('');
    const [batchSubmitting, setBatchSubmitting] = useState(false);
    const [returnConfig, setReturnConfig] = useState({
        reasons: [],
        policy: { return_allowed_days: 7 },
        non_returnable_products: []
    });

    useEffect(() => {
        loadReturnConfig();
        loadReturnHistory();
    }, []);

    const loadReturnConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/api/returns/config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setReturnConfig({
                    reasons: data.reasons || [],
                    policy: data.policy || { return_allowed_days: 7 },
                    non_returnable_products: data.non_returnable_products || []
                });
            }
        } catch (err) {
            console.warn('Return configuration unavailable:', err.message);
        }
    };

    const loadReturnHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/api/returns`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setReturnHistory(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.warn('Return history unavailable:', err.message);
        }
    };

    const handleSearch = async (e) => {
        e?.preventDefault();
        const searchText = query.trim().toLowerCase();
        setError('');
        setSearched(true);

        if (!searchText) {
            setResults([]);
            setError('Enter an invoice number or online order number.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/api/orders?status=ALL`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to search orders');

            const data = await response.json();
            const orders = Array.isArray(data) ? data : data.data || [];
            const matched = orders
                .filter(order => {
                    const orderId = String(order.order_id || '').toLowerCase();
                    const status = String(order.status || '').toLowerCase();
                    return orderId.includes(searchText) && ['completed', 'delivered', 'cash received'].includes(status);
                })
                .sort((a, b) => new Date(b.completed_at || b.created_at || 0) - new Date(a.completed_at || a.created_at || 0));

            setResults(matched);
            if (matched.length === 0) {
                setError('No completed online or cashier order found for that invoice number.');
            }
        } catch (err) {
            console.error('Refund search failed:', err);
            setError('Unable to search orders. Check backend connection.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const openOrderDetails = async (order) => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/api/orders/${order.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load order details');

            const data = await response.json();
            let orderReturnRecords = [];
            const returnsResponse = await fetch(`${apiUrl}/api/returns/order/${data.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (returnsResponse.ok) {
                orderReturnRecords = await returnsResponse.json();
            }

            setSelectedOrder(normalizeOrder(data, orderReturnRecords));
            setActiveReturnReport(null);
            setReturnMode(false);
            setReturnItems([]);
            setSubmitError('');
        } catch (err) {
            console.error('Order details failed:', err);
            setError('Unable to load full order details.');
        } finally {
            setLoading(false);
        }
    };

    const openReturnReport = async (returnRef) => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/api/returns/${encodeURIComponent(returnRef)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Unable to load return report');

            setActiveReturnReport(normalizeReturnReport(data));
            setSelectedOrder(null);
            setReturnMode(false);
        } catch (err) {
            console.error('Return report failed:', err);
            setError(err.message || 'Unable to load return report.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => `LKR ${(Number(value) || 0).toLocaleString()}`;
    const formatMethod = (value) => ({
        refund_cash: 'Refund cash',
        store_credit: 'Store credit',
        exchange_item: 'Exchange item'
    }[value] || value || 'N/A');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const activeReasons = returnConfig.reasons.filter(reason => reason.is_active);
    const isNonReturnable = (item) => returnConfig.non_returnable_products.some(product => Number(product.product_id) === Number(item.id));
    const isAlreadyReturned = (item) => Boolean(item.returnedInfo);
    const returnTotal = returnItems.reduce((sum, item) => sum + (Number(item.returnQty) || 0) * (Number(item.price) || 0), 0);
    const canProceedReturn = returnItems.length > 0 && returnItems.every(item =>
        item.returnQty >= 1 &&
        item.returnQty <= item.qty &&
        item.reasonId &&
        item.method &&
        item.conditionConfirmed
    );

    const addReturnItem = (item) => {
        if (isAlreadyReturned(item)) {
            setSubmitError(`${item.name} was already returned in ${item.returnedInfo.return_ref}.`);
            return;
        }
        if (isNonReturnable(item)) return;
        setSubmitError('');
        setReturnItems(prev => {
            if (prev.some(returnItem => returnItem.lineKey === item.lineKey)) return prev;
            return [
                ...prev,
                {
                    ...item,
                    returnQty: 1,
                    reasonId: '',
                    reasonText: '',
                    method: 'refund_cash',
                    customNote: '',
                    conditionConfirmed: false
                }
            ];
        });
    };

    const updateReturnItem = (lineKey, patch) => {
        setReturnItems(prev => prev.map(item => {
            if (item.lineKey !== lineKey) return item;
            const next = { ...item, ...patch };
            if (patch.reasonId !== undefined) {
                const reason = activeReasons.find(reasonItem => String(reasonItem.id) === String(patch.reasonId));
                next.reasonText = reason?.reason || '';
            }
            if (patch.returnQty !== undefined) {
                next.returnQty = Math.min(item.qty, Math.max(1, Number(patch.returnQty) || 1));
            }
            return next;
        }));
    };

    const removeReturnItem = (lineKey) => {
        setReturnItems(prev => prev.filter(item => item.lineKey !== lineKey));
    };

    const submitReturn = async () => {
        setSubmitError('');

        if (!canProceedReturn) {
            setSubmitError('Select quantity, reason, return method, and confirm item condition for every return item.');
            return;
        }

        setSubmittingReturn(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await fetch(`${apiUrl}/api/returns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    order_id: selectedOrder.id,
                    order_ref: selectedOrder.orderId,
                    branch_id: user.branch_id || selectedOrder.branchId || null,
                    cashier_name: user.name || user.username || (user.email ? user.email.split('@')[0] : 'cashier'),
                    items: returnItems.map(item => ({
                        product_id: item.id,
                        product_name: item.name,
                        quantity: item.returnQty,
                        unit_price: item.price,
                        refund_amount: item.returnQty * item.price,
                        reason_id: item.reasonId,
                        reason_text: item.reasonText,
                        return_method: item.method,
                        custom_note: item.customNote,
                        condition_confirmed: item.conditionConfirmed
                    }))
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to record return');

            setActiveReturnReport(normalizeReturnReport(data.report || data, selectedOrder));
            setReturnItems([]);
            setReturnMode(false);
            await loadReturnHistory();
        } catch (err) {
            console.error('Return submission failed:', err);
            setSubmitError(err.message || 'Unable to record return.');
        } finally {
            setSubmittingReturn(false);
        }
    };

    const openCashBatchModal = () => {
        if (!activeReturnReport) return;
        setBatchError('');
        setCashBatchModal({
            batchNumber: activeReturnReport.cash_batch_number || `RCB-${Date.now()}`,
            report: activeReturnReport
        });
    };

    const confirmCashBatch = async () => {
        if (!cashBatchModal?.report) return;
        setBatchSubmitting(true);
        setBatchError('');

        try {
            const token = localStorage.getItem('token');
            const batchNumber = cashBatchModal.batchNumber;
            const response = await fetch(`${apiUrl}/api/returns/${encodeURIComponent(cashBatchModal.report.return_ref)}/cash-batch`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ cash_batch_number: batchNumber })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Unable to create cash return batch');

            const updatedReport = normalizeReturnReport(data, cashBatchModal.report);
            const pendingBatches = JSON.parse(localStorage.getItem('pending_return_cash_batches') || '[]');
            const existingIndex = pendingBatches.findIndex(item => item.return_ref === updatedReport.return_ref);
            const pendingBatch = {
                id: `RETURN_BATCH_${updatedReport.return_ref}`,
                batch_number: batchNumber,
                amount: updatedReport.total_refund_amount,
                reason: `Cash refund for ${updatedReport.return_ref}`,
                return_ref: updatedReport.return_ref,
                order_id: updatedReport.order_ref,
                created_at: new Date().toISOString(),
                return_report: updatedReport
            };
            if (existingIndex >= 0) {
                pendingBatches[existingIndex] = pendingBatch;
            } else {
                pendingBatches.unshift(pendingBatch);
            }
            localStorage.setItem('pending_return_cash_batches', JSON.stringify(pendingBatches));
            window.dispatchEvent(new Event('refreshCashMetrics'));

            setActiveReturnReport(updatedReport);
            setCashBatchModal(null);
            await loadReturnHistory();
        } catch (err) {
            console.error('Cash return batch failed:', err);
            setBatchError(err.message || 'Unable to create cash return batch.');
        } finally {
            setBatchSubmitting(false);
        }
    };

    const createExchangeBatch = () => {
        if (!activeReturnReport) return;

        const exchangeItems = activeReturnReport.items.filter(item => item.return_method === 'exchange_item');
        const exchangeAmount = exchangeItems.reduce((sum, item) => sum + Number(item.refund_amount || 0), 0);
        const batchNumber = `EXB-${Date.now()}`;
        const exchangeBatch = {
            id: `EXCHANGE_BATCH_${activeReturnReport.return_ref}`,
            batch_number: batchNumber,
            return_ref: activeReturnReport.return_ref,
            order_id: activeReturnReport.order_ref,
            customer: activeReturnReport.customer,
            cashier_name: activeReturnReport.cashier_name,
            created_at: new Date().toISOString(),
            amount: exchangeAmount,
            status: 'pending',
            items: exchangeItems.map(item => ({
                id: item.product_id || `exchange-${item.id}`,
                product_id: item.product_id,
                name: item.product_name,
                price: Number(item.unit_price || 0),
                qty: Number(item.quantity || 1),
                image: '',
                return_item_id: item.id,
                return_ref: activeReturnReport.return_ref,
                exchange_batch_number: batchNumber
            })),
            return_report: activeReturnReport
        };

        const pendingBatches = JSON.parse(localStorage.getItem('pending_exchange_batches') || '[]');
        const withoutCurrentReturn = pendingBatches.filter(batch => batch.return_ref !== activeReturnReport.return_ref);
        localStorage.setItem('pending_exchange_batches', JSON.stringify([exchangeBatch, ...withoutCurrentReturn]));
        setExchangeBatchModal(exchangeBatch);
    };

    return (
        <POSLayout>
            <div className="refund-container">
                <div className="content-header">
                    <div className="header-text">
                        <h1>Returns & Refunds</h1>
                        <p>Search a real completed invoice before processing a return.</p>
                    </div>
                    <form className="refund-search-section" onSubmit={handleSearch}>
                        <div className="search-row">
                            <div className="rfnd-input-group">
                                <Search size={16} className="text-slate-400" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Enter invoice or online order number..."
                                />
                            </div>
                            <button className="search-btn-modern" type="submit" disabled={loading}>
                                {loading ? 'Searching...' : 'Search Transaction'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="refund-history">
                    <Card title="Order Lookup">
                        {error && <div className="refund-error">{error}</div>}
                        {results.length > 0 ? (
                            <div className="refund-table-container">
                                <table className="refund-table">
                                    <thead>
                                        <tr>
                                            <th>Invoice / Order ID</th>
                                            <th>Customer</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map(order => (
                                            <tr key={order.id} className="refund-result-row" onClick={() => openOrderDetails(order)}>
                                                <td><span className="trx-id-badge">{order.order_id}</span></td>
                                                <td>{order.customer_name || 'POS Customer'}</td>
                                                <td>{new Date(order.completed_at || order.created_at).toLocaleString()}</td>
                                                <td className="rfnd-amount">{formatCurrency(order.total_amount)}</td>
                                                <td>
                                                    <span className={`status-badge ${String(order.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                                                        {order.status?.toLowerCase()}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <button
                                                        className="refund-view-btn"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            openOrderDetails(order);
                                                        }}
                                                    >
                                                        <Eye size={15} /> View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state-refund">
                                <RotateCcw size={40} strokeWidth={1.5} />
                                <h3>{searched ? 'No matching order selected' : 'Search for a completed order'}</h3>
                                <p>Only real completed cashier invoices and completed online orders are shown here.</p>
                            </div>
                        )}
                    </Card>
                </div>

                <div className="refund-history return-transaction-history">
                    <Card title="Return Transactions">
                        {returnHistory.length > 0 ? (
                            <div className="refund-table-container">
                                <table className="refund-table">
                                    <thead>
                                        <tr>
                                            <th>Return ID</th>
                                            <th>Order ID</th>
                                            <th>Date</th>
                                            <th>Items</th>
                                            <th>Method</th>
                                            <th>Amount</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnHistory.map(item => (
                                            <tr key={item.return_ref} className="refund-result-row" onClick={() => openReturnReport(item.return_ref)}>
                                                <td><span className="trx-id-badge">{item.return_ref}</span></td>
                                                <td>{item.order_ref}</td>
                                                <td>{new Date(item.created_at).toLocaleString()}</td>
                                                <td>{item.item_count}</td>
                                                <td>{formatMethod(item.return_method)}</td>
                                                <td className="rfnd-amount">{formatCurrency(item.total_refund_amount)}</td>
                                                <td className="text-center">
                                                    <button
                                                        className="refund-view-btn"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            openReturnReport(item.return_ref);
                                                        }}
                                                    >
                                                        <Eye size={15} /> View Report
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state-refund">
                                <FileText size={34} strokeWidth={1.5} />
                                <h3>No return transactions yet</h3>
                                <p>Completed returns will appear here with their full report.</p>
                            </div>
                        )}
                    </Card>
                </div>

                {activeReturnReport && (
                    <ReturnReportModal
                        report={activeReturnReport}
                        formatCurrency={formatCurrency}
                        formatMethod={formatMethod}
                        onClose={() => setActiveReturnReport(null)}
                        onCashBatch={openCashBatchModal}
                        onStoreCreditInvoice={() => setStoreCreditInvoice(activeReturnReport)}
                        onExchangeBatch={createExchangeBatch}
                    />
                )}

                {storeCreditInvoice && (
                    <StoreCreditInvoiceModal
                        report={storeCreditInvoice}
                        user={currentUser}
                        formatCurrency={formatCurrency}
                        onClose={() => setStoreCreditInvoice(null)}
                    />
                )}

                {cashBatchModal && (
                    <div className="refund-modal-overlay">
                        <div className="cash-return-batch-modal">
                            <div className="refund-modal-header">
                                <div>
                                    <h3>Cash Return Batch</h3>
                                    <p>{cashBatchModal.batchNumber}</p>
                                </div>
                                <button onClick={() => setCashBatchModal(null)} className="refund-modal-close">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="cash-batch-body">
                                {batchError && <div className="refund-error">{batchError}</div>}
                                <div className="cash-batch-summary">
                                    <div><span>Return ID</span><strong>{cashBatchModal.report.return_ref}</strong></div>
                                    <div><span>Order ID</span><strong>{cashBatchModal.report.order_ref}</strong></div>
                                    <div><span>Batch No</span><strong>{cashBatchModal.batchNumber}</strong></div>
                                    <div><span>Cash Out Amount</span><strong>{formatCurrency(cashBatchModal.report.total_refund_amount)}</strong></div>
                                </div>
                                <p className="cash-batch-note">
                                    This creates a refund cash-out entry in cashier EOD and attaches this batch number to the return report.
                                </p>
                                <button className="return-items-primary cash-confirm-btn" onClick={confirmCashBatch} disabled={batchSubmitting}>
                                    <CheckCircle size={16} /> {batchSubmitting ? 'Creating Batch...' : 'Confirm Cash Return Batch'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {exchangeBatchModal && (
                    <div className="refund-modal-overlay">
                        <div className="cash-return-batch-modal exchange-batch-modal">
                            <div className="refund-modal-header">
                                <div>
                                    <h3>Exchange Batch Created</h3>
                                    <p>{exchangeBatchModal.batch_number}</p>
                                </div>
                                <button onClick={() => setExchangeBatchModal(null)} className="refund-modal-close">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="cash-batch-body">
                                <div className="cash-batch-summary">
                                    <div><span>Return ID</span><strong>{exchangeBatchModal.return_ref}</strong></div>
                                    <div><span>Order ID</span><strong>{exchangeBatchModal.order_id}</strong></div>
                                    <div><span>Customer</span><strong>{exchangeBatchModal.customer?.name || 'POS Customer'}</strong></div>
                                    <div><span>Exchange Value</span><strong>{formatCurrency(exchangeBatchModal.amount)}</strong></div>
                                </div>
                                <div className="exchange-batch-items">
                                    {exchangeBatchModal.items.map(item => (
                                        <div key={item.return_item_id || item.id}>
                                            <strong>{item.name}</strong>
                                            <span>{item.qty} x {formatCurrency(item.price)}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="cash-batch-note">
                                    Open Cart and choose Create Exchange Order. This batch will add the exchange item and auto-apply the exchange value during payment.
                                </p>
                                <button className="return-items-primary cash-confirm-btn" onClick={() => setExchangeBatchModal(null)}>
                                    <CheckCircle size={16} /> Ready for Cart
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedOrder && (
                    <div className="refund-modal-overlay">
                        <div className={`refund-modal ${returnMode ? 'return-workflow-modal' : ''}`}>
                            <div className="refund-modal-header">
                                <div>
                                    <h3>{returnMode ? 'Return Items' : 'Order Details'}</h3>
                                    <p>{selectedOrder.orderId}</p>
                                </div>
                                <div className="refund-modal-actions">
                                    {returnMode && (
                                        <button className="refund-secondary-action" onClick={() => setReturnMode(false)}>
                                            Back to Details
                                        </button>
                                    )}
                                    <button onClick={() => setSelectedOrder(null)} className="refund-modal-close">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="refund-detail-grid">
                                <div className="refund-detail-box">
                                    <User size={16} />
                                    <div>
                                        <label>Customer</label>
                                        <strong>{selectedOrder.customer.name}</strong>
                                        <span>{selectedOrder.customer.phone || selectedOrder.customer.email || 'No contact'}</span>
                                    </div>
                                </div>
                                <div className="refund-detail-box">
                                    <CalendarDays size={16} />
                                    <div>
                                        <label>Order Date</label>
                                        <strong>{selectedOrder.completedAt ? new Date(selectedOrder.completedAt).toLocaleString() : 'N/A'}</strong>
                                        <span>{selectedOrder.channel}</span>
                                    </div>
                                </div>
                                <div className="refund-detail-box">
                                    <CreditCard size={16} />
                                    <div>
                                        <label>Payment</label>
                                        <strong>{selectedOrder.paymentMethod || 'N/A'}</strong>
                                        <span>Status: {selectedOrder.status}</span>
                                    </div>
                                </div>
                            </div>

                            {!returnMode ? (
                                <>
                                    <div className="refund-modal-items">
                                        <h4><Receipt size={16} /> Items</h4>
                                        {selectedOrder.items.map((item) => (
                                            <div key={item.lineKey} className={`refund-modal-item ${(isNonReturnable(item) || isAlreadyReturned(item)) ? 'is-blocked-return' : ''}`}>
                                                <div>
                                                    <strong>{item.name}</strong>
                                                    <span>{item.qty} x {formatCurrency(item.price)}</span>
                                                    {isAlreadyReturned(item) && (
                                                        <span className="non-returnable-note">This item already returned in {item.returnedInfo.return_ref}.</span>
                                                    )}
                                                    {isNonReturnable(item) && (
                                                        <span className="non-returnable-note">This item cannot return because admin marked it as non-returnable.</span>
                                                    )}
                                                </div>
                                                <strong>{formatCurrency(item.qty * item.price)}</strong>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="refund-policy-box">
                                        <div>
                                            <label>Return Window</label>
                                            <strong>{returnConfig.policy?.return_allowed_days ?? 7} days</strong>
                                        </div>
                                        <div>
                                            <label>Available Return Reasons</label>
                                            <strong>{activeReasons.length} saved reasons</strong>
                                        </div>
                                    </div>

                                    <div className="refund-modal-summary">
                                        <div><span>Subtotal</span><strong>{formatCurrency(selectedOrder.subtotal)}</strong></div>
                                        <div><span>Delivery / Shipping</span><strong>{formatCurrency(selectedOrder.shipping)}</strong></div>
                                        <div><span>Discount</span><strong>- {formatCurrency(selectedOrder.discount)}</strong></div>
                                        <div className="grand"><span>Refundable Order Total</span><strong>{formatCurrency(selectedOrder.total)}</strong></div>
                                    </div>

                                    <div className="refund-modal-footer">
                                        <button className="return-items-primary" onClick={() => setReturnMode(true)}>
                                            <RotateCcw size={16} /> Return Items
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="return-workflow-grid">
                                        <section className="return-panel">
                                            <div className="return-panel-header">
                                                <div>
                                                    <h4>Order Items</h4>
                                                    <p>Select products from this order for return.</p>
                                                </div>
                                            </div>
                                            <div className="return-item-list">
                                                {selectedOrder.items.map(item => {
                                                    const blocked = isNonReturnable(item) || isAlreadyReturned(item);
                                                    const added = returnItems.some(returnItem => returnItem.lineKey === item.lineKey);
                                                    return (
                                                        <div key={item.lineKey} className={`return-source-item ${blocked ? 'blocked' : ''}`}>
                                                            <div>
                                                                <strong>{item.name}</strong>
                                                                <span>{item.qty} bought | {formatCurrency(item.price)} each</span>
                                                                {isAlreadyReturned(item) && <small><AlertTriangle size={13} /> Already returned in {item.returnedInfo.return_ref}.</small>}
                                                                {!isAlreadyReturned(item) && isNonReturnable(item) && <small><AlertTriangle size={13} /> This item cannot return.</small>}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                disabled={blocked || added}
                                                                onClick={() => addReturnItem(item)}
                                                            >
                                                                <Plus size={14} /> {added ? 'Added' : 'Add'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>

                                        <section className="return-panel return-config-panel">
                                            <div className="return-panel-header">
                                                <div>
                                                    <h4>Return Items</h4>
                                                    <p>Configure quantity, reason, method, and condition.</p>
                                                </div>
                                                <strong>{formatCurrency(returnTotal)}</strong>
                                            </div>

                                            {submitError && <div className="refund-error">{submitError}</div>}

                                            {returnItems.length === 0 ? (
                                                <div className="return-empty-box">
                                                    <RotateCcw size={34} strokeWidth={1.5} />
                                                    <h4>No return items added</h4>
                                                    <p>Use Add beside an eligible order item to start a return.</p>
                                                </div>
                                            ) : (
                                                <div className="return-config-list">
                                                    {returnItems.map(item => (
                                                        <div className="return-config-card" key={item.lineKey}>
                                                            <div className="return-config-title">
                                                                <div>
                                                                    <strong>{item.name}</strong>
                                                                    <span>Purchased {item.qty} | Return value {formatCurrency(item.returnQty * item.price)}</span>
                                                                </div>
                                                                <button type="button" onClick={() => removeReturnItem(item.lineKey)}>
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>

                                                            <div className="return-form-grid">
                                                                <label>
                                                                    Return Quantity
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        max={item.qty}
                                                                        value={item.returnQty}
                                                                        onChange={(event) => updateReturnItem(item.lineKey, { returnQty: event.target.value })}
                                                                    />
                                                                </label>
                                                                <label>
                                                                    Return Reason
                                                                    <select
                                                                        value={item.reasonId}
                                                                        onChange={(event) => updateReturnItem(item.lineKey, { reasonId: event.target.value })}
                                                                    >
                                                                        <option value="">Select reason...</option>
                                                                        {activeReasons.map(reason => (
                                                                            <option key={reason.id} value={reason.id}>{reason.reason}</option>
                                                                        ))}
                                                                    </select>
                                                                </label>
                                                                <label>
                                                                    Return Method
                                                                    <select
                                                                        value={item.method}
                                                                        onChange={(event) => updateReturnItem(item.lineKey, { method: event.target.value })}
                                                                    >
                                                                        <option value="refund_cash">Refund cash</option>
                                                                        <option value="store_credit">Store credit</option>
                                                                        <option value="exchange_item">Exchange item</option>
                                                                    </select>
                                                                </label>
                                                                <label className="return-note-field">
                                                                    Custom Note
                                                                    <textarea
                                                                        value={item.customNote}
                                                                        onChange={(event) => updateReturnItem(item.lineKey, { customNote: event.target.value })}
                                                                        placeholder="Optional cashier note..."
                                                                    />
                                                                </label>
                                                            </div>

                                                            <label className="return-condition-check">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.conditionConfirmed}
                                                                    onChange={(event) => updateReturnItem(item.lineKey, { conditionConfirmed: event.target.checked })}
                                                                />
                                                                <span>Item condition checked and eligible for return.</span>
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    </div>

                                    <div className="return-workflow-footer">
                                        <div>
                                            <span>Total Return Value</span>
                                            <strong>{formatCurrency(returnTotal)}</strong>
                                        </div>
                                        <button
                                            className="return-items-primary"
                                            onClick={submitReturn}
                                            disabled={!canProceedReturn || submittingReturn}
                                        >
                                            <CheckCircle size={16} /> {submittingReturn ? 'Processing...' : 'Proceed to Return'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </POSLayout>
    );
}

function ReturnReportModal({ report, formatCurrency, formatMethod, onClose, onCashBatch, onStoreCreditInvoice, onExchangeBatch }) {
    return (
        <div className="refund-modal-overlay">
            <div className="refund-modal return-report-modal">
                <div className="refund-modal-header">
                    <div>
                        <h3>Return Report</h3>
                        <p>{report.return_ref}</p>
                    </div>
                    <button onClick={onClose} className="refund-modal-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="return-report-layout">
                    <section className="return-report-main">
                        <div className="report-title-band">
                            <div>
                                <span>Official Return Transaction</span>
                                <strong>{report.return_ref}</strong>
                            </div>
                            <div>
                                <span>Total Refund</span>
                                <strong>{formatCurrency(report.total_refund_amount)}</strong>
                            </div>
                        </div>

                        <div className="refund-detail-grid report-detail-grid">
                            <div className="refund-detail-box">
                                <User size={16} />
                                <div>
                                    <label>Customer</label>
                                    <strong>{report.customer?.name || 'POS Customer'}</strong>
                                    <span>{report.customer?.phone || report.customer?.email || 'No contact'}</span>
                                </div>
                            </div>
                            <div className="refund-detail-box">
                                <Receipt size={16} />
                                <div>
                                    <label>Order</label>
                                    <strong>{report.order_ref}</strong>
                                    <span>{report.order?.status || 'Return completed'}</span>
                                </div>
                            </div>
                            <div className="refund-detail-box">
                                <User size={16} />
                                <div>
                                    <label>Cashier</label>
                                    <strong>{report.cashier_name || 'cashier'}</strong>
                                    <span>{new Date(report.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="return-report-section">
                            <h4>Returned Items</h4>
                            {report.items.map(item => (
                                <div className="return-report-item" key={item.id}>
                                    <div>
                                        <strong>{item.product_name}</strong>
                                        <span>{item.quantity} x {formatCurrency(item.unit_price)} | {formatMethod(item.return_method)}</span>
                                        <small>Reason: {item.reason_text || 'N/A'}</small>
                                        {item.custom_note && <small>Note: {item.custom_note}</small>}
                                    </div>
                                    <strong>{formatCurrency(item.refund_amount)}</strong>
                                </div>
                            ))}
                        </div>
                    </section>

                    <aside className="return-report-side">
                        <div className="return-side-card">
                            <label>Return Method</label>
                            <strong>{formatMethod(report.return_method)}</strong>
                            <span>{report.items.length} item(s) returned</span>
                        </div>

                        {report.hasCashRefund && (
                            <div className="return-side-card cash-card">
                                <label>Cash Refund Batch</label>
                                {report.cash_batch_number ? (
                                    <>
                                        <strong>{report.cash_batch_number}</strong>
                                        <span>Cash-out batch already created.</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create a cash-out batch so EOD deducts this refund from the drawer.</span>
                                        <button className="cash-batch-btn" onClick={onCashBatch}>
                                            <Banknote size={16} /> Make Batch for Cash Return
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {report.hasStoreCredit && (
                            <div className="return-side-card credit-card">
                                <label>Store Credit</label>
                                <strong>{formatCurrency(report.store_credit_amount)}</strong>
                                <span>Issue an official store credit invoice for the customer.</span>
                                <button className="store-credit-btn" onClick={onStoreCreditInvoice}>
                                    <FileText size={16} /> Print Store Credit Invoice
                                </button>
                            </div>
                        )}

                        {report.hasExchange && (
                            <div className="return-side-card exchange-card">
                                <label>Exchange Order</label>
                                <strong>{formatCurrency(report.exchange_amount)}</strong>
                                <span>Create an exchange batch for cart so the replacement order can be completed with exchange credit.</span>
                                <button className="exchange-batch-btn" onClick={onExchangeBatch}>
                                    <RotateCcw size={16} /> Exchange Now
                                </button>
                            </div>
                        )}

                        <div className="return-side-card total-card">
                            <label>Amount</label>
                            <strong>{formatCurrency(report.total_refund_amount)}</strong>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function StoreCreditInvoiceModal({ report, user, formatCurrency, onClose }) {
    const creditItems = report.items.filter(item => item.return_method === 'store_credit');
    const creditAmount = creditItems.reduce((sum, item) => sum + Number(item.refund_amount || 0), 0);
    const printInvoice = () => window.print();

    return (
        <div className="refund-modal-overlay">
            <div className="store-credit-invoice-modal">
                <div className="refund-modal-header no-print">
                    <div>
                        <h3>Store Credit Invoice</h3>
                        <p>{report.return_ref}</p>
                    </div>
                    <button onClick={onClose} className="refund-modal-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="store-credit-print-area">
                    <div className="credit-invoice-header">
                        <img src={logo} alt="Coupang Kmart" />
                        <div>
                            <h2>Coupang Kmart</h2>
                            <p>{user.branch_name || 'Main Branch'} | Terminal POS</p>
                            <p>Mobile: {user.branch_phone || '077 860 2219'}</p>
                        </div>
                        <div className="credit-invoice-badge">STORE CREDIT</div>
                    </div>

                    <div className="credit-invoice-meta">
                        <div><span>Return ID</span><strong>{report.return_ref}</strong></div>
                        <div><span>Order ID</span><strong>{report.order_ref}</strong></div>
                        <div><span>Date</span><strong>{new Date(report.created_at).toLocaleString()}</strong></div>
                        <div><span>Cashier</span><strong>{report.cashier_name || 'cashier'}</strong></div>
                    </div>

                    <div className="credit-customer-box">
                        <span>Customer</span>
                        <strong>{report.customer?.name || 'POS Customer'}</strong>
                        <p>{report.customer?.phone || report.customer?.email || 'No contact available'}</p>
                    </div>

                    <table className="credit-invoice-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Reason</th>
                                <th className="text-right">Price</th>
                                <th className="text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {creditItems.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <strong>{item.product_name}</strong>
                                        <span>Qty {item.quantity}</span>
                                    </td>
                                    <td>{item.reason_text || item.custom_note || 'Store credit return'}</td>
                                    <td className="text-right">{formatCurrency(item.unit_price)}</td>
                                    <td className="text-right">{formatCurrency(item.refund_amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="credit-highlight">
                        <span>You have store credit</span>
                        <strong>{formatCurrency(creditAmount)}</strong>
                        <p>The customer can use this store credit for future shopping at Coupang Kmart.</p>
                    </div>

                    <div className="credit-invoice-footer">
                        <div>
                            <span>Authorized By</span>
                            <strong>{report.cashier_name || 'cashier'}</strong>
                        </div>
                        <div>
                            <span>Customer Signature</span>
                            <strong>________________</strong>
                        </div>
                    </div>
                </div>

                <div className="credit-invoice-actions no-print">
                    <button className="refund-secondary-action" onClick={onClose}>Close</button>
                    <button className="return-items-primary" onClick={printInvoice}>
                        <FileText size={16} /> Print Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}

function normalizeReturnReport(report, fallbackOrder = null) {
    const items = (report.items || report.records || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name || item.name || 'Returned item',
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || item.price || 0),
        refund_amount: Number(item.refund_amount || 0),
        reason_id: item.reason_id,
        reason_text: item.reason_text || '',
        custom_note: item.custom_note || '',
        return_method: item.return_method,
        condition_confirmed: Boolean(item.condition_confirmed)
    }));
    const total = Number(report.total_refund_amount || items.reduce((sum, item) => sum + item.refund_amount, 0));
    const firstMethod = report.return_method || items[0]?.return_method || '';
    const storeCreditAmount = items
        .filter(item => item.return_method === 'store_credit')
        .reduce((sum, item) => sum + Number(item.refund_amount || 0), 0);
    const exchangeAmount = items
        .filter(item => item.return_method === 'exchange_item')
        .reduce((sum, item) => sum + Number(item.refund_amount || 0), 0);

    return {
        return_ref: report.return_ref || items[0]?.return_ref || `RTN-${Date.now()}`,
        order_id: report.order_id || fallbackOrder?.id,
        order_ref: report.order_ref || fallbackOrder?.orderId || 'N/A',
        created_at: report.created_at || new Date().toISOString(),
        cashier_name: report.cashier_name || 'cashier',
        branch_id: report.branch_id || fallbackOrder?.branchId,
        return_method: firstMethod,
        cash_batch_number: report.cash_batch_number || '',
        cash_batch_created_at: report.cash_batch_created_at || '',
        total_refund_amount: total,
        hasCashRefund: firstMethod === 'refund_cash' || items.some(item => item.return_method === 'refund_cash'),
        hasStoreCredit: firstMethod === 'store_credit' || items.some(item => item.return_method === 'store_credit'),
        hasExchange: firstMethod === 'exchange_item' || items.some(item => item.return_method === 'exchange_item'),
        store_credit_amount: storeCreditAmount || (firstMethod === 'store_credit' ? total : 0),
        exchange_amount: exchangeAmount || (firstMethod === 'exchange_item' ? total : 0),
        customer: {
            name: report.customer?.name || fallbackOrder?.customer?.name || 'POS Customer',
            phone: report.customer?.phone || fallbackOrder?.customer?.phone || '',
            email: report.customer?.email || fallbackOrder?.customer?.email || ''
        },
        order: report.order || {
            status: fallbackOrder?.status || 'Return completed',
            payment_method: fallbackOrder?.paymentMethod || '',
            total_amount: fallbackOrder?.total || 0,
            completed_at: fallbackOrder?.completedAt || ''
        },
        items
    };
}

function normalizeOrder(order, returnRecords = []) {
    const orderId = order.order_id || order.id;
    const isPosOrder = Boolean(
        order.session_id ||
        order.register_id ||
        order.cashier_name ||
        order.shipping_method === 'In-Store' ||
        String(orderId || '').startsWith('INV-')
    );

    return {
        id: order.id,
        orderId,
        status: order.status || 'N/A',
        channel: isPosOrder ? 'Cashier POS Order' : 'Online Order',
        branchId: order.branch_id,
        completedAt: order.completed_at || order.created_at,
        paymentMethod: order.payment_method,
        customer: {
            name: order.customer_name || 'POS Customer',
            phone: order.customer_phone || '',
            email: order.customer_email || ''
        },
        items: (order.items || []).map((item, index) => {
            const itemId = item.product_id || item.id;
            const itemName = item.product_name || item.name || 'Item';
            const returnedInfo = returnRecords.find(record => {
                if (itemId && record.product_id && Number(record.product_id) === Number(itemId)) return true;
                return String(record.product_name || '').trim().toLowerCase() === String(itemName).trim().toLowerCase();
            });

            return {
                id: itemId,
                lineKey: `${itemId || 'item'}-${index}`,
                name: itemName,
                qty: Number(item.quantity || item.qty) || 0,
                price: Number(item.price) || 0,
                returnedInfo: returnedInfo ? {
                    return_ref: returnedInfo.return_ref || `RTN-${returnedInfo.id}`,
                    quantity: Number(returnedInfo.quantity || 0),
                    created_at: returnedInfo.created_at
                } : null
            };
        }),
        subtotal: Number(order.subtotal) || 0,
        shipping: Number(order.shipping_cost) || 0,
        discount: Number(order.discount_amount) || 0,
        total: Number(order.total_amount) || 0
    };
}
