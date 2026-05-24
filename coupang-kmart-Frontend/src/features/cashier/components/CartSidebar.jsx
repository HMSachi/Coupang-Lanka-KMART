import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, Gift, ChevronUp, ChevronDown, Tag, User, ChevronRight, CheckCircle, Search } from 'lucide-react';
import Button from '../../../components/shared/Button';
import Modal from '../../../components/shared/Modal';
import Card from '../../../components/shared/Card';
import './CartSidebar.css';

export default function CartSidebar({
  cart,
  updateQty,
  removeFromCart,
  subtotal,
  tax,
  total,
  discountPercent,
  setDiscountPercent
}) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [searchQuery, setSearchQuery] = useState('');

  const discountAmount = (subtotal * discountPercent) / 100;
  const finalTotal = total; // Already calculated in parent

  // Calculate total item count (sum of all quantities)
  const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Filter cart items based on search query
  const filteredCart = cart.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheckout = () => {
    if (cart.length === 0) return;
    window.location.href = '/pos/checkout';
  };

  return (
    <aside className="cart-sidebar-premium" aria-label="Cart Sidebar">
      <div className="cart-bill-container">
        {/* Items Header */}
        {cart.length > 0 && (
          <>
            <div style={{ padding: '16px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Items ({totalItemCount.toString().padStart(2, '0')})
              </span>
              <a href="#" style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>See All</a>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 34px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#f8fafc'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.backgroundColor = '#f8fafc';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
          </>
        )}

        <div className="cart-items-container">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <ShoppingCart size={48} />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              {filteredCart.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>
                  <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.9rem' }}>No items match "{searchQuery}"</p>
                </div>
              ) : (
                filteredCart.map((item) => (
                <div key={item.id} className="quickbill-item-card">
                  <div className="qb-item-visual">
                    {item.image_urls && item.image_urls.length > 0 ? (
                      <img
                        src={`http://localhost:5000${item.image_urls[0]}`}
                        alt={item.name}
                        className="qb-item-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<div class="qb-emoji-box"><span>${item.image || '📦'}</span></div>`;
                        }}
                      />
                    ) : (
                      <div className="qb-emoji-box">
                        <span>{item.image || '📦'}</span>
                      </div>
                    )}
                  </div>

                  <div className="qb-item-details">
                    <span className="qb-item-name">{item.name}</span>
                    <div className="qb-item-meta">
                      {item.sku && <span className="qb-meta-tag">SKU: {item.sku}</span>}
                      <span className="qb-unit-price">LKR {item.price.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="qb-item-actions">
                    <div className="qb-action-header">
                      <span className="qb-total-label">Total:</span>
                      <span className="qb-line-total">LKR {(item.price * item.qty).toLocaleString()}</span>
                    </div>
                    <div className="qb-action-controls">
                      <div className="qb-qty-stepper">
                        <button type="button" onClick={() => updateQty(item.id, -1)} disabled={item.qty <= 1}><Minus size={12} /></button>
                        <span className="qb-qty-val">{item.qty.toString().padStart(2, '0')}</span>
                        <button type="button" onClick={() => updateQty(item.id, 1)}><Plus size={12} /></button>
                      </div>
                      <button className="qb-remove-btn" onClick={() => removeFromCart(item.id)} type="button">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
              )}

              {filteredCart.length > 0 && (
              <>
              {/* Calculation area and Final Action */}
              <div className="quickbill-summary-console">
                <div className="qb-summary-details">
                  <div className="qb-summary-row" style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: '600', color: '#64748b' }}>Order #</span>
                    <span style={{ fontWeight: '700', color: '#3b82f6' }}>ORD-{Date.now().toString().slice(-6).toUpperCase()}</span>
                  </div>

                  {/* Discount Section in Summary */}
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                    <p className="qb-discount-label">Apply Promo / Discount (%)</p>
                    <div className="qb-discount-input-box">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                        placeholder="0"
                      />
                      <div className="qb-discount-steppers">
                        <button type="button" onClick={() => setDiscountPercent(prev => Math.min(100, prev + 1))}>
                          <ChevronUp size={14} />
                        </button>
                        <button type="button" onClick={() => setDiscountPercent(prev => Math.max(0, prev - 1))}>
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="qb-summary-row">
                    <span>Sub Total</span>
                    <span>LKR {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="qb-summary-row">
                    <span>Discount</span>
                    <span className="qb-highlight-text">{discountPercent}%</span>
                  </div>
                  <div className="qb-summary-divider"></div>
                  <div className="qb-summary-row qb-total-row">
                    <span>Total Amount</span>
                    <span className="qb-total-amount">LKR {finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  className="qb-place-order-btn"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  <CheckCircle size={20} className="qb-btn-icon" />
                  <span>Place Order</span>
                </button>
              </div>
              </>
              )}
            </>
          )}
        </div>
      </div>
    </aside >
  );
}
