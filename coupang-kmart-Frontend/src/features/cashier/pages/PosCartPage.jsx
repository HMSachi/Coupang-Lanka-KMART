import React, { useState, useEffect } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import CartSidebar from '../components/CartSidebar';
import { ArrowLeft, Clock, ShoppingCart, Plus, Edit2, Play, CheckCircle, Search, Eye, X, Receipt, User, CreditCard, CalendarDays, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const parsePaymentDetails = (details) => {
  if (Array.isArray(details)) return details;
  if (!details) return [];
  if (typeof details === 'string') {
    try {
      const parsed = JSON.parse(details);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
};

const getExchangeInfo = (order, payments) => {
  const paymentText = String(order.payment_method || '').toLowerCase();
  const exchangePayment = payments.find(payment =>
    payment?.method === 'exchange_credit' ||
    payment?.exchange_batch_number ||
    payment?.return_ref
  );

  return {
    isExchangeOrder: paymentText.includes('exchange_credit') || Boolean(exchangePayment),
    exchangeBatchNumber: exchangePayment?.exchange_batch_number || '',
    exchangeReturnRef: exchangePayment?.return_ref || ''
  };
};

export default function PosCartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [heldOrders, setHeldOrders] = useState([]);
  const [isLoadingHeld, setIsLoadingHeld] = useState(false);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [showCompletedFullScreen, setShowCompletedFullScreen] = useState(false);
  const [completedSearch, setCompletedSearch] = useState('');
  const [completedSort, setCompletedSort] = useState('newest');
  const [selectedCompletedOrder, setSelectedCompletedOrder] = useState(null);
  const [pendingExchangeBatches, setPendingExchangeBatches] = useState([]);
  const [showExchangePicker, setShowExchangePicker] = useState(false);

  const [discountPercent, setDiscountPercent] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('pos_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setIsLoaded(true);
    fetchHeldOrders();
    loadCompletedOrders();
    loadExchangeBatches();

    // Listen for refresh event
    const handleRefresh = () => {
      fetchHeldOrders();
      loadCompletedOrders();
      loadExchangeBatches();
    };
    window.addEventListener('refreshHeldOrders', handleRefresh);
    return () => window.removeEventListener('refreshHeldOrders', handleRefresh);
  }, []);

  const fetchHeldOrders = async () => {
    setIsLoadingHeld(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/orders/hold', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setHeldOrders(data);
      }
    } catch (err) {
      console.error('Error fetching held orders:', err);
    } finally {
      setIsLoadingHeld(false);
    }
  };

  const normalizeCompletedOrder = (order) => {
    const payments = parsePaymentDetails(order.payment_details);
    const exchangeInfo = getExchangeInfo(order, payments);

    return {
      id: order.id,
      orderId: order.order_id,
      invoiceNo: order.order_id,
      completedAt: order.completed_at || order.created_at,
      cashier: order.cashier_name,
      registerId: order.register_id,
      sessionId: order.session_id,
      sessionStartTime: order.session_start_time,
      customer: {
        name: order.customer_name || 'POS Customer',
        phone: order.customer_phone || ''
      },
      items: (order.items || []).map(item => ({
        id: item.product_id,
        name: item.product_name || item.name,
        price: Number(item.price) || 0,
        qty: Number(item.quantity || item.qty) || 0,
        image: item.image_url || ''
      })),
      summary: {
        subtotal: Number(order.subtotal) || 0,
        discountAmount: Number(order.discount_amount) || 0,
        vatAmount: Number(order.vat_amount) || 0,
        serviceCharge: Number(order.service_charge) || 0,
        total: Number(order.total_amount) || 0
      },
      payments,
      ...exchangeInfo,
      changeDue: Number(order.change_due) || 0,
      itemCount: (order.items || []).reduce((sum, item) => sum + (Number(item.quantity || item.qty) || 0), 0)
    };
  };

  const loadCompletedOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const activeSession = JSON.parse(localStorage.getItem('active_session') || 'null');
      if (!activeSession?.id && !(activeSession?.cashier && activeSession?.startTime)) {
        setCompletedOrders([]);
        return;
      }

      const params = new URLSearchParams();
      if (activeSession?.id) {
        params.set('session_id', activeSession.id);
      } else if (activeSession?.cashier && activeSession?.startTime) {
        params.set('cashier_name', activeSession.cashier);
        params.set('start_time', activeSession.startTime);
      }

      const response = await fetch(`http://localhost:5000/api/orders/completed/session?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch completed orders');

      const data = await response.json();
      setCompletedOrders(Array.isArray(data) ? data.map(normalizeCompletedOrder) : []);
    } catch (err) {
      console.error('Error fetching completed orders:', err);
      setCompletedOrders([]);
    }
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pos_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated')); // Keep badge in sync
    }
  }, [cart, isLoaded]);

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const loadExchangeBatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/returns/exchange-batches?status=pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load exchange batches');
      setPendingExchangeBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading exchange batches:', err);
      setPendingExchangeBatches([]);
    }
  };

  const openExchangePicker = async () => {
    await loadExchangeBatches();
    setShowExchangePicker(true);
  };

  const handleUseExchangeBatch = (batch) => {
    if (cart.length > 0 && !window.confirm('This will replace the current cart with the exchange order. Continue?')) {
      return;
    }

    const exchangeItems = (batch.items || []).map((item, index) => ({
      id: item.product_id || item.id || `exchange-${batch.batch_number}-${index}`,
      product_id: item.product_id || null,
      name: item.name,
      price: Number(item.price || 0),
      qty: Number(item.qty || 1),
      image: item.image || '',
      is_exchange_item: true,
      exchange_batch_number: batch.batch_number,
      return_ref: batch.return_ref,
      return_item_id: item.return_item_id || item.id
    }));

    const exchangeSummary = {
      subtotal: exchangeItems.reduce((sum, item) => sum + (item.price * item.qty), 0),
      discountType: 'none',
      discountAmount: 0,
      vatAmount: 0,
      serviceCharge: 0,
      total: Number(batch.amount || 0),
      exchangeCredit: Number(batch.amount || 0),
      exchangeBatchNumber: batch.batch_number,
      returnRef: batch.return_ref,
      orderRef: batch.order_id,
      customer: {
        name: batch.customer?.name || 'POS Customer',
        phone: batch.customer?.phone || ''
      }
    };

    setCart(exchangeItems);
    setDiscountPercent(0);
    localStorage.setItem('pos_cart', JSON.stringify(exchangeItems));
    localStorage.setItem('pending_order_summary', JSON.stringify(exchangeSummary));
    localStorage.setItem('pos_customer', JSON.stringify(exchangeSummary.customer));
    localStorage.setItem('exchange_order_context', JSON.stringify(batch));
    localStorage.removeItem('editing_order_id');
    window.dispatchEvent(new Event('cartUpdated'));
    setShowExchangePicker(false);
  };

  const handleStartNewOrder = async () => {
    if (cart.length > 0) {
      const custName = prompt('Enter Customer Name (Optional):', 'POS Customer') || 'POS Customer';
      const custPhone = prompt('Enter Mobile Number (Optional):', '') || '';

      if (window.confirm(`Hold this order for ${custName} and start a new one?`)) {
        try {
          const editingOrderId = localStorage.getItem('editing_order_id');
          const token = localStorage.getItem('token');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const session = JSON.parse(localStorage.getItem('active_session') || 'null');

          const subtotalValue = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
          const discountAmountValue = (subtotalValue * discountPercent) / 100;
          const totalValue = subtotalValue - discountAmountValue;

          const userRole = user.role ? user.role.toLowerCase() : '';
          const effectiveBranchId = user.branch_id || ((userRole === 'admin' || userRole === 'superadmin') ? 1 : null);

          const orderData = {
            order_id: `HOLD-${Date.now()}`,
            customer_name: custName,
            customer_phone: custPhone,
            subtotal: subtotalValue,
            total_amount: totalValue,
            items: cart,
            status: 'hold',
            branch_id: effectiveBranchId,
            cashier_name: session?.cashier || user.name || user.email || 'Cashier',
            register_id: session?.registerId || 'REGISTER_01',
            session_id: session?.id || null,
            session_start_time: session?.startTime || null
          };

          if (editingOrderId) {
            await fetch(`http://localhost:5000/api/orders/${editingOrderId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(orderData)
            });
          } else {
            await fetch('http://localhost:5000/api/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(orderData)
            });
          }

          setCart([]);
          localStorage.removeItem('editing_order_id');
          localStorage.removeItem('pos_customer');
          localStorage.removeItem('exchange_order_context');
          fetchHeldOrders();
          navigate('/pos');
        } catch (err) {
          console.error('Error during auto-hold:', err);
          alert('Failed to hold order. Please try again.');
        }
      }
    } else {
      localStorage.removeItem('editing_order_id');
      localStorage.removeItem('pos_customer');
      localStorage.removeItem('exchange_order_context');
      navigate('/pos');
    }
  };

  const handleResumeOrder = (order, mode) => {
    // Mode: 'checkout' or 'edit'
    if (cart.length > 0) {
      if (!window.confirm('You have items in your current cart. This will replace it. Continue?')) {
        return;
      }
    }

    // Map DB items to cart items (ensure qty vs quantity consistency)
    const cartItems = order.items.map(item => ({
      id: item.product_id,
      name: item.product_name,
      price: parseFloat(item.price),
      qty: item.quantity,
      image: item.image_url
    }));

    setCart(cartItems);
    localStorage.setItem('pos_cart', JSON.stringify(cartItems));
    localStorage.setItem('editing_order_id', order.id);
    localStorage.setItem('pos_customer', JSON.stringify({
      name: order.customer_name !== 'POS Customer' ? order.customer_name : '',
      phone: order.customer_phone || ''
    }));

    if (mode === 'edit') {
      navigate('/pos');
    } else if (mode === 'checkout') {
      navigate('/pos/checkout');
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;
  const tax = 0;

  const formatCurrency = (value) => `Rs. ${(Number(value) || 0).toLocaleString()}`;
  const getOrderTotal = (order) => order.summary?.total ?? order.total_amount ?? 0;
  const getOrderItemCount = (order) => order.itemCount ?? order.items?.reduce((sum, item) => sum + (Number(item.qty || item.quantity) || 0), 0) ?? 0;

  const filteredCompletedOrders = completedOrders
    .filter(order => {
      const search = completedSearch.trim().toLowerCase();
      if (!search) return true;
      return [
        order.orderId,
        order.invoiceNo,
        order.customer?.name,
        order.customer?.phone,
        order.cashier,
        order.isExchangeOrder ? 'exchange order' : '',
        order.exchangeBatchNumber,
        order.exchangeReturnRef,
        ...(order.items || []).map(item => item.name)
      ].filter(Boolean).join(' ').toLowerCase().includes(search);
    })
    .sort((a, b) => {
      const first = new Date(a.completedAt || 0).getTime();
      const second = new Date(b.completedAt || 0).getTime();
      return completedSort === 'oldest' ? first - second : second - first;
    });

  if (showCompletedFullScreen) {
    return (
      <POSLayout>
        <div className="completed-fullscreen-container">
          <div className="completed-fullscreen-header">
            <button className="header-btn secondary" onClick={() => setShowCompletedFullScreen(false)}>
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <div>
              <h1>Completed Orders</h1>
              <p>{completedOrders.length} completed orders in this cashier session</p>
            </div>
          </div>

          <div className="completed-toolbar">
            <div className="completed-search">
              <Search size={17} />
              <input
                value={completedSearch}
                onChange={(e) => setCompletedSearch(e.target.value)}
                placeholder="Search order, customer, phone, cashier, or item..."
              />
            </div>
            <div className="completed-filters">
              <button className={completedSort === 'newest' ? 'active' : ''} onClick={() => setCompletedSort('newest')}>
                Newest First
              </button>
              <button className={completedSort === 'oldest' ? 'active' : ''} onClick={() => setCompletedSort('oldest')}>
                Oldest First
              </button>
            </div>
          </div>

          <div className="completed-orders-table-card">
            {filteredCompletedOrders.length === 0 ? (
              <div className="completed-empty-state">
                <CheckCircle size={24} />
                <h3>No completed orders found</h3>
                <p>Completed cashier-session orders will appear here after payment finalization.</p>
              </div>
            ) : (
              <table className="completed-orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Completed</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompletedOrders.map(order => (
                    <tr key={order.id} onClick={() => setSelectedCompletedOrder(order)}>
                      <td>
                        <div className="completed-table-order-line">
                          <strong>{order.invoiceNo || order.orderId}</strong>
                          {order.isExchangeOrder && <span className="exchange-order-tag">Exchange Order</span>}
                        </div>
                        <span>{order.isExchangeOrder ? `Return ${order.exchangeReturnRef || 'exchange return'}` : (order.registerId || 'Register #01')}</span>
                      </td>
                      <td>
                        <strong>{order.customer?.name || 'POS Customer'}</strong>
                        <span>{order.customer?.phone || 'No phone'}</span>
                      </td>
                      <td>{getOrderItemCount(order)} items</td>
                      <td>{(order.payments || []).map(p => p.method).join(', ') || 'N/A'}</td>
                      <td>{order.completedAt ? new Date(order.completedAt).toLocaleString() : 'N/A'}</td>
                      <td className="text-right"><strong>{formatCurrency(getOrderTotal(order))}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        {selectedCompletedOrder && renderCompletedOrderModal(selectedCompletedOrder)}
        {renderCompletedStyles()}
      </POSLayout>
    );
  }

  return (
    <POSLayout>
      <div className="pos-cart-page-container">
        <div className="cart-page-header">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="header-btn secondary" onClick={() => navigate('/pos')}>
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <button className="header-btn primary" onClick={handleStartNewOrder}>
              <Plus size={18} />
              <span>Create Another Order</span>
            </button>
            <button className="header-btn exchange" onClick={openExchangePicker}>
              <RotateCcw size={18} />
              <span>Create Exchange Order</span>
              {pendingExchangeBatches.length > 0 && <strong>{pendingExchangeBatches.length}</strong>}
            </button>
          </div>
          <h1>Order Management</h1>
        </div>

        <div className="cart-page-grid">
          {/* LEFT: Current Active Order */}
          <div className="active-order-section">
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShoppingCart size={20} />
                <h2>Current Active Order</h2>
                {localStorage.getItem('editing_order_id') && (
                  <span className="editing-tag">Editing Held Order</span>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => navigate('/pos')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', background: '#ffffff',
                    color: '#1d4ed8', borderRadius: '8px',
                    fontSize: '12px', fontWeight: 600,
                    border: '1px solid #bfdbfe', cursor: 'pointer'
                  }}
                >
                  <Plus size={16} /> Add More Items
                </button>
              )}
            </div>
            <div className="cart-page-content">
              {cart.length === 0 ? (
                <div className="empty-cart-state">
                  <div className="empty-icon">🛒</div>
                  <h3>Your cart is empty</h3>
                  <p>Start adding products or resume a held order</p>
                  <button onClick={() => navigate('/pos')} className="start-order-btn">Go to Products</button>
                </div>
              ) : (
                <CartSidebar
                  cart={cart}
                  updateQty={updateQty}
                  removeFromCart={removeFromCart}
                  subtotal={subtotal}
                  tax={tax}
                  total={total}
                  discountPercent={discountPercent}
                  setDiscountPercent={setDiscountPercent}
                />
              )}
            </div>
          </div>

          {/* RIGHT: Held Orders */}
          <div className="held-orders-section">
            <div className="section-title">
              <Clock size={20} />
              <h2>Held Bills / Pending Orders</h2>
            </div>
            <div className="held-orders-list">
              {isLoadingHeld ? (
                <div className="loading-state">Loading held orders...</div>
              ) : heldOrders.length === 0 ? (
                <div className="no-held-orders">
                  <div className="no-held-icon">
                    <Clock size={18} />
                  </div>
                  <h3>No Held Orders</h3>
                  <p>Pending and parked orders will appear here for quick cashier recall.</p>
                </div>
              ) : (
                heldOrders.map(order => (
                  <div key={order.id} className="held-order-card" onClick={() => handleResumeOrder(order, 'load')}>
                    <div className="held-info">
                      <div className="held-main">
                        <span className="held-id">
                          {order.customer_name && order.customer_name !== 'POS Customer'
                            ? `${order.customer_name} ${order.customer_phone ? `(${order.customer_phone})` : ''}`
                            : `#${order.order_id}`}
                        </span>
                        <span className="held-time">{new Date(order.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="held-details">
                        <span className="held-items-count">{order.items.length} items</span>
                        <span className="held-amount">Rs. {parseFloat(order.total_amount).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="held-actions">
                      <button className="held-btn edit" onClick={(e) => { e.stopPropagation(); handleResumeOrder(order, 'edit'); }} title="Add More Items">
                        <Edit2 size={16} /> Add Items
                      </button>
                      <button className="held-btn proceed" onClick={(e) => { e.stopPropagation(); handleResumeOrder(order, 'checkout'); }} title="Complete Order">
                        <Play size={16} /> Complete Order
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="completed-orders-section">
              <div className="section-title completed-title">
                <div>
                  <CheckCircle size={20} />
                  <h2>Completed Orders</h2>
                </div>
                <button className="view-all-completed-btn" onClick={() => setShowCompletedFullScreen(true)}>
                  View All
                </button>
              </div>
              <div className="completed-orders-list">
                {completedOrders.length === 0 ? (
                  <div className="no-held-orders">
                    <div className="no-held-icon completed">
                      <Receipt size={18} />
                    </div>
                    <h3>No Completed Orders</h3>
                    <p>Orders completed in this cashier session will be saved here until EOD closes the shift.</p>
                  </div>
                ) : (
                  completedOrders.slice(0, 3).map(order => (
                    <div key={order.id} className="completed-order-card" onClick={() => setSelectedCompletedOrder(order)}>
                      <div className="held-info">
                        <div className="held-main">
                          <div className="completed-id-wrap">
                            <span className="held-id">{order.invoiceNo || order.orderId}</span>
                            {order.isExchangeOrder && <span className="exchange-order-tag">Exchange Order</span>}
                          </div>
                          <span className="held-time">{new Date(order.completedAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="held-details">
                          <span>{getOrderItemCount(order)} items</span>
                          <span className="held-amount">{formatCurrency(getOrderTotal(order))}</span>
                        </div>
                      </div>
                      <button className="completed-view-btn" onClick={(e) => { e.stopPropagation(); setSelectedCompletedOrder(order); }}>
                        <Eye size={15} /> View Details
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showExchangePicker && (
        <div className="completed-modal-overlay">
          <div className="completed-modal exchange-picker-modal">
            <div className="completed-modal-header">
              <div>
                <h3>Create Exchange Order</h3>
                <p>Select an exchange batch created from a return report.</p>
              </div>
              <button onClick={() => setShowExchangePicker(false)} className="completed-modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="exchange-picker-body">
              {pendingExchangeBatches.length === 0 ? (
                <div className="completed-empty-state">
                  <RotateCcw size={24} />
                  <h3>No exchange batches found</h3>
                  <p>Create a return with Exchange item method, then click Exchange Now in the return report.</p>
                </div>
              ) : (
                pendingExchangeBatches.map(batch => (
                  <div className="exchange-batch-card" key={batch.batch_number || batch.return_ref}>
                    <div className="exchange-batch-top">
                      <div>
                        <span>Exchange Batch</span>
                        <strong>{batch.batch_number}</strong>
                      </div>
                      <div className="exchange-batch-value">{formatCurrency(batch.amount)}</div>
                    </div>
                    <div className="exchange-batch-meta">
                      <div><span>Return ID</span><strong>{batch.return_ref}</strong></div>
                      <div><span>Original Order</span><strong>{batch.order_id}</strong></div>
                      <div><span>Customer</span><strong>{batch.customer?.name || 'POS Customer'}</strong></div>
                      <div><span>Created</span><strong>{batch.created_at ? new Date(batch.created_at).toLocaleString() : 'Now'}</strong></div>
                    </div>
                    <div className="exchange-batch-items-preview">
                      {(batch.items || []).map((item, index) => (
                        <div key={`${batch.batch_number}-${index}`}>
                          <strong>{item.name}</strong>
                          <span>{Number(item.qty || 1)} x {formatCurrency(item.price)}</span>
                        </div>
                      ))}
                    </div>
                    <button className="exchange-use-btn" onClick={() => handleUseExchangeBatch(batch)}>
                      <RotateCcw size={16} /> Add Exchange Item to Cart
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {selectedCompletedOrder && renderCompletedOrderModal(selectedCompletedOrder)}

      <style jsx>{`
        .pos-cart-page-container {
          padding: 1.2rem;
          max-width: 1600px;
          margin: 0 auto;
          color: #1f2937;
        }

        .cart-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .header-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 0.95rem;
          border-radius: 5px;
          font-weight: 600;
          font-size: 0.84rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .header-btn.primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          box-shadow: 0 12px 22px -14px rgba(37, 99, 235, 0.45);
        }

        .header-btn.exchange {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #2563eb;
          box-shadow: 0 12px 22px -16px rgba(37, 99, 235, 0.35);
        }

        .header-btn.exchange strong {
          min-width: 20px;
          height: 20px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #2563eb;
          color: #ffffff;
          font-size: 0.72rem;
        }

        .header-btn.secondary {
          background: white;
          border-color: #e2e8f0;
          color: #1f2937;
        }

        .header-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px -14px rgba(15, 23, 42, 0.35);
        }

        .cart-page-header h1 {
          font-size: 0.98rem;
          font-weight: 600;
          color: #1f2937;
          letter-spacing: 0;
          margin: 0;
        }

        .cart-page-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 1rem;
          align-items: start;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          color: #1f2937;
        }

        .section-title svg {
          color: #2563eb;
        }

        .section-title h2 {
          font-size: 0.92rem;
          font-weight: 600;
          margin: 0;
        }

        .editing-tag {
          font-size: 10px;
          background: #fef3c7;
          color: #92400e;
          padding: 2px 8px;
          border-radius: 5px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .cart-page-content {
          background: white;
          border-radius: 5px;
          box-shadow: 0 10px 22px -18px rgba(15, 23, 42, 0.32);
          border: 1px solid #e2e8f0;
          min-height: 460px;
          overflow: hidden;
        }

        .empty-cart-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-cart-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .empty-cart-state p {
          color: #64748b;
          margin-bottom: 1rem;
        }

        .start-order-btn {
          padding: 0.55rem 1.15rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 5px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .held-orders-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .no-held-orders {
          background: #ffffff;
          border: 1px dashed #cbd5e1;
          border-radius: 5px;
          padding: 1rem;
          text-align: left;
          color: #475569;
        }

        .no-held-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
          border: 1px solid #bfdbfe;
        }

        .no-held-orders h3 {
          margin: 0 0 0.35rem 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #1f2937;
        }

        .no-held-orders p {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.45;
          color: #64748b;
        }

        .held-order-card {
          background: white;
          border-radius: 5px;
          padding: 0.85rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 8px 18px -18px rgba(15, 23, 42, 0.3);
          transition: all 0.2s;
          cursor: pointer;
        }

        .held-order-card:hover {
          border-color: #fecdd3;
          box-shadow: 0 10px 22px -16px rgba(229, 31, 42, 0.24);
        }

        .held-info {
          margin-bottom: 0.75rem;
        }

        .held-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .held-id {
          font-weight: 600;
          color: #1f2937;
          font-size: 12px;
        }

        .held-time {
          font-size: 11px;
          color: #64748b;
        }

        .held-details {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b;
        }

        .held-amount {
          font-weight: 600;
          color: #1f2937;
        }

        .held-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .held-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .held-btn.edit {
          background: #ffffff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }

        .held-btn.proceed {
          background: #fff1f2;
          color: #c81723;
          border-color: #fecdd3;
        }

        .held-btn:hover {
          opacity: 0.8;
          transform: translateY(-1px);
        }

        .completed-orders-section {
          margin-top: 1.2rem;
        }

        .completed-title {
          justify-content: space-between;
        }

        .completed-title > div {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .view-all-completed-btn,
        .completed-view-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #15803d;
          border-radius: 5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-all-completed-btn {
          padding: 6px 10px;
          font-size: 11px;
        }

        .completed-orders-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .no-held-icon.completed {
          background: #f0fdf4;
          color: #15803d;
          border-color: #bbf7d0;
        }

        .completed-order-card {
          background: white;
          border-radius: 5px;
          padding: 0.85rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 8px 18px -18px rgba(15, 23, 42, 0.3);
          cursor: pointer;
          transition: all 0.2s;
        }

        .completed-order-card:hover {
          border-color: #bbf7d0;
          box-shadow: 0 10px 22px -16px rgba(21, 128, 61, 0.2);
        }

        .completed-view-btn {
          width: 100%;
          padding: 7px 8px;
          font-size: 11px;
        }

        /* Adjusting CartSidebar for full page width */
        :global(.cart-sidebar-premium) {
          width: 100% !important;
          max-width: none !important;
          height: auto !important;
          border: none !important;
          border-radius: 5px !important;
        }

        :global(.cart-items-container) {
          max-height: 400px !important;
        }

        .exchange-picker-modal {
          width: min(760px, 100%);
        }

        .exchange-picker-body {
          display: grid;
          gap: 0.85rem;
          padding: 1rem;
        }

        .exchange-batch-card {
          border: 1px solid #dbeafe;
          border-radius: 7px;
          background: #ffffff;
          overflow: hidden;
          box-shadow: 0 10px 22px -20px rgba(37, 99, 235, 0.55);
        }

        .exchange-batch-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.85rem 1rem;
          background: #eff6ff;
          border-bottom: 1px solid #dbeafe;
        }

        .exchange-batch-top span,
        .exchange-batch-meta span {
          display: block;
          color: #64748b;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .exchange-batch-top strong,
        .exchange-batch-meta strong {
          display: block;
          margin-top: 0.2rem;
          color: #0f172a;
          font-size: 0.86rem;
        }

        .exchange-batch-value {
          color: #2563eb;
          font-weight: 900;
          white-space: nowrap;
        }

        .exchange-batch-meta {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          padding: 0.85rem 1rem;
        }

        .exchange-batch-items-preview {
          display: grid;
          gap: 0.5rem;
          padding: 0 1rem 0.85rem;
        }

        .exchange-batch-items-preview div {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.65rem;
          border-radius: 5px;
          background: #f8fafc;
          color: #64748b;
          font-size: 0.8rem;
        }

        .exchange-batch-items-preview strong {
          color: #0f172a;
        }

        .exchange-use-btn {
          width: calc(100% - 2rem);
          min-height: 40px;
          margin: 0 1rem 1rem;
          border: 0;
          border-radius: 6px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #ffffff;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .exchange-batch-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      {renderCompletedStyles()}
    </POSLayout>
  );

  function renderCompletedOrderModal(order) {
    return (
      <div className="completed-modal-overlay">
        <div className="completed-modal">
          <div className="completed-modal-header">
            <div>
              <h3>Completed Order Details</h3>
              <p>{order.invoiceNo || order.orderId}</p>
              {order.isExchangeOrder && <span className="exchange-order-tag modal-tag">Exchange Order</span>}
            </div>
            <button onClick={() => setSelectedCompletedOrder(null)} className="completed-modal-close">
              <X size={20} />
            </button>
          </div>

          <div className="completed-detail-grid">
            <div className="completed-detail-box">
              <User size={16} />
              <div>
                <label>Customer</label>
                <strong>{order.customer?.name || 'POS Customer'}</strong>
                <span>{order.customer?.phone || 'No phone number'}</span>
              </div>
            </div>
            <div className="completed-detail-box">
              <CalendarDays size={16} />
              <div>
                <label>Completed</label>
                <strong>{order.completedAt ? new Date(order.completedAt).toLocaleString() : 'N/A'}</strong>
                <span>{order.cashier || 'Cashier'} / {order.registerId || 'Register #01'}</span>
              </div>
            </div>
            <div className="completed-detail-box">
              <CreditCard size={16} />
              <div>
                <label>Payment</label>
                <strong>{(order.payments || []).map(payment => payment.method).join(', ') || 'N/A'}</strong>
                <span>Change: {formatCurrency(order.changeDue || 0)}</span>
              </div>
            </div>
          </div>

          {order.isExchangeOrder && (
            <div className="exchange-order-summary-box">
              <div>
                <label>Exchange Batch</label>
                <strong>{order.exchangeBatchNumber || 'Recorded exchange'}</strong>
              </div>
              <div>
                <label>Return ID</label>
                <strong>{order.exchangeReturnRef || 'N/A'}</strong>
              </div>
            </div>
          )}

          <div className="completed-modal-items">
            <h4>Items</h4>
            {(order.items || []).map((item, index) => (
              <div key={`${item.id}-${index}`} className="completed-modal-item">
                <div>
                  <strong>{item.name}</strong>
                  <span>{Number(item.qty || item.quantity) || 0} x {formatCurrency(item.price)}</span>
                </div>
                <strong>{formatCurrency((Number(item.price) || 0) * (Number(item.qty || item.quantity) || 0))}</strong>
              </div>
            ))}
          </div>

          <div className="completed-modal-summary">
            <div><span>Subtotal</span><strong>{formatCurrency(order.summary?.subtotal)}</strong></div>
            <div><span>Discount</span><strong>- {formatCurrency(order.summary?.discountAmount)}</strong></div>
            <div><span>VAT</span><strong>{formatCurrency(order.summary?.vatAmount)}</strong></div>
            <div><span>Service Charge</span><strong>{formatCurrency(order.summary?.serviceCharge)}</strong></div>
            <div className="grand"><span>Total</span><strong>{formatCurrency(getOrderTotal(order))}</strong></div>
          </div>
        </div>
      </div>
    );
  }

  function renderCompletedStyles() {
    return (
      <style jsx>{`
        .completed-fullscreen-container {
          padding: 1.2rem;
          max-width: 1600px;
          margin: 0 auto;
          color: #1f2937;
        }

        .completed-fullscreen-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .completed-fullscreen-header h1 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .completed-fullscreen-header p {
          margin: 0.25rem 0 0;
          color: #64748b;
          font-size: 0.85rem;
        }

        .completed-toolbar {
          display: grid;
          grid-template-columns: minmax(240px, 1fr) auto;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .completed-search {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          padding: 0 0.8rem;
          min-height: 42px;
          color: #64748b;
        }

        .completed-search input {
          border: 0;
          outline: 0;
          width: 100%;
          font-size: 0.85rem;
          color: #1f2937;
        }

        .completed-filters {
          display: flex;
          gap: 0.5rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          padding: 4px;
        }

        .completed-filters button {
          border: 0;
          background: transparent;
          color: #64748b;
          border-radius: 5px;
          padding: 0.5rem 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }

        .completed-filters button.active {
          background: #2563eb;
          color: #ffffff;
        }

        .completed-orders-table-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          overflow: hidden;
          box-shadow: 0 10px 22px -18px rgba(15, 23, 42, 0.32);
        }

        .completed-orders-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.84rem;
        }

        .completed-orders-table th,
        .completed-orders-table td {
          padding: 0.85rem;
          border-bottom: 1px solid #f1f5f9;
          text-align: left;
          vertical-align: top;
        }

        .completed-orders-table th {
          color: #64748b;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0;
          background: #f8fafc;
        }

        .completed-orders-table tbody tr {
          cursor: pointer;
          transition: background 0.2s;
        }

        .completed-orders-table tbody tr:hover {
          background: #f8fafc;
        }

        .completed-orders-table td span {
          display: block;
          color: #64748b;
          margin-top: 0.25rem;
          font-size: 0.76rem;
        }

        .completed-id-wrap,
        .completed-table-order-line {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .exchange-order-tag {
          display: inline-flex !important;
          align-items: center;
          width: max-content;
          margin-top: 0 !important;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1d4ed8;
          border-radius: 999px;
          padding: 2px 7px;
          font-size: 10px !important;
          line-height: 1.2;
          font-weight: 700;
          white-space: nowrap;
        }

        .modal-tag {
          margin-top: 0.35rem !important;
        }

        .exchange-order-summary-box {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin: 0 1rem 1rem;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          border-radius: 5px;
          padding: 0.85rem;
        }

        .exchange-order-summary-box label {
          display: block;
          color: #64748b;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .exchange-order-summary-box strong {
          display: block;
          margin-top: 0.2rem;
          color: #1e3a8a;
          font-size: 0.85rem;
        }

        .text-right {
          text-align: right !important;
        }

        .completed-empty-state {
          padding: 3rem 1.5rem;
          text-align: center;
          color: #64748b;
        }

        .completed-empty-state svg {
          color: #15803d;
        }

        .completed-empty-state h3 {
          margin: 0.75rem 0 0.35rem;
          color: #1f2937;
        }

        .completed-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .completed-modal {
          width: min(820px, 100%);
          max-height: calc(100vh - 2rem);
          overflow-y: auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 24px 60px -24px rgba(15, 23, 42, 0.55);
        }

        .completed-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .completed-modal-header h3 {
          margin: 0;
          font-size: 1rem;
        }

        .completed-modal-header p {
          margin: 0.25rem 0 0;
          color: #64748b;
          font-size: 0.8rem;
        }

        .completed-modal-close {
          width: 36px;
          height: 36px;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          background: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .completed-detail-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          padding: 1rem;
        }

        .completed-detail-box {
          display: flex;
          gap: 0.65rem;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          padding: 0.85rem;
          color: #2563eb;
        }

        .completed-detail-box label,
        .completed-detail-box span {
          display: block;
          color: #64748b;
          font-size: 0.75rem;
        }

        .completed-detail-box strong {
          display: block;
          color: #1f2937;
          font-size: 0.85rem;
          margin: 0.15rem 0;
        }

        .completed-modal-items,
        .completed-modal-summary {
          margin: 0 1rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          overflow: hidden;
        }

        .completed-modal-items h4 {
          margin: 0;
          padding: 0.8rem;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .completed-modal-item,
        .completed-modal-summary div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.8rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .completed-modal-item span {
          display: block;
          color: #64748b;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }

        .completed-modal-summary div:last-child,
        .completed-modal-item:last-child {
          border-bottom: 0;
        }

        .completed-modal-summary .grand {
          background: #f8fafc;
          font-size: 1rem;
        }

        @media (max-width: 900px) {
          .completed-toolbar,
          .completed-detail-grid,
          .exchange-order-summary-box {
            grid-template-columns: 1fr;
          }

          .completed-filters {
            width: 100%;
          }

          .completed-filters button {
            flex: 1;
          }
        }
      `}</style>
    );
  }
}
