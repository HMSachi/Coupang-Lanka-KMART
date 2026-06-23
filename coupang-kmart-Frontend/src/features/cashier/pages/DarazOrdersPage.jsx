import React, { useState, useEffect } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import {
    Search, Filter, Plus, Edit2, Check, X, ShieldAlert,
    ShoppingBag, AlertCircle, CheckCircle, XCircle, DollarSign,
    Calendar, TrendingUp, BarChart2, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/daraz-orders.css';
import { API_BASE_URL } from '../../../config';

export default function DarazOrdersPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        total_orders: 0,
        pending_orders: 0,
        delivered_orders: 0,
        cancelled_orders: 0,
        pending_payments: 0.00,
        received_payments: 0.00,
        total_sales: 0.00,
        today_orders: 0,
        this_month_sales: 0.00
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterPayment, setFilterPayment] = useState('ALL');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Form states
    const [formOrder, setFormOrder] = useState({
        daraz_order_id: '',
        customer_name: '',
        customer_phone: '',
        total_amount: 0,
        status: 'New',
        payment_status: 'pending',
        tracking_number: '',
        remarks: '',
        order_date: new Date().toISOString().slice(0, 10),
        delivery_address: '',
        product_name: '',
        quantity: 1,
        unit_price: 0,
        delivery_fee: 0,
        discount: 0,
        payment_method: 'Cash on Delivery',
        items: [{ product_name: '', quantity: 1, unit_price: 0 }]
    });

    const [selectedOrder, setSelectedOrder] = useState(null);
    const isLocked = isEditModalOpen && formOrder.status?.toLowerCase() !== 'new';

    useEffect(() => {
        fetchOrdersAndStats();
    }, [searchQuery, filterStatus, filterPayment]);

    useEffect(() => {
        const reopen = localStorage.getItem('daraz_modal_reopen') === 'true';
        if (reopen) {
            localStorage.removeItem('daraz_modal_reopen');
            const pendingStr = localStorage.getItem('daraz_pending_order');
            if (pendingStr) {
                try {
                    const pending = JSON.parse(pendingStr);
                    let parsedItems = pending.items || [];
                    if (!Array.isArray(parsedItems) && pending.product_name) {
                        parsedItems = [{
                            product_name: pending.product_name,
                            quantity: parseInt(pending.quantity) || 1,
                            unit_price: parseFloat(pending.unit_price) || 0
                        }];
                    }
                    if (parsedItems.length === 0) {
                        parsedItems = [{ product_name: '', quantity: 1, unit_price: 0 }];
                    }

                    setFormOrder({
                        daraz_order_id: pending.daraz_order_id || '',
                        customer_name: pending.customer_name || '',
                        customer_phone: pending.customer_phone || '',
                        total_amount: parseFloat(pending.total_amount) || 0,
                        status: pending.status || 'New',
                        payment_status: pending.payment_status || 'pending',
                        tracking_number: pending.tracking_number || '',
                        remarks: pending.remarks || '',
                        order_date: pending.order_date || new Date().toISOString().slice(0, 10),
                        delivery_address: pending.delivery_address || '',
                        product_name: pending.product_name || '',
                        quantity: pending.quantity !== undefined ? parseInt(pending.quantity) : 1,
                        unit_price: pending.unit_price !== undefined ? parseFloat(pending.unit_price) : 0,
                        delivery_fee: pending.delivery_fee !== undefined ? parseFloat(pending.delivery_fee) : 0,
                        discount: pending.discount !== undefined ? parseFloat(pending.discount) : 0,
                        payment_method: pending.payment_method || 'Cash on Delivery',
                        items: parsedItems
                    });

                    if (pending.edit_mode_id) {
                        setSelectedOrder({ id: pending.edit_mode_id, daraz_order_id: pending.daraz_order_id });
                        setIsEditModalOpen(true);
                    } else {
                        setIsAddModalOpen(true);
                    }
                } catch (err) {
                    console.error('Error parsing pending order:', err);
                }
                localStorage.removeItem('daraz_pending_order');
            }
        }
    }, []);

    const startSelectingItems = () => {
        const pendingData = {
            ...formOrder,
            edit_mode_id: selectedOrder ? selectedOrder.id : null
        };
        localStorage.setItem('daraz_pending_order', JSON.stringify(pendingData));
        localStorage.setItem('is_daraz_select', 'true');
        
        window.dispatchEvent(new Event('darazSelectModeChanged'));
        
        // Populate current non-empty items back into the POS cart
        const currentCart = (formOrder.items || []).filter(item => item.product_name.trim() !== '').map((item, idx) => ({
            id: item.id || `manual-${idx}-${Date.now()}`,
            name: item.product_name,
            qty: parseInt(item.quantity) || 1,
            price: parseFloat(item.unit_price) || 0
        }));

        localStorage.setItem('pos_cart', JSON.stringify(currentCart));
        window.dispatchEvent(new Event('cartUpdated'));

        navigate('/pos');
    };

    const fetchOrdersAndStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Build query params
            const queryParams = new URLSearchParams();
            if (searchQuery) queryParams.append('search', searchQuery);
            if (filterStatus !== 'ALL') queryParams.append('status', filterStatus);
            if (filterPayment !== 'ALL') queryParams.append('payment_status', filterPayment);

            const [ordersRes, statsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/daraz/orders?${queryParams.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/daraz/orders/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (ordersRes.ok) {
                const ordersData = await ordersRes.json();
                setOrders(ordersData);
            }
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }
        } catch (error) {
            console.error('Error fetching Daraz data:', error);
        } finally {
            setLoading(false);
        }
    };

    const recalculateOrderTotals = (items, deliveryFee, discount) => {
        const subtotal = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0);
        
        let legacyQty = 1;
        let legacyPrice = subtotal;
        let legacyName = '';

        if (items.length === 1) {
            legacyQty = parseInt(items[0].quantity) || 1;
            legacyPrice = parseFloat(items[0].unit_price) || 0;
            legacyName = items[0].product_name || '';
        } else if (items.length > 1) {
            legacyQty = 1;
            legacyPrice = subtotal;
            legacyName = items.map(item => `${item.quantity}x ${item.product_name}`).join(', ');
        }

        const fee = parseFloat(deliveryFee) || 0;
        const disc = parseFloat(discount) || 0;
        const total = subtotal + fee - disc;

        return {
            quantity: legacyQty,
            unit_price: legacyPrice,
            product_name: legacyName,
            total_amount: parseFloat(total.toFixed(2))
        };
    };

    const handleItemFieldChange = (index, field, value) => {
        setFormOrder(prev => {
            const updatedItems = prev.items.map((item, idx) => 
                idx === index ? { ...item, [field]: value } : item
            );
            const totals = recalculateOrderTotals(updatedItems, prev.delivery_fee, prev.discount);
            return {
                ...prev,
                items: updatedItems,
                ...totals
            };
        });
    };

    const handleRemoveItemRow = (index) => {
        setFormOrder(prev => {
            const updatedItems = prev.items.filter((_, idx) => idx !== index);
            const totals = recalculateOrderTotals(updatedItems, prev.delivery_fee, prev.discount);
            return {
                ...prev,
                items: updatedItems,
                ...totals
            };
        });
    };

    const handleAddManualItemRow = () => {
        setFormOrder(prev => {
            const updatedItems = [...prev.items, { product_name: '', quantity: 1, unit_price: 0 }];
            const totals = recalculateOrderTotals(updatedItems, prev.delivery_fee, prev.discount);
            return {
                ...prev,
                items: updatedItems,
                ...totals
            };
        });
    };

    const handleFieldChange = (field, value) => {
        setFormOrder(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'delivery_fee' || field === 'discount') {
                const totals = recalculateOrderTotals(prev.items || [], field === 'delivery_fee' ? value : prev.delivery_fee, field === 'discount' ? value : prev.discount);
                return {
                    ...updated,
                    ...totals
                };
            }
            return updated;
        });
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        if (!formOrder.daraz_order_id.trim()) return alert('Daraz Order ID is required');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/daraz/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formOrder,
                    quantity: parseInt(formOrder.quantity) || 1,
                    unit_price: parseFloat(formOrder.unit_price) || 0,
                    delivery_fee: parseFloat(formOrder.delivery_fee) || 0,
                    discount: parseFloat(formOrder.discount) || 0,
                    total_amount: parseFloat(formOrder.total_amount),
                    items: formOrder.items
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create order');
            }

            // Sync with local shift session if payment was marked as received at creation time
            if (formOrder.payment_status === 'received') {
                syncWithLocalShift(formOrder.daraz_order_id, parseFloat(formOrder.total_amount));
            }

            setIsAddModalOpen(false);
            resetForm();
            fetchOrdersAndStats();
            alert('Daraz Order logged successfully');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleUpdateOrder = async (e, statusOverride) => {
        if (e) e.preventDefault();
        if (!selectedOrder) return;

        const finalStatus = statusOverride || formOrder.status;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/daraz/orders/${selectedOrder.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formOrder,
                    status: finalStatus,
                    quantity: parseInt(formOrder.quantity) || 1,
                    unit_price: parseFloat(formOrder.unit_price) || 0,
                    delivery_fee: parseFloat(formOrder.delivery_fee) || 0,
                    discount: parseFloat(formOrder.discount) || 0,
                    total_amount: parseFloat(formOrder.total_amount),
                    items: formOrder.items
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update order');

            // If status was changed from pending to received, we should sync shift drawer locally as well
            if (formOrder.payment_status === 'received' && selectedOrder.payment_status !== 'received') {
                syncWithLocalShift(formOrder.daraz_order_id, parseFloat(formOrder.total_amount));
            }

            setIsEditModalOpen(false);
            resetForm();
            fetchOrdersAndStats();
            alert('Daraz Order updated successfully');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleQuickStatusUpdate = async (newStatus) => {
        if (!selectedOrder) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/daraz/orders/${selectedOrder.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update status');

            setIsEditModalOpen(false);
            resetForm();
            fetchOrdersAndStats();
            alert(`Order status updated to ${newStatus} successfully`);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleQuickPaymentUpdate = async () => {
        if (!selectedOrder) return;
        if (!window.confirm(`Mark payment for Order #${formOrder.daraz_order_id} as Received? This will log a cash transaction inside the POS.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/daraz/orders/${selectedOrder.id}/payment`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ payment_status: 'received' })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update payment status');

            // Sync with local shift session
            syncWithLocalShift(formOrder.daraz_order_id, parseFloat(formOrder.total_amount));

            setFormOrder(prev => ({ ...prev, payment_status: 'received' }));
            fetchOrdersAndStats();
            alert('Payment successfully marked as received and registered in cash drawer.');
        } catch (err) {
            alert(err.message);
        }
    };

    const handleMarkPaymentReceived = async (order) => {
        if (!window.confirm(`Mark payment for Order #${order.daraz_order_id} as Received? This will log a cash transaction inside the POS.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/daraz/orders/${order.id}/payment`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ payment_status: 'received' })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to update payment status');

            // Sync with local shift session
            syncWithLocalShift(order.daraz_order_id, parseFloat(order.total_amount));

            fetchOrdersAndStats();
            alert('Payment successfully marked as received and registered in cash drawer.');
        } catch (err) {
            alert(err.message);
        }
    };

    const syncWithLocalShift = (darazOrderId, amount) => {
        const activeSession = localStorage.getItem('active_session');
        if (activeSession) {
            try {
                const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
                logs.push({
                    id: `DARAZ_IN_${Date.now()}`,
                    type: 'CASH_IN',
                    amount: amount,
                    reason: `Daraz Settlement for Order #${darazOrderId}`,
                    batch: `DARAZ-${darazOrderId}`,
                    timestamp: new Date().toISOString(),
                    order_id: darazOrderId
                });
                localStorage.setItem('cash_drawer_logs', JSON.stringify(logs));
                window.dispatchEvent(new Event('refreshCashMetrics'));
            } catch (err) {
                console.error('Error syncing shift log:', err);
            }
        }
    };

    const openEditModal = (order) => {
        setSelectedOrder(order);
        
        let parsedItems = [];
        if (order.items) {
            try {
                parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            } catch (e) {
                console.error("Failed to parse items:", e);
            }
        }
        if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
            parsedItems = [{
                product_name: order.product_name || '',
                quantity: order.quantity !== null && order.quantity !== undefined ? parseInt(order.quantity) : 1,
                unit_price: order.unit_price !== null && order.unit_price !== undefined ? parseFloat(order.unit_price) : 0
            }];
        }

        setFormOrder({
            daraz_order_id: order.daraz_order_id,
            customer_name: order.customer_name || '',
            customer_phone: order.customer_phone || '',
            total_amount: parseFloat(order.total_amount) || 0,
            status: order.status || 'New',
            payment_status: order.payment_status || 'pending',
            tracking_number: order.tracking_number || '',
            remarks: order.remarks || '',
            order_date: order.order_date ? new Date(order.order_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            delivery_address: order.delivery_address || '',
            product_name: order.product_name || '',
            quantity: order.quantity !== null && order.quantity !== undefined ? parseInt(order.quantity) : 1,
            unit_price: order.unit_price !== null && order.unit_price !== undefined ? parseFloat(order.unit_price) : 0,
            delivery_fee: order.delivery_fee !== null && order.delivery_fee !== undefined ? parseFloat(order.delivery_fee) : 0,
            discount: order.discount !== null && order.discount !== undefined ? parseFloat(order.discount) : 0,
            payment_method: order.payment_method || 'Cash on Delivery',
            items: parsedItems
        });
        setIsEditModalOpen(true);
    };

    const resetForm = () => {
        setFormOrder({
            daraz_order_id: '',
            customer_name: '',
            customer_phone: '',
            total_amount: 0,
            status: 'New',
            payment_status: 'pending',
            tracking_number: '',
            remarks: '',
            order_date: new Date().toISOString().slice(0, 10),
            delivery_address: '',
            product_name: '',
            quantity: 1,
            unit_price: 0,
            delivery_fee: 0,
            discount: 0,
            payment_method: 'Cash on Delivery',
            items: [{ product_name: '', quantity: 1, unit_price: 0 }]
        });
        setSelectedOrder(null);
    };

    return (
        <POSLayout>
            <div className="daraz-orders-container">
                {/* Header */}
                <div className="daraz-header">
                    <div className="daraz-header-info">
                        <h2>Daraz Order Management</h2>
                        <p>Manually record, track, and settle Daraz orders and payments.</p>
                    </div>
                    <button onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="daraz-btn-primary">
                        <Plus size={18} /> Add Daraz Orders
                    </button>
                </div>

                {/* Dashboard stats cards */}
                <div className="daraz-metrics-grid">
                    <div className="daraz-metric-card">
                        <div className="daraz-metric-header">
                            <span>Total Daraz Orders</span>
                            <div className="daraz-metric-icon tone-blue"><ShoppingBag size={16} /></div>
                        </div>
                        <div className="daraz-metric-value">{stats.total_orders}</div>
                        <div className="daraz-metric-meta">Logged orders</div>
                    </div>
                    <div className="daraz-metric-card">
                        <div className="daraz-metric-header">
                            <span>Pending Orders</span>
                            <div className="daraz-metric-icon tone-amber"><AlertCircle size={16} /></div>
                        </div>
                        <div className="daraz-metric-value">{stats.pending_orders}</div>
                        <div className="daraz-metric-meta">Awaiting completion</div>
                    </div>
                    <div className="daraz-metric-card">
                        <div className="daraz-metric-header">
                            <span>Delivered Orders</span>
                            <div className="daraz-metric-icon tone-green"><CheckCircle size={16} /></div>
                        </div>
                        <div className="daraz-metric-value">{stats.delivered_orders}</div>
                        <div className="daraz-metric-meta">Completed shipments</div>
                    </div>
                    <div className="daraz-metric-card">
                        <div className="daraz-metric-header">
                            <span>Cancelled Orders</span>
                            <div className="daraz-metric-icon tone-red"><XCircle size={16} /></div>
                        </div>
                        <div className="daraz-metric-value">{stats.cancelled_orders}</div>
                        <div className="daraz-metric-meta">Failed shipments</div>
                    </div>
                    <div className="daraz-metric-card">
                        <div className="daraz-metric-header">
                            <span>Pending Payments</span>
                            <div className="daraz-metric-icon tone-red"><DollarSign size={16} /></div>
                        </div>
                        <div className="daraz-metric-value">Rs. {Number(stats.pending_payments).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="daraz-metric-meta">Awaiting settlement</div>
                    </div>
                    <div className="daraz-metric-card">
                        <div className="daraz-metric-header">
                            <span>Received Payments</span>
                            <div className="daraz-metric-icon tone-green"><DollarSign size={16} /></div>
                        </div>
                        <div className="daraz-metric-value">Rs. {Number(stats.received_payments).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="daraz-metric-meta">Cash in Drawer</div>
                    </div>
                    <div className="daraz-metric-card">
                        <div className="daraz-metric-header">
                            <span>Total Daraz Sales</span>
                            <div className="daraz-metric-icon tone-purple"><TrendingUp size={16} /></div>
                        </div>
                        <div className="daraz-metric-value">Rs. {Number(stats.total_sales).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="daraz-metric-meta">Excluding Cancel/Return</div>
                    </div>
                    <div className="daraz-metric-card">
                        <div className="daraz-metric-header">
                            <span>Today's Daraz Orders</span>
                            <div className="daraz-metric-icon tone-blue"><Calendar size={16} /></div>
                        </div>
                        <div className="daraz-metric-value">{stats.today_orders}</div>
                        <div className="daraz-metric-meta">Placed today</div>
                    </div>
                    <div className="daraz-metric-card">
                        <div className="daraz-metric-header">
                            <span>This Month Sales</span>
                            <div className="daraz-metric-icon tone-purple"><BarChart2 size={16} /></div>
                        </div>
                        <div className="daraz-metric-value">Rs. {Number(stats.this_month_sales).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="daraz-metric-meta">This calendar month</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="daraz-filter-bar">
                    <div className="daraz-search-box">
                        <Search className="daraz-search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Order ID, Customer, Product, or Tracking..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select className="daraz-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="ALL">All Delivery Statuses</option>
                        <option value="NEW">New</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="PACKED">Packed</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="RETURNED">Returned</option>
                    </select>
                    <select className="daraz-select" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
                        <option value="ALL">All Payment Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="RECEIVED">Received</option>
                    </select>
                </div>

                {/* Orders directory */}
                <div className="daraz-table-card">
                    <div className="daraz-table-wrapper">
                        <table className="daraz-table">
                            <thead>
                                <tr>
                                    <th>Order Info</th>
                                    <th>Customer Info</th>
                                    <th>Product Details</th>
                                    <th>Financials</th>
                                    <th>Delivery Status</th>
                                    <th>Payment Status</th>
                                    <th>Tracking & Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7">
                                            <div className="daraz-empty-state">
                                                <AlertCircle size={40} className="daraz-empty-icon" />
                                                <p>No Daraz orders found matching current criteria.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map(order => (
                                        <tr key={order.id} onClick={() => openEditModal(order)}>
                                            <td className="daraz-order-id-cell">
                                                <div style={{ fontWeight: '800', color: '#ea580c' }}>{order.daraz_order_id}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                                                    Date: {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                    Logged: {new Date(order.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '700', color: '#000000' }}>{order.customer_name || 'Anonymous'}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#475569' }}>{order.customer_phone || 'No phone'}</div>
                                                {order.delivery_address && (
                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'normal', maxWidth: '180px', marginTop: '2px' }}>
                                                        {order.delivery_address}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {(() => {
                                                    let parsedItems = [];
                                                    if (order.items) {
                                                        try {
                                                            parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                                                        } catch (e) {
                                                            console.error("Failed to parse items:", e);
                                                        }
                                                    }
                                                    if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                                                        return (
                                                            <div className="daraz-table-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                {parsedItems.map((item, idx) => (
                                                                    <div key={idx} style={{ fontSize: '0.8rem', color: '#000000', lineHeight: '1.2' }}>
                                                                        <span style={{ fontWeight: '700' }}>{item.quantity}x</span> {item.product_name}
                                                                        <span style={{ fontSize: '0.7rem', color: '#475569', marginLeft: '4px' }}>
                                                                            (Rs. {Number(item.unit_price || 0).toLocaleString()})
                                                                        </span>
                                                                    </div>
                                                                 ))}
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <>
                                                            <div style={{ fontWeight: '600', color: '#000000' }}>{order.product_name || '-'}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                                                                Qty: {order.quantity || 1} × Rs. {Number(order.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '800', color: '#1e3a8a' }}>
                                                    Rs. {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '2px' }}>
                                                    Fee: Rs. {Number(order.delivery_fee || 0).toLocaleString()} | Disc: Rs. {Number(order.discount || 0).toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#ea580c', marginTop: '2px' }}>
                                                    {order.payment_method || 'Cash on Delivery'}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge-status ${order.status?.toLowerCase()}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge-payment ${order.payment_status?.toLowerCase()}`}>
                                                    {order.payment_status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontFamily: 'monospace', fontWeight: '600' }}>{order.tracking_number || '-'}</div>
                                                {order.remarks && (
                                                    <div style={{ fontSize: '0.7rem', color: '#475569', whiteSpace: 'normal', maxWidth: '150px', fontStyle: 'italic', marginTop: '2px' }}>
                                                        Notes: {order.remarks}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Modal */}
                {isAddModalOpen && (
                    <div className="daraz-modal-backdrop">
                        <div className="daraz-modal">
                            <div className="daraz-modal-header">
                                <h3>Add Daraz Orders</h3>
                                <button className="daraz-modal-close" onClick={() => setIsAddModalOpen(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateOrder} className="daraz-form">
                                {/* Section 1: Order Information */}
                                <div className="daraz-form-section">
                                    <h4 className="daraz-form-section-title">Order Information</h4>
                                    <div className="daraz-form-grid-3">
                                        <div className="daraz-form-group">
                                            <label>Daraz Order ID *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Enter official Daraz Order ID"
                                                value={formOrder.daraz_order_id}
                                                onChange={(e) => handleFieldChange('daraz_order_id', e.target.value)}
                                            />
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Order Date *</label>
                                            <input
                                                type="date"
                                                required
                                                value={formOrder.order_date}
                                                onChange={(e) => handleFieldChange('order_date', e.target.value)}
                                            />
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Tracking Number</label>
                                            <input
                                                type="text"
                                                placeholder="DEX/FBL Tracking ID"
                                                value={formOrder.tracking_number}
                                                onChange={(e) => handleFieldChange('tracking_number', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Customer Information */}
                                <div className="daraz-form-section">
                                    <h4 className="daraz-form-section-title">Customer Information</h4>
                                    <div className="daraz-form-grid-2">
                                        <div className="daraz-form-group">
                                            <label>Customer Name</label>
                                            <input
                                                type="text"
                                                placeholder="John Doe"
                                                value={formOrder.customer_name}
                                                onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Customer Phone Number</label>
                                            <input
                                                type="text"
                                                placeholder="077XXXXXXXX"
                                                value={formOrder.customer_phone}
                                                onChange={(e) => handleFieldChange('customer_phone', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="daraz-form-group" style={{ marginTop: '0.75rem' }}>
                                        <label>Delivery Address</label>
                                        <textarea
                                            placeholder="Enter complete shipping address..."
                                            value={formOrder.delivery_address}
                                            onChange={(e) => handleFieldChange('delivery_address', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Section 3: Product Information */}
                                <div className="daraz-form-section">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.375rem' }}>
                                        <h4 className="daraz-form-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Product Information</h4>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                type="button"
                                                onClick={startSelectingItems}
                                                className="daraz-btn-primary"
                                                style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    padding: '0.375rem 0.75rem',
                                                    borderRadius: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    height: 'auto'
                                                }}
                                            >
                                                <Plus size={12} /> Add Items to Order
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleAddManualItemRow}
                                                className="daraz-btn-secondary"
                                                style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    padding: '0.375rem 0.75rem',
                                                    borderRadius: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    height: 'auto',
                                                    backgroundColor: '#ffffff',
                                                    color: '#0f172a',
                                                    border: '1px solid #cbd5e1'
                                                }}
                                            >
                                                <Plus size={12} /> Add Manual Row
                                            </button>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div className="daraz-items-table-wrapper" style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                                        <table className="daraz-items-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                                    <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#475569', width: '50%' }}>Product Name / SKU *</th>
                                                    <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#475569', width: '15%' }}>Quantity *</th>
                                                    <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#475569', width: '20%' }}>Unit Price (LKR) *</th>
                                                    <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#475569', width: '10%', textAlign: 'right' }}>Total</th>
                                                    <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#475569', width: '5%', textAlign: 'center' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(formOrder.items || []).map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '0.375rem' }}>
                                                            <input
                                                                type="text"
                                                                required
                                                                placeholder="Enter product title or SKU"
                                                                value={item.product_name}
                                                                onChange={(e) => handleItemFieldChange(idx, 'product_name', e.target.value)}
                                                                style={{ width: '100%', padding: '0.375rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#000000' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '0.375rem' }}>
                                                            <input
                                                                type="number"
                                                                required
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemFieldChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                                style={{ width: '100%', padding: '0.375rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#000000' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '0.375rem' }}>
                                                            <input
                                                                type="number"
                                                                required
                                                                step="0.01"
                                                                min="0"
                                                                value={item.unit_price}
                                                                onChange={(e) => handleItemFieldChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                style={{ width: '100%', padding: '0.375rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#000000' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '0.375rem', fontSize: '0.875rem', fontWeight: '600', color: '#000000', textAlign: 'right' }}>
                                                            Rs. {((parseInt(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td style={{ padding: '0.375rem', textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                disabled={formOrder.items.length === 1}
                                                                onClick={() => handleRemoveItemRow(idx)}
                                                                style={{
                                                                    background: 'none',
                                                                    border: 'none',
                                                                    color: formOrder.items.length === 1 ? '#cbd5e1' : '#ef4444',
                                                                    cursor: formOrder.items.length === 1 ? 'not-allowed' : 'pointer',
                                                                    padding: '0.25rem'
                                                                }}
                                                                title="Remove Item"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Section 4: Payment & Financials */}
                                <div className="daraz-form-section">
                                    <h4 className="daraz-form-section-title">Payment & Financials</h4>
                                    <div className="daraz-form-grid-4">
                                        <div className="daraz-form-group">
                                            <label>Subtotal / Base Price (LKR)</label>
                                            <input
                                                type="number"
                                                readOnly
                                                disabled
                                                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569' }}
                                                value={formOrder.unit_price}
                                            />
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Delivery Fee (LKR)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={formOrder.delivery_fee}
                                                onChange={(e) => handleFieldChange('delivery_fee', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Discount (LKR)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={formOrder.discount}
                                                onChange={(e) => handleFieldChange('discount', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="daraz-form-group">
                                            <label style={{ color: '#ea580c', fontWeight: '800' }}>Total Amount</label>
                                            <input
                                                type="number"
                                                readOnly
                                                className="daraz-total-input"
                                                value={formOrder.total_amount}
                                            />
                                        </div>
                                    </div>

                                    <div className="daraz-form-grid-3" style={{ marginTop: '0.75rem' }}>
                                        <div className="daraz-form-group">
                                            <label>Payment Method</label>
                                            <select
                                                value={formOrder.payment_method}
                                                onChange={(e) => handleFieldChange('payment_method', e.target.value)}
                                            >
                                                <option value="Cash on Delivery">Cash on Delivery</option>
                                                <option value="Prepaid">Prepaid</option>
                                            </select>
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Order Status</label>
                                            <select
                                                value={formOrder.status}
                                                onChange={(e) => handleFieldChange('status', e.target.value)}
                                            >
                                                <option value="New">New</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Packed">Packed</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                                <option value="Returned">Returned</option>
                                            </select>
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Payment Status</label>
                                            <select
                                                value={formOrder.payment_status}
                                                onChange={(e) => handleFieldChange('payment_status', e.target.value)}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="received">Received</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 5: Notes */}
                                <div className="daraz-form-section">
                                    <h4 className="daraz-form-section-title">Additional Info</h4>
                                    <div className="daraz-form-group">
                                        <label>Notes</label>
                                        <textarea
                                            placeholder="Enter special notes or extra details..."
                                            value={formOrder.remarks}
                                            onChange={(e) => handleFieldChange('remarks', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="daraz-modal-footer">
                                    <button type="button" onClick={resetForm} className="daraz-btn-cancel">
                                        Clear Form
                                    </button>
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="daraz-btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="daraz-btn-primary">
                                        Save Order
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {isEditModalOpen && (
                    <div className="daraz-modal-backdrop">
                        <div className="daraz-modal">
                            <div className="daraz-modal-header">
                                <h3>Edit Daraz Order Details</h3>
                                <button className="daraz-modal-close" onClick={() => setIsEditModalOpen(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateOrder} className="daraz-form">
                                {/* Section 1: Order Information */}
                                <div className="daraz-form-section">
                                    <h4 className="daraz-form-section-title">Order Information</h4>
                                    <div className="daraz-form-grid-3">
                                        <div className="daraz-form-group">
                                            <label>Daraz Order ID (Read Only)</label>
                                            <input
                                                type="text"
                                                disabled
                                                value={formOrder.daraz_order_id}
                                            />
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Order Date *</label>
                                            <input
                                                type="date"
                                                required
                                                disabled={isLocked}
                                                value={formOrder.order_date}
                                                onChange={(e) => handleFieldChange('order_date', e.target.value)}
                                            />
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Tracking Number</label>
                                            <input
                                                type="text"
                                                disabled={isLocked}
                                                placeholder="DEX/FBL Tracking ID"
                                                value={formOrder.tracking_number}
                                                onChange={(e) => handleFieldChange('tracking_number', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Customer Information */}
                                <div className="daraz-form-section">
                                    <h4 className="daraz-form-section-title">Customer Information</h4>
                                    <div className="daraz-form-grid-2">
                                        <div className="daraz-form-group">
                                            <label>Customer Name</label>
                                            <input
                                                type="text"
                                                disabled={isLocked}
                                                placeholder="John Doe"
                                                value={formOrder.customer_name}
                                                onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Customer Phone Number</label>
                                            <input
                                                type="text"
                                                disabled={isLocked}
                                                placeholder="077XXXXXXXX"
                                                value={formOrder.customer_phone}
                                                onChange={(e) => handleFieldChange('customer_phone', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="daraz-form-group" style={{ marginTop: '0.75rem' }}>
                                        <label>Delivery Address</label>
                                        <textarea
                                            disabled={isLocked}
                                            placeholder="Enter complete shipping address..."
                                            value={formOrder.delivery_address}
                                            onChange={(e) => handleFieldChange('delivery_address', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Section 3: Product Information */}
                                <div className="daraz-form-section">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.375rem' }}>
                                        <h4 className="daraz-form-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Product Information</h4>
                                        {!isLocked && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    type="button"
                                                    onClick={startSelectingItems}
                                                    className="daraz-btn-primary"
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700',
                                                        padding: '0.375rem 0.75rem',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        height: 'auto'
                                                    }}
                                                >
                                                    <Plus size={12} /> Add Items to Order
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleAddManualItemRow}
                                                    className="daraz-btn-secondary"
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700',
                                                        padding: '0.375rem 0.75rem',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        height: 'auto',
                                                        backgroundColor: '#ffffff',
                                                        color: '#0f172a',
                                                        border: '1px solid #cbd5e1'
                                                    }}
                                                >
                                                    <Plus size={12} /> Add Manual Row
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Items Table */}
                                    <div className="daraz-items-table-wrapper" style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                                        <table className="daraz-items-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                                    <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#475569', width: '50%' }}>Product Name / SKU *</th>
                                                    <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#475569', width: '15%' }}>Quantity *</th>
                                                    <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#475569', width: '20%' }}>Unit Price (LKR) *</th>
                                                    <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#475569', width: '10%', textAlign: 'right' }}>Total</th>
                                                    <th style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#475569', width: '5%', textAlign: 'center' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(formOrder.items || []).map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '0.375rem' }}>
                                                            <input
                                                                type="text"
                                                                required
                                                                disabled={isLocked}
                                                                placeholder="Enter product title or SKU"
                                                                value={item.product_name}
                                                                onChange={(e) => handleItemFieldChange(idx, 'product_name', e.target.value)}
                                                                style={{ width: '100%', padding: '0.375rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isLocked ? '#f1f5f9' : '#ffffff', color: isLocked ? '#64748b' : '#000000', cursor: isLocked ? 'not-allowed' : 'default' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '0.375rem' }}>
                                                            <input
                                                                type="number"
                                                                required
                                                                min="1"
                                                                disabled={isLocked}
                                                                value={item.quantity}
                                                                onChange={(e) => handleItemFieldChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                                style={{ width: '100%', padding: '0.375rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isLocked ? '#f1f5f9' : '#ffffff', color: isLocked ? '#64748b' : '#000000', cursor: isLocked ? 'not-allowed' : 'default' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '0.375rem' }}>
                                                            <input
                                                                type="number"
                                                                required
                                                                step="0.01"
                                                                min="0"
                                                                disabled={isLocked}
                                                                value={item.unit_price}
                                                                onChange={(e) => handleItemFieldChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                style={{ width: '100%', padding: '0.375rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isLocked ? '#f1f5f9' : '#ffffff', color: isLocked ? '#64748b' : '#000000', cursor: isLocked ? 'not-allowed' : 'default' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '0.375rem', fontSize: '0.875rem', fontWeight: '600', color: '#000000', textAlign: 'right' }}>
                                                            Rs. {((parseInt(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td style={{ padding: '0.375rem', textAlign: 'center' }}>
                                                            {!isLocked && (
                                                                <button
                                                                    type="button"
                                                                    disabled={formOrder.items.length === 1}
                                                                    onClick={() => handleRemoveItemRow(idx)}
                                                                    style={{
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        color: formOrder.items.length === 1 ? '#cbd5e1' : '#ef4444',
                                                                        cursor: formOrder.items.length === 1 ? 'not-allowed' : 'pointer',
                                                                        padding: '0.25rem'
                                                                    }}
                                                                    title="Remove Item"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Section 4: Payment & Financials */}
                                <div className="daraz-form-section">
                                    <h4 className="daraz-form-section-title">Payment & Financials</h4>
                                    <div className="daraz-form-grid-4">
                                        <div className="daraz-form-group">
                                            <label>Subtotal / Base Price (LKR)</label>
                                            <input
                                                type="number"
                                                readOnly
                                                disabled
                                                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#475569' }}
                                                value={formOrder.unit_price}
                                            />
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Delivery Fee (LKR)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                disabled={isLocked}
                                                placeholder="0.00"
                                                value={formOrder.delivery_fee}
                                                onChange={(e) => handleFieldChange('delivery_fee', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Discount (LKR)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                disabled={isLocked}
                                                placeholder="0.00"
                                                value={formOrder.discount}
                                                onChange={(e) => handleFieldChange('discount', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="daraz-form-group">
                                            <label style={{ color: '#ea580c', fontWeight: '800' }}>Total Amount</label>
                                            <input
                                                type="number"
                                                readOnly
                                                className="daraz-total-input"
                                                value={formOrder.total_amount}
                                            />
                                        </div>
                                    </div>

                                    <div className="daraz-form-grid-3" style={{ marginTop: '0.75rem' }}>
                                        <div className="daraz-form-group">
                                            <label>Payment Method</label>
                                            <select
                                                disabled={isLocked}
                                                value={formOrder.payment_method}
                                                onChange={(e) => handleFieldChange('payment_method', e.target.value)}
                                            >
                                                <option value="Cash on Delivery">Cash on Delivery</option>
                                                <option value="Prepaid">Prepaid</option>
                                            </select>
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Order Status</label>
                                            <div style={{ marginTop: '0.25rem' }}>
                                                <span className={`badge-status ${formOrder.status?.toLowerCase()}`}>
                                                    {formOrder.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="daraz-form-group">
                                            <label>Payment Status</label>
                                            <div style={{ marginTop: '0.25rem' }}>
                                                <span className={`badge-payment ${formOrder.payment_status?.toLowerCase()}`}>
                                                    {formOrder.payment_status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 5: Notes */}
                                <div className="daraz-form-section">
                                    <h4 className="daraz-form-section-title">Additional Info</h4>
                                    <div className="daraz-form-group">
                                        <label>Notes</label>
                                        <textarea
                                            disabled={isLocked}
                                            placeholder="Enter special notes or extra details..."
                                            value={formOrder.remarks}
                                            onChange={(e) => handleFieldChange('remarks', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="daraz-modal-footer">
                                    {/* Left side actions: Mark Payment as Received, Cancel Order */}
                                    <div style={{ marginRight: 'auto', display: 'flex', gap: '0.5rem' }}>
                                        {formOrder.payment_status === 'pending' && formOrder.status?.toLowerCase() !== 'cancelled' && formOrder.status?.toLowerCase() !== 'returned' && (
                                            <button
                                                type="button"
                                                onClick={handleQuickPaymentUpdate}
                                                className="daraz-btn-settle"
                                                style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', height: '38px' }}
                                            >
                                                <Check size={16} /> Mark Payment Received
                                            </button>
                                        )}
                                        {formOrder.status?.toLowerCase() !== 'delivered' &&
                                         formOrder.status?.toLowerCase() !== 'cancelled' &&
                                         formOrder.status?.toLowerCase() !== 'returned' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to cancel this order?')) {
                                                        handleQuickStatusUpdate('Cancelled');
                                                    }
                                                }}
                                                style={{
                                                    padding: '0.625rem 1.25rem',
                                                    borderRadius: '6px',
                                                    fontWeight: '700',
                                                    fontSize: '0.875rem',
                                                    cursor: 'pointer',
                                                    backgroundColor: '#fee2e2',
                                                    color: '#991b1b',
                                                    border: '1px solid #fca5a5',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.375rem',
                                                    height: '38px',
                                                    transition: 'all 0.15s'
                                                }}
                                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fecaca'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                                            >
                                                <X size={16} /> Cancel Order
                                            </button>
                                        )}
                                    </div>

                                    {/* Dismiss / Close modal */}
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="daraz-btn-cancel" style={{ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        Close
                                    </button>

                                    {/* Right side progression / save actions */}
                                    {formOrder.status?.toLowerCase() === 'new' ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={(e) => handleUpdateOrder(e, 'Processing')}
                                                className="daraz-btn-primary"
                                                style={{ backgroundColor: '#2563eb', backgroundImage: 'none', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                Update to Processing
                                            </button>
                                            <button type="submit" className="daraz-btn-primary" style={{ height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                Save Changes
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {formOrder.status?.toLowerCase() === 'processing' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickStatusUpdate('Packed')}
                                                    className="daraz-btn-primary"
                                                    style={{ backgroundColor: '#ea580c', backgroundImage: 'none', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    Update to Packed
                                                </button>
                                            )}
                                            {formOrder.status?.toLowerCase() === 'packed' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickStatusUpdate('Shipped')}
                                                    className="daraz-btn-primary"
                                                    style={{ backgroundColor: '#06b6d4', backgroundImage: 'none', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    Update to Shipped
                                                </button>
                                            )}
                                            {formOrder.status?.toLowerCase() === 'shipped' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickStatusUpdate('Delivered')}
                                                    className="daraz-btn-primary"
                                                    style={{ backgroundColor: '#10b981', backgroundImage: 'none', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    Update to Delivered
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </POSLayout>
    );
}
