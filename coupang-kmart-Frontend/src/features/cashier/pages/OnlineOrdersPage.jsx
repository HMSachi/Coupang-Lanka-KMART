import React, { useState, useEffect } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import {
    Search, Filter, Eye, ShoppingCart, Clock, CheckCircle2,
    XCircle, Truck, Package, CreditCard, FileText, Printer, ChevronRight,
    MapPin, Phone, Mail, User as UserIcon
} from 'lucide-react';
import logo from '../../../assets/logo.jpeg';
import '../styles/online-orders.css';

const OnlineOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [showPrintPreview, setShowPrintPreview] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrderDetails = async (orderId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setSelectedOrder(data);
        } catch (error) {
            console.error('Error fetching order details:', error);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const cashierName = user.name || 'Unknown Cashier';

            const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    cashier_name: cashierName
                })
            });

            if (!response.ok) throw new Error('Failed to update status');
            const updatedOrder = await response.json();

            // Update local state
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatedOrder } : o));
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, ...updatedOrder }));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusStyle = (status) => {
        const s = status ? status.toUpperCase() : '';
        switch (s) {
            case 'PENDING': return 'status-pending';
            case 'PROCESSING': return 'status-processing';
            case 'READY TO DELIVERY': return 'status-ready';
            case 'ON DELIVERY': return 'status-shipped';
            case 'DELIVERED': return 'status-delivered';
            case 'CASH RECEIVED': return 'status-cash';
            case 'CANCELLED': return 'status-cancelled';
            default: return 'status-default';
        }
    };

    const filteredOrders = orders.filter(order => {
        // Filter out physical/POS orders (which typically start with HOLD-)
        const isPhysical = (order.order_id || '').startsWith('HOLD-');
        if (isPhysical) return false;

        const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
        const matchesSearch = (order.order_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <POSLayout>
            <div className="online-orders-container">
                {/* Header Section */}
                <div className="orders-header">
                    <div className="header-info">
                        <h2 className="header-title">Incoming Web Orders</h2>
                        <p className="header-subtitle">Manage and fulfill orders from Coupang Lanka website</p>
                    </div>

                    <div className="header-actions">
                        <div className="search-box">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Order ID or Customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="filter-group">
                            <Filter size={16} className="filter-icon" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="ALL">All Orders</option>
                                <option value="PENDING">Pending</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="READY TO DELIVERY">Ready to Delivery</option>
                                <option value="ON DELIVERY">On Delivery</option>
                                <option value="DELIVERED">Delivered</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                        <button className="refresh-btn" onClick={fetchOrders}>
                            Refresh List
                        </button>
                    </div>
                </div>

                {/* Orders Content */}
                <div className="orders-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Fetching orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="empty-state">
                            <ShoppingCart size={48} className="empty-icon" />
                            <h3>No Orders Found</h3>
                            <p>There are no online orders matching your criteria at the moment.</p>
                        </div>
                    ) : (
                        <div className="orders-grid">
                            <table className="orders-table">
                                <thead>
                                    <tr>
                                        <th>Order Information</th>
                                        <th>Customer Detail</th>
                                        <th>Address</th>
                                        <th>Total Value</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr key={order.id} className="order-row">
                                            <td>
                                                <div className="order-id-cell">
                                                    <span className="order-ref">#{order.order_id}</span>
                                                    <span className="order-date"><Clock size={12} /> {new Date(order.created_at).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="customer-cell">
                                                    <span className="customer-name">{order.customer_name}</span>
                                                    <span className="customer-email">{order.customer_email}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="logistics-cell">
                                                    <span className="city-tag">{order.city}</span>
                                                    <span className="delivery-date">Est. {order.requested_delivery_date}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="order-total">LKR {parseFloat(order.total_amount).toLocaleString()}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className={`status-badge ${getStatusStyle(order.status)}`}>{order.status?.toLowerCase()}</span>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    className="view-btn"
                                                    onClick={() => fetchOrderDetails(order.id)}
                                                >
                                                    <Eye size={16} /> View & Fulfill
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* High-Fidelity Order Report Modal */}
                {selectedOrder && (
                    <div className="order-modal-overlay">
                        <div className="order-modal-card">
                            {/* Modal Header */}
                            <div className="modal-header">
                                <div className="modal-header-main">
                                    <div className="header-title-box">
                                        <FileText className="header-icon" />
                                        <h3>Web Order Details</h3>
                                    </div>
                                    <p className="transaction-id">Order Reference: #{selectedOrder.order_id}</p>
                                </div>
                                <div className="modal-header-actions">
                                    <button
                                        className="print-btn"
                                        onClick={() => setShowPrintPreview(true)}
                                    >
                                        <Printer size={16} /> Print Invoice
                                    </button>
                                    <button className="close-modal" onClick={() => setSelectedOrder(null)}>×</button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="modal-body">
                                {/* Top Cards Info */}
                                <div className="info-cards-grid">
                                    <div className="info-card">
                                        <div className="card-header">
                                            <UserIcon size={14} /> <span>Customer Information</span>
                                        </div>
                                        <div className="card-content">
                                            <div className="info-row">
                                                <label>Customer Name</label>
                                                <span>{selectedOrder.customer_name}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Email Address</label>
                                                <span>{selectedOrder.customer_email}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Phone Number</label>
                                                <span>{selectedOrder.customer_phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="info-card">
                                        <div className="card-header">
                                            <Truck size={14} /> <span>Address Details</span>
                                        </div>
                                        <div className="card-content">
                                            <div className="info-row">
                                                <label>Delivery Address</label>
                                                <span className="address-text">{selectedOrder.address}, {selectedOrder.city}, {selectedOrder.postal_code}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Delivery Date</label>
                                                <span>{selectedOrder.delivery_date ? new Date(selectedOrder.delivery_date).toLocaleDateString() : 'N/A'} (DELIVERY)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Workflow Status Bar */}
                                <div className="status-flow-bar">
                                    <div className="flow-item">
                                        <label>Workflow State</label>
                                        <div className={`status-pill ${getStatusStyle(selectedOrder.status)}`}>
                                            {selectedOrder.status?.toLowerCase()}
                                        </div>
                                    </div>
                                    <div className="flow-divider"></div>
                                    <div className="flow-item">
                                        <label>Received Date</label>
                                        <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="flow-divider"></div>
                                    <div className="flow-item">
                                        <label>Payment Method</label>
                                        <span className="payment-method-tag">
                                            <CreditCard size={14} /> {selectedOrder.payment_method}
                                        </span>
                                    </div>
                                </div>

                                {/* Fulfullment Audit Trail */}
                                <div className="audit-trail-section">
                                    <div className="section-header">
                                        <UserIcon size={14} /> <span>Fulfillment Team</span>
                                    </div>
                                    <div className="audit-grid">
                                        <div className="audit-node">
                                            <label>Approved By</label>
                                            <span>{selectedOrder.approved_by || 'Waiting...'}</span>
                                        </div>
                                        <div className="audit-node">
                                            <label>Processed By</label>
                                            <span>{selectedOrder.processed_by || 'Waiting...'}</span>
                                        </div>
                                        <div className="audit-node">
                                            <label>Handed Over By</label>
                                            <span>{selectedOrder.shipped_by || 'Waiting...'}</span>
                                        </div>
                                        <div className="audit-node">
                                            <label>Delivered By</label>
                                            <span>{selectedOrder.delivered_by || 'Waiting...'}</span>
                                        </div>
                                        <div className="audit-node">
                                            <label>Cash Collected By</label>
                                            <span>{selectedOrder.cash_received_by || 'Waiting...'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items Section */}
                                <div className="bill-lading-section">
                                    <div className="section-header">
                                        <Package size={16} /> <span>Order Items</span>
                                    </div>
                                    <table className="lading-table">
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th className="text-center">Qty</th>
                                                <th className="text-right">Rate</th>
                                                <th className="text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items && selectedOrder.items.map((item, idx) => {
                                                const getImageUrl = (url) => {
                                                    if (!url) return '';
                                                    if (url.startsWith('http')) return url;
                                                    const cleanPath = url.startsWith('/') ? url : `/${url}`;
                                                    if (cleanPath.startsWith('/uploads')) {
                                                        return `http://localhost:5000${cleanPath}`;
                                                    }
                                                    return `http://localhost:5000/uploads${cleanPath}`;
                                                };

                                                return (
                                                    <tr key={idx}>
                                                        <td>
                                                            <div className="lading-item-box">
                                                                <span className="item-sku">#{item.product_id || 'WEB'}</span>
                                                                <div className="item-img-box">
                                                                    <img src={getImageUrl(item.image_url)} alt="" />
                                                                </div>
                                                                <span className="item-name">{item.product_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-center font-medium">{item.quantity}</td>
                                                        <td className="text-right rate-text">LKR {parseFloat(item.price).toLocaleString()}</td>
                                                        <td className="text-right font-bold">LKR {(item.price * item.quantity).toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="subtotal-row">
                                                <td colSpan="3">Subtotal</td>
                                                <td>LKR {parseFloat(selectedOrder.subtotal).toLocaleString()}</td>
                                            </tr>
                                            <tr className="shipping-row">
                                                <td colSpan="3">Delivery Charge</td>
                                                <td>LKR {parseFloat(selectedOrder.shipping_cost).toLocaleString()}</td>
                                            </tr>
                                            <tr className="grand-total-row">
                                                <td colSpan="3">Order Total</td>
                                                <td className="total-amount-large">LKR {parseFloat(selectedOrder.total_amount).toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Modal Footer (Workflow Actions) */}
                            <div className="modal-footer">
                                {(() => {
                                    const currentStatus = (selectedOrder.status || '').toUpperCase();
                                    return (
                                        <>
                                            {currentStatus === 'PENDING' && (
                                                <button
                                                    className="btn-reject"
                                                    onClick={() => {
                                                        handleStatusUpdate(selectedOrder.id, 'CANCELLED');
                                                        setSelectedOrder(null);
                                                    }}
                                                >
                                                    Reject Order
                                                </button>
                                            )}

                                            {currentStatus === 'PENDING' && (
                                                <button
                                                    className="btn-primary btn-approve"
                                                    onClick={() => handleStatusUpdate(selectedOrder.id, 'PROCESSING')}
                                                >
                                                    Approve Order
                                                </button>
                                            )}

                                            {currentStatus === 'PROCESSING' && (
                                                <button
                                                    className="btn-primary btn-processing"
                                                    onClick={() => handleStatusUpdate(selectedOrder.id, 'READY TO DELIVERY')}
                                                >
                                                    Complete Processing
                                                </button>
                                            )}

                                            {currentStatus === 'READY TO DELIVERY' && (
                                                <button
                                                    className="btn-primary btn-deliver"
                                                    onClick={() => handleStatusUpdate(selectedOrder.id, 'ON DELIVERY')}
                                                >
                                                    Handover to Delivery
                                                </button>
                                            )}

                                            {currentStatus === 'ON DELIVERY' && (
                                                <button
                                                    className="btn-primary btn-delivered"
                                                    onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERED')}
                                                >
                                                    Confirm Delivered
                                                </button>
                                            )}
                                            {currentStatus === 'DELIVERED' && (
                                                <button
                                                    className="btn-primary btn-cash-received"
                                                    onClick={async () => {
                                                        const token = localStorage.getItem('token');
                                                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                                                        const response = await fetch(`http://localhost:5000/api/orders/${selectedOrder.id}/status`, {
                                                            method: 'PUT',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({
                                                                status: 'CASH RECEIVED',
                                                                cashier_name: user.name || 'Unknown Cashier'
                                                            })
                                                        });
                                                        if (response.ok) {
                                                            const data = await response.json();
                                                            alert(`✅ CASH RECEIVED CONFIRMED!\n\nOrder #${selectedOrder.order_id} cash is received.\nBatch Number: ${data.batch_number}\n\nPlease add this batch in the "Cash In" section of your EOD session to update the system balance.`);
                                                            handleStatusUpdate(selectedOrder.id, 'CASH RECEIVED');
                                                        }
                                                    }}
                                                >
                                                    <CreditCard size={16} /> Confirm Cash Received
                                                </button>
                                            )}
                                        </>
                                    );
                                })()}

                                <button className="btn-close" onClick={() => setSelectedOrder(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Print Preview Modal */}
                {showPrintPreview && selectedOrder && (
                    <div className="print-preview-overlay">
                        <div className="print-preview-card">
                            <div className="preview-header">
                                <h3>Invoice Preview</h3>
                                <div className="preview-actions">
                                    <button className="btn-print-now" onClick={() => window.print()}>
                                        <Printer size={16} /> Print Now
                                    </button>
                                    <button className="btn-close-preview" onClick={() => setShowPrintPreview(false)}>×</button>
                                </div>
                            </div>

                            <div className="print-paper-container">
                                <div className="official-invoice-paper" id="printable-invoice">
                                    {/* Header */}
                                    <div className="inv-header">
                                        <div className="inv-logo">
                                            <img src={logo} alt="Coupang Kmart" />
                                        </div>
                                        <h1>COUPANG KMART</h1>
                                        <p className="inv-branch">Main Showroom & Fulfillment Center</p>
                                        <p>No 125, Galle Road, Colombo 03</p>
                                        <p>Hotline: +94 11 234 5678 | +94 77 123 4567</p>
                                        <div className="inv-type-badge">CASH ON DELIVERY INVOICE</div>
                                    </div>

                                    <div className="inv-meta-grid-print">
                                        <div className="meta-col">
                                            <div className="meta-item">
                                                <label>Invoice No:</label>
                                                <span>#{selectedOrder.order_id}</span>
                                            </div>
                                            <div className="meta-item">
                                                <label>Date:</label>
                                                <span>{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="meta-col">
                                            <div className="meta-item">
                                                <label>Customer:</label>
                                                <span>{selectedOrder.customer_name}</span>
                                            </div>
                                            <div className="meta-item">
                                                <label>Method:</label>
                                                <span className="uppercase">{selectedOrder.payment_method}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="inv-separator"></div>

                                    <div className="inv-items-table-print">
                                        <div className="inv-table-head">
                                            <span className="col-desc">Description</span>
                                            <span className="col-qty">Qty</span>
                                            <span className="col-price">Rate</span>
                                            <span className="col-total">Amount</span>
                                        </div>
                                        {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="inv-table-row">
                                                <span className="col-desc">{item.product_name}</span>
                                                <span className="col-qty">{item.quantity}</span>
                                                <span className="col-price">{parseFloat(item.price).toLocaleString()}</span>
                                                <span className="col-total">{(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="inv-separator"></div>

                                    <div className="inv-summary-print">
                                        <div className="sum-row">
                                            <span>Order Subtotal</span>
                                            <span>LKR {parseFloat(selectedOrder.subtotal).toLocaleString()}</span>
                                        </div>
                                        <div className="sum-row">
                                            <span>Delivery / Address</span>
                                            <span>LKR {parseFloat(selectedOrder.shipping_cost).toLocaleString()}</span>
                                        </div>
                                        <div className="sum-row total-row">
                                            <span>NET PAYABLE (COD)</span>
                                            <span>LKR {parseFloat(selectedOrder.total_amount).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Print Audit */}
                                    <div className="inv-audit-print">
                                        <div className="audit-row">
                                            <span>Approved: {selectedOrder.approved_by || '-'}</span>
                                            <span>Processed: {selectedOrder.processed_by || '-'}</span>
                                        </div>
                                        <div className="audit-row">
                                            <span>Shipped: {selectedOrder.shipped_by || '-'}</span>
                                            <span>Delivered: {selectedOrder.delivered_by || '-'}</span>
                                        </div>
                                        <div className="audit-row">
                                            <span>Cash Settled: {selectedOrder.cash_received_by || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="inv-cod-notice">
                                        <p><strong>COD ALERT:</strong> Please collect the total amount of <strong>LKR {parseFloat(selectedOrder.total_amount).toLocaleString()}</strong> upon delivery.</p>
                                    </div>

                                    <div className="inv-footer-print">
                                        <div className="barcode-box">
                                            <div className="barcode-line"></div>
                                            <p>#{selectedOrder.order_id}</p>
                                        </div>
                                        <p className="thank-you">Thank you for shopping with Coupang Kmart!</p>
                                        <p className="website">www.coupangkmart.lk</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </POSLayout>
    );
};

export default OnlineOrdersPage;
