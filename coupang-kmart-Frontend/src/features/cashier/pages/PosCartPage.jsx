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
          padding: 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .cart-page-header {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .back-to-products {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: white;
          border: 1px solid var(--sidebar-border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-to-products:hover {
          border-color: var(--brand);
          color: var(--brand);
          box-shadow: var(--shadow-sm);
        }

        .cart-page-header h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .cart-page-content {
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          border: 1px solid var(--sidebar-border);
          min-height: 600px;
          padding-bottom: 2rem;
        }

        /* Adjusting CartSidebar for full page width */
        :global(.cart-sidebar-premium) {
          width: 100% !important;
          max-width: none !important;
          height: auto !important;
          border: none !important;
        }

        :global(.cart-items-container) {
          max-height: 500px !important;
        }
      `}</style>
    </POSLayout>
  );
}
