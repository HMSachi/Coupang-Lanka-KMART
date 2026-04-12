import React, { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, QrCode } from 'lucide-react';
import Button from '../../../components/shared/Button';
import Modal from '../../../components/shared/Modal';
import Card from '../../../components/shared/Card';
import './CartSidebar.css';

export default function CartSidebar({ cart, updateQty, removeFromCart, subtotal, tax, total }) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountPercent, setDiscountPercent] = useState(0);

  const discountAmount = (subtotal * discountPercent) / 100;
  const finalTotal = total - discountAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsPaymentOpen(true);
  };

  const handleCompleteOrder = () => {
    alert('Order completed successfully!');
    setIsPaymentOpen(false);
    // In a real app, we would clear the cart and save the transaction here
  };

  return (
    <aside className="cart-sidebar-premium" aria-label="Cart Sidebar">
      <div className="cart-header-premium">
        <h3>Current Order</h3>
        <span className="cart-count">{cart.length} Items</span>
      </div>

      <div className="cart-items-container">
        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <ShoppingCart size={48} />
            <p>Your cart is empty</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="cart-item-premium">
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <div className="cart-item-price">LKR {item.price.toLocaleString()}</div>
              </div>
              <div className="cart-item-actions">
                <div className="qty-control">
                  <button onClick={() => updateQty(item.id, -1)} type="button"><Minus size={14} /></button>
                  <span className="qty-val">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} type="button"><Plus size={14} /></button>
                </div>
                <button className="remove-item" onClick={() => removeFromCart(item.id)} type="button">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-summary-premium">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>LKR {subtotal.toLocaleString()}</span>
        </div>

        <div className="summary-details-premium">
          <div className="summary-row">
            <span>Tax (5%)</span>
            <span>LKR {tax.toLocaleString()}</span>
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
              <span>Savings</span>
              <span>- LKR {discountAmount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="summary-row total">
          <span>Total Payable</span>
          <span>LKR {finalTotal.toLocaleString()}</span>
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="checkout-btn"
        >
          Pay LKR {finalTotal.toLocaleString()}
        </Button>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title="Payment & Checkout"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCompleteOrder}>Complete Order</Button>
          </>
        }
      >
        <div className="payment-grid">
          <div className="payment-methods">
            <label>Select Payment Method</label>
            <div className="methods-list">
              <div
                className={`method-card ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote size={24} />
                <span>Cash</span>
              </div>
              <div
                className={`method-card ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={24} />
                <span>Card</span>
              </div>
              <div
                className={`method-card ${paymentMethod === 'qr' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('qr')}
              >
                <QrCode size={24} />
                <span>QR Pay</span>
              </div>
            </div>
          </div>

          <div className="order-receipt-preview">
            <Card title="Receipt Preview" padding="md" glass>
              <div className="receipt-dummy">
                <div className="receipt-header">
                  <strong>COUPANG KMART</strong>
                  <p>Colombo Branch</p>
                </div>
                <div className="receipt-body">
                  {cart.map(item => (
                    <div key={item.id} className="receipt-line">
                      <span>{item.qty}x {item.name}</span>
                      <span>LKR {(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="divider"></div>
                  <div className="receipt-line total">
                    <strong>Total</strong>
                    <strong>LKR {total.toLocaleString()}</strong>
                  </div>
                </div>
                <div className="receipt-footer">
                  <p>Thank you for shopping!</p>
                  <p>{new Date().toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Modal>
    </aside>
  );
}
