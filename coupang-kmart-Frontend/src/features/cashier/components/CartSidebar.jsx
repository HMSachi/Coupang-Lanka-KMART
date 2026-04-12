import React from 'react';
import { ShoppingCart, Minus, Plus, Trash2, Banknote, CreditCard, QrCode } from 'lucide-react';

export default function CartSidebar({ cart, updateQty, removeFromCart, subtotal, tax, total }) {
  return (
    <aside className="pos-sidebar" aria-label="Cart Sidebar">
      <div className="cart-header">
        <h2>Current Order</h2>
        <div className="cart-meta">Order #C-1098</div>
      </div>

      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <ShoppingCart size={48} className="empty-icon" />
            <p>Cart is empty</p>
          </div>
        ) : (
          cart.map(item => (
            <div className="cart-item" key={item.id}>
              <div className="item-details">
                <div className="item-name">{item.name}</div>
                <div className="item-price">Rs. {item.price.toFixed(2)}</div>
              </div>
              <div className="item-controls">
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)} type="button"><Minus size={14}/></button>
                  <span className="qty-val">{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)} type="button"><Plus size={14}/></button>
                </div>
                <div className="item-total">Rs. {(item.price * item.qty).toFixed(2)}</div>
                <button className="delete-btn" onClick={() => removeFromCart(item.id)} type="button">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>Rs. {subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Tax (5%)</span>
          <span>Rs. {tax.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>Rs. {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="payment-actions">
        <button className="pay-method-btn" type="button">
          <Banknote size={20} />
          <span>Cash</span>
        </button>
        <button className="pay-method-btn" type="button">
          <CreditCard size={20} />
          <span>Card</span>
        </button>
        <button className="pay-method-btn" type="button">
          <QrCode size={20} />
          <span>LankaQR</span>
        </button>
      </div>
      
      <button className="checkout-btn" disabled={cart.length === 0} type="button">
        Pay Rs. {total.toFixed(2)}
      </button>
    </aside>
  );
}
