import React, { useState } from 'react';
import PosHeader from '../components/PosHeader';
import CategoryTabs from '../components/CategoryTabs';
import ProductGrid from '../components/ProductGrid';
import CartSidebar from '../components/CartSidebar';
import '../styles/cashier.css';

const CATEGORIES = ['All', 'Face', 'Eyes', 'Lips', 'Skincare', 'Fragrances'];

const MOCK_PRODUCTS = [
  { id: 1, name: 'MAC Studio Fix Foundation', price: 9500, category: 'Face', stock: 24, image: '🎨' },
  { id: 2, name: 'Maybelline Fit Me Concealer', price: 2450, category: 'Face', stock: 18, image: '🖌️' },
  { id: 3, name: 'Fenty Beauty Gloss Bomb', price: 6800, category: 'Lips', stock: 45, image: '💄' },
  { id: 4, name: 'Huda Beauty Nude Palette', price: 18500, category: 'Eyes', stock: 12, image: '👁️' },
  { id: 5, name: 'Clinique Moisture Surge', price: 11500, category: 'Skincare', stock: 30, image: '🧴' },
  { id: 6, name: 'Dior Sauvage 100ml', price: 34500, category: 'Fragrances', stock: 50, image: '💨' },
  { id: 7, name: "L'Oreal Paris Mascara", price: 3200, category: 'Eyes', stock: 28, image: '👁️‍🗨️' },
  { id: 8, name: 'Chanel No 5 Parfum', price: 42000, category: 'Fragrances', stock: 15, image: '✨' },
  { id: 9, name: 'Anastasia Brow Wiz', price: 5400, category: 'Eyes', stock: 40, image: '✏️' },
  { id: 10, name: 'NARS Blush Orgasm', price: 8200, category: 'Face', stock: 60, image: '🌸' },
];

export default function CashierDashboard({ onLogout, theme = 'light', onToggleTheme }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : item;
        }
        return item;
      });
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05; // 5% fake tax
  const total = subtotal + tax;

  return (
    <div className={`cashier-layout ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      <button
        className="dashboard-theme-toggle"
        onClick={onToggleTheme}
        type="button"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4V2M12 22v-2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 14.5A9 9 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"/>
          </svg>
        )}
      </button>
      {/* Left: Product Selection */}
      <main className="pos-main">
        <PosHeader 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          onLogout={onLogout} 
        />
        
        <CategoryTabs 
          categories={CATEGORIES} 
          activeCategory={activeCategory} 
          setActiveCategory={setActiveCategory} 
        />

        <ProductGrid 
          products={filteredProducts} 
          onAddToCart={addToCart} 
        />
      </main>

      {/* Right: Cart & Billing */}
      <CartSidebar 
        cart={cart}
        updateQty={updateQty}
        removeFromCart={removeFromCart}
        subtotal={subtotal}
        tax={tax}
        total={total}
      />
    </div>
  );
}
