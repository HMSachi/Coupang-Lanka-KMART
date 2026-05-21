import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode } from 'lucide-react';
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

  const handleCheckout = () => {
    if (cart.length === 0) return;
    window.location.href = '/pos/checkout';
  };

  return (
    <aside className="cart-sidebar-premium" aria-label="Cart Sidebar">
      <div className="cart-header-premium">
        <h3>Current Order</h3>
        <span className="cart-count">{cart.length} Items</span>
      </div>

      <div className="cart-bill-container">
        <div className="bill-header">
          <span>Item Description</span>
          <span>Price</span>
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
                <div key={item.id} className="cart-item-bill-premium">
                  <div className="bill-item-main">
                    <div className="bill-item-visual">
                      {item.image_urls && item.image_urls.length > 0 ? (
                        <img
                          src={`http://localhost:5000${item.image_urls[0]}`}
                          alt={item.name}
                          className="bill-item-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<div class="bill-item-emoji-box"><span>${item.image || '📦'}</span></div>`;
                          }}
                        />
                      ) : (
                        <div className="bill-item-emoji-box">
                          <span>{item.image || '📦'}</span>
                        </div>
                      )}
                    </div>
                    <div className="bill-item-details">
                      <div className="bill-item-title">
                        <span className="bill-qty">{item.qty}x</span>
                        <div className="bill-name-wrapper">
                          <span className="bill-name">{item.name}</span>
                          <small className="bill-unit-price">@ LKR {item.price.toLocaleString()}</small>
                        </div>
                      </div>

                      <div className="bill-item-right">
                        <div className="qty-control-mini">
                          <button onClick={() => updateQty(item.id, -1)} type="button"><Minus size={10} /></button>
                          <span className="qty-val-mini">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} type="button"><Plus size={10} /></button>
                        </div>

                        <div className="bill-item-price">
                          LKR {(item.price * item.qty).toLocaleString()}
                        </div>

                        <button className="remove-item-mini" onClick={() => removeFromCart(item.id)} type="button">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Calculation area and Final Action */}
              <div className="cart-scroll-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>LKR {subtotal.toLocaleString()}</span>
                </div>

                <div className="discount-control-premium">
                  <span>Apply Discount (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="disc-input-premium"
                  />
                </div>

                {discountPercent > 0 && (
                  <div className="summary-row discount-row">
                    <span>Discount Savings</span>
                    <span>- LKR {discountAmount.toLocaleString()}</span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="summary-row">
                    <span>Estimated Tax</span>
                    <span>LKR {tax.toLocaleString()}</span>
                  </div>
                )}

                <div className="summary-divider"></div>

                <div className="total-payable-small">
                  <span>Total Payable</span>
                  <span>LKR {finalTotal.toLocaleString()}</span>
                </div>

                <Button
                  fullWidth
                  size="md"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="checkout-btn"
                >
                  Complete Order
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside >
  );
}
