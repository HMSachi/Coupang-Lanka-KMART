import React, { useState, useEffect } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import CategoryTabs from '../components/CategoryTabs';
import ProductGrid from '../components/ProductGrid';
import CartSidebar from '../components/CartSidebar';
import '../styles/cashier.css';

// Removed static dummy data as per request - will fetch dynamically in the future
// import { CATEGORIES, DUMMY_PRODUCTS } from '../../../services/dummyData';

export default function CashierDashboard() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);

  // Empty inventory states, ready for backend integration later
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);

  // Fetch Live Inventory from DB 
  useEffect(() => {
    const fetchLiveInventory = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('http://localhost:5000/api/products/categories'),
          fetch('http://localhost:5000/api/products/items')
        ]);

        const catData = await catRes.json();
        const prodData = await prodRes.json();

        const liveCategories = ['All', ...catData.map(c => c.name)];
        const liveProducts = prodData.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category_name || 'All',
          price: parseFloat(p.base_price),
          image: p.image_url || '🛒',
          color: 'bg-gradient-to-r from-blue-500 to-indigo-500'
        }));

        setCategories(liveCategories);
        setProducts(liveProducts);

      } catch (err) {
        console.error('Error fetching live inventory:', err);
      }
    };
    fetchLiveInventory();
  }, []);

  const filteredProducts = products.filter(p => {
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
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  return (
    <POSLayout>
      <div className="pos-dashboard-grid">

        {/* Left Side: Products and Search */}
        <div className="pos-dashboard-main">
          {/* Search Box */}
          <div className="pos-search-wrapper">
            <div className="pos-search-glow"></div>
            <div className="pos-search-inner">
              <input
                type="text"
                placeholder="Scan Barcode or Search Product (F1)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pos-search-input"
              />
              <svg className="pos-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>

          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />

          <div className="pos-product-scroller">
            <ProductGrid
              products={filteredProducts}
              onAddToCart={addToCart}
            />
          </div>
        </div>

        {/* Right Side: Cart Summary */}
        <div className="pos-dashboard-cart">
          <CartSidebar
            cart={cart}
            updateQty={updateQty}
            removeFromCart={removeFromCart}
            subtotal={subtotal}
            tax={tax}
            total={total}
          />
        </div>

      </div>
    </POSLayout>
  );
}
