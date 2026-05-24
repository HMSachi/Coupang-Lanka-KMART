import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode, Gift, ChevronUp, ChevronDown, Tag } from 'lucide-react';
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

  const discountAmount = (subtotal * discountPercent) / 100;
  const finalTotal = total; // Already calculated in parent

  // Calculate total item count (sum of all quantities)
  const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    window.location.href = '/pos/checkout';
  };

  return (
    <aside className="cart-sidebar-premium" aria-label="Cart Sidebar">
      <div className="cart-bill-container">
        {/* Customer & Order Context Area */}
        <div className="qb-context-section">
          <div className="qb-customer-context">
            <div className="qb-context-icon"><User size={18} /></div>
            <div className="qb-context-info">
              <span className="qb-context-label">Walk-in Customer</span>
              <span className="qb-context-sub">Select or search customer...</span>
            </div>
            <ChevronRight size={16} className="qb-context-arrow" />
          </div>

          <div className="qb-order-meta">
            <span className="qb-order-badge">ORD-77492</span>
            <span className="qb-time-badge">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="cart-items-container">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <ShoppingCart size={48} />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              {cart.map((item) => (
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
              ))}

              {/* Calculation area and Final Action */}
              <div className="quickbill-summary-console">
                <div className="qb-discount-section">
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

                <div className="qb-summary-details">
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
        </div>
      </div>
    </aside >
  );
}
