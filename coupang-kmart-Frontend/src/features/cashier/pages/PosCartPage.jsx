import React, { useState, useEffect } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import CartSidebar from '../components/CartSidebar';
import { ArrowLeft, Clock, ShoppingCart, Plus, Edit2, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PosCartPage() {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [heldOrders, setHeldOrders] = useState([]);
  const [isLoadingHeld, setIsLoadingHeld] = useState(false);

  const [discountPercent, setDiscountPercent] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('pos_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setIsLoaded(true);
    fetchHeldOrders();

    // Listen for refresh event
    const handleRefresh = () => {
      fetchHeldOrders();
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

  const handleStartNewOrder = async () => {
    if (cart.length > 0) {
      const custName = prompt('Enter Customer Name (Optional):', 'POS Customer') || 'POS Customer';
      const custPhone = prompt('Enter Mobile Number (Optional):', '') || '';

      if (window.confirm(`Hold this order for ${custName} and start a new one?`)) {
        try {
          const editingOrderId = localStorage.getItem('editing_order_id');
          const token = localStorage.getItem('token');
          const user = JSON.parse(localStorage.getItem('user') || '{}');

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
            branch_id: effectiveBranchId
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

  return (
    <POSLayout>
      <div className="pos-cart-page-container">
        <div className="cart-page-content">
          <CartSidebar
            cart={cart}
            updateQty={updateQty}
            removeFromCart={removeFromCart}
            subtotal={subtotal}
            tax={tax}
            total={total}
            discountPercent={discountPercent}
            setDiscountPercent={setDiscountPercent}
            discountCollapsible
          />
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
                    padding: '6px 12px', background: '#f1f5f9',
                    color: '#475569', borderRadius: '8px',
                    fontSize: '12px', fontWeight: 'bold',
                    border: 'none', cursor: 'pointer'
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
                  <p>No orders currently on hold</p>
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
          </div>
        </div>
      </div>

      <style jsx>{`
        .pos-cart-page-container {
          padding: 1.5rem;
          max-width: 1600px;
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .cart-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .header-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .header-btn.primary {
          background: #3b82f6;
          color: white;
        }

        .header-btn.secondary {
          background: white;
          border-color: #e2e8f0;
          color: #1e293b;
        }

        .header-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .cart-page-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1e293b;
        }

        .cart-page-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 1.5rem;
          align-items: start;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          color: #1e293b;
        }

        .section-title h2 {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
        }

        .editing-tag {
          font-size: 10px;
          background: #fef3c7;
          color: #92400e;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .cart-page-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
          min-height: 500px;
          overflow: hidden;
        }

        .empty-cart-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-cart-state h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .empty-cart-state p {
          color: #64748b;
          margin-bottom: 1.5rem;
        }

        .start-order-btn {
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .held-orders-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .held-order-card {
          background: white;
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.2s;
          cursor: pointer;
        }

        .held-order-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .held-info {
          margin-bottom: 1rem;
        }

        .held-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .held-id {
          font-weight: 800;
          color: #1e293b;
          font-size: 14px;
        }

        .held-time {
          font-size: 12px;
          color: #64748b;
        }

        .held-details {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #64748b;
        }

        .held-amount {
          font-weight: 700;
          color: #10b981;
        }

        .held-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .held-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .held-btn.edit {
          background: #f1f5f9;
          color: #475569;
        }

        .held-btn.proceed {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.2);
        }

        .held-btn:hover {
          opacity: 0.8;
          transform: translateY(-1px);
        }

        /* Adjusting CartSidebar for full page width */
        :global(.cart-sidebar-premium) {
          width: 100% !important;
          max-width: none !important;
          height: auto !important;
          border: none !important;
        }

        :global(.cart-items-container) {
          max-height: 400px !important;
        }
          gap: 0.6rem;
          padding: 10px 20px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          color: #475569;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.9rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .back-to-products:hover {
          border-color: #3b82f6;
          color: #3b82f6;
          transform: translateX(-4px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .cart-page-header h1 {
          font-size: 2rem;
          font-weight: 950;
          background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          letter-spacing: -0.04em;
        }

        .cart-page-content {
          background: transparent;
          border-radius: 0;
          box-shadow: none;
          border: none;
          overflow: visible;
          margin-top: 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* All cart styles are now professionally managed in CartSidebar.css to match the QuickBill design */
      `}</style>
    </POSLayout>
  );
}
