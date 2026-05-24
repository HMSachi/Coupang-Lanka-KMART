import React, { useState, useEffect } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import CartSidebar from '../components/CartSidebar';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PosCartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [discountPercent, setDiscountPercent] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('pos_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setIsLoaded(true);
  }, []);

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

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;
  const tax = 0;

  return (
    <POSLayout>
      <div className="pos-cart-page-container">
        <div className="cart-page-header">
          <button className="back-to-products" onClick={() => navigate('/pos')}>
            <ArrowLeft size={18} />
            <span>Add More Products</span>
          </button>
          <h1>Review Order</h1>
        </div>

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
          />
        </div>
      </div>

      <style jsx>{`
        .pos-cart-page-container {
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
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .back-to-products {
          display: flex;
          align-items: center;
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
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* All cart styles are now professionally managed in CartSidebar.css to match the QuickBill design */
      `}</style>
    </POSLayout>
  );
}
