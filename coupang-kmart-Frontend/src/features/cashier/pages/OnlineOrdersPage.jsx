import React, { useState, useEffect } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import {
    Search, Filter, Eye, ShoppingCart, Clock, CheckCircle2,
    XCircle, Truck, Package, CreditCard, FileText, Printer, ChevronRight,
    MapPin, Phone, Mail, User as UserIcon
} from 'lucide-react';
import '../styles/online-orders.css';

const OnlineOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

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
            await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            // Update local state
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'PROCESSING': return 'status-processing';
            case 'SHIPPED': return 'status-shipped';
            case 'DELIVERED': return 'status-delivered';
            case 'CANCELLED': return 'status-cancelled';
            default: return 'status-default';
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
        const matchesSearch = order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <POSLayout>
            <div className="online-orders-container">
                {/* Enhanced Header Section */}
                <div className="orders-section-header">
                    <div className="header-content">
                        <div className="header-badge">
                            <ShoppingCart size={24} />
                        </div>
                        <div className="header-text">
                            <h2 className="section-title">Online Orders Management</h2>
                            <p className="section-subtitle">Track and manage web-originated orders in real-time</p>
                        </div>
                        <div className="header-stats">
                            <div className="stat-item">
                                <span className="stat-number">{orders.length}</span>
                                <span className="stat-label">Total Orders</span>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <span className="stat-number">{orders.filter(o => o.status === 'PENDING').length}</span>
                                <span className="stat-label">Pending</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Controls Bar */}
                <div className="orders-header-actions-bar">
                    <div className="header-actions">
                        <div className="search-box">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search by Order ID or Customer name..."
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
                                <option value="SHIPPED">Shipped</option>
                                <option value="DELIVERED">Delivered</option>
                            </select>
                        </div>
                        <button className="refresh-btn" onClick={fetchOrders}>
                            <span className="refresh-icon">🔄</span> Refresh List
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
                                        <th>Logistics</th>
                                        <th>Total Value</th>
                                        <th>Status</th>
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
                                            <td>
                                                <span className={`status-badge ${getStatusStyle(order.status)}`}>{order.status}</span>
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
                                        <h3>Official Web Order Report</h3>
                                    </div>
                                    <p className="transaction-id">Transaction Ref: #{selectedOrder.order_id}</p>
                                </div>
                                <div className="modal-header-actions">
                                    <button className="print-btn">
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
                                            <UserIcon size={14} /> <span>Client Profile</span>
                                        </div>
                                        <div className="card-content">
                                            <div className="info-row">
                                                <label>Legal Name</label>
                                                <span>{selectedOrder.customer_name}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Registered Email</label>
                                                <span>{selectedOrder.customer_email}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Cellular</label>
                                                <span>{selectedOrder.customer_phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="info-card">
                                        <div className="card-header">
                                            <Truck size={14} /> <span>Delivery Details</span>
                                        </div>
                                        <div className="card-content">
                                            <div className="info-row">
                                                <label>Destination</label>
                                                <span className="address-text">{selectedOrder.address}, {selectedOrder.city}, {selectedOrder.postal_code}</span>
                                            </div>
                                            <div className="info-row">
                                                <label>Scheduled Date</label>
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
                                            {selectedOrder.status}
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

                                {/* Bill of Lading Section - Enhanced */}
                                <div className="bill-lading-section">
                                    <div className="section-header-enhanced">
                                        <div className="section-header-badge">
                                            <Package size={18} />
                                        </div>
                                        <div>
                                            <h4>Order Summary</h4>
                                            <p className="section-subtitle">Review all items in this order</p>
                                        </div>
                                    </div>

                                    <div className="items-container">
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
                                                <div key={idx} className="item-card-enhanced">
                                                    <div className="item-card-left">
                                                        <div className="item-img-box-enhanced">
                                                            <img src={getImageUrl(item.image_url)} alt={item.product_name} />
                                                        </div>
                                                        <div className="item-details">
                                                            <span className="item-sku-enhanced">#{item.product_id || 'WEB'}</span>
                                                            <h5 className="item-name-enhanced">{item.product_name}</h5>
                                                            <span className="item-unit-price">LKR {parseFloat(item.price).toLocaleString()} per unit</span>
                                                        </div>
                                                    </div>
                                                    <div className="item-card-right">
                                                        <div className="quantity-box">
                                                            <span className="qty-label">Qty</span>
                                                            <span className="qty-value">{item.quantity}</span>
                                                        </div>
                                                        <div className="amount-box">
                                                            <span className="amount-label">Amount</span>
                                                            <span className="amount-value">LKR {(item.price * item.quantity).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="summary-cards-grid">
                                        <div className="summary-card subtotal-card">
                                            <span className="summary-label">Sub-Total</span>
                                            <span className="summary-value">LKR {parseFloat(selectedOrder.subtotal).toLocaleString()}</span>
                                        </div>
                                        <div className="summary-card shipping-card">
                                            <span className="summary-label">Shipping & Handling</span>
                                            <span className="summary-value">LKR {parseFloat(selectedOrder.shipping_cost).toLocaleString()}</span>
                                        </div>
                                        <div className="summary-card total-card">
                                            <span className="summary-label">Order Total</span>
                                            <span className="summary-value-large">LKR {parseFloat(selectedOrder.total_amount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer (Workflow Actions) */}
                            <div className="modal-footer">
                                {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'DELIVERED' && (
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

                                {selectedOrder.status === 'PENDING' && (
                                    <button
                                        className="btn-primary btn-approve"
                                        onClick={() => handleStatusUpdate(selectedOrder.id, 'PROCESSING')}
                                    >
                                        Approve Order
                                    </button>
                                )}

                                {selectedOrder.status === 'PROCESSING' && (
                                    <button
                                        className="btn-primary btn-processing"
                                        onClick={() => handleStatusUpdate(selectedOrder.id, 'SHIPPED')}
                                    >
                                        Complete Processing
                                    </button>
                                )}

                                {selectedOrder.status === 'SHIPPED' && (
                                    <button
                                        className="btn-primary btn-deliver"
                                        onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERED')}
                                    >
                                        Mark as Delivered
                                    </button>
                                )}

                                <button className="btn-close" onClick={() => setSelectedOrder(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </POSLayout>
    );
};

export default OnlineOrdersPage;
