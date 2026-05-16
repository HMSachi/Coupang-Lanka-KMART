import React, { useState, useEffect } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import CategoryTabs from '../components/CategoryTabs';
import ProductGrid from '../components/ProductGrid';
import CartSidebar from '../components/CartSidebar';
import ProductDetailModal from '../components/ProductDetailModal';
import '../styles/cashier.css';

// Removed static dummy data as per request - will fetch dynamically in the future
// import { CATEGORIES, DUMMY_PRODUCTS } from '../../../services/dummyData';

export default function CashierDashboard() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Empty inventory states, ready for backend integration later
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);

  // Fetch Live Inventory from DB 
  useEffect(() => {
    const fetchLiveInventory = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const branchId = user.branch_id;

      if (!branchId) {
        console.warn('No branch_id found in session.');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const [catRes, prodRes] = await Promise.all([
          fetch('http://localhost:5000/api/products/categories', { headers }),
          fetch(`http://localhost:5000/api/products/branch-inventory/${branchId}`, { headers })
        ]);

        const catData = await catRes.json();
        const prodData = await prodRes.json();

        const liveCategories = ['All', ...catData.map(c => c.name)];
        const liveProducts = prodData.map(p => ({
          id: p.product_id || p.id,
          name: p.name,
          category: p.category_name || 'All',
          price: parseFloat(p.price || p.base_price),
          image: p.image_url || '🛒',
          branch_stock: p.stock_quantity || 0,
          description: p.description,
          unit_type: p.unit_type,
          discount_value: p.discount_value,
          discount_type: p.discount_type,
          tax_percentage: p.tax_percentage,
          expiry_date: p.expiry_date,
          image_urls: p.image_urls || [],
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
      let newCart;
      if (existing) {
        newCart = prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      } else {
        newCart = [...prev, { ...product, qty: 1 }];
      }
      window.dispatchEvent(new Event('cartUpdated'));
      return newCart;
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
    }
  }, [cart, isLoaded]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  return (
    <POSLayout>
      <div className="pos-dashboard-full" style={{ padding: '24px', backgroundColor: '#f8fafc', height: '100%', overflowY: 'auto' }}>
        
        {/* Dashboard Overview Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Dashboard Overview</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              <span style={{ width: '6px', height: '6px', background: '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span>
              SYSTEM ONLINE
            </span>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', borderRadius: '16px', padding: '32px', color: 'white', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>Good afternoon, Cashier!</h2>
              <p style={{ fontSize: '15px', color: '#e0e7ff', margin: 0, opacity: 0.9 }}>Here is what's happening with your shift today.</p>
            </div>
            <button style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              View Storefront
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {/* Stat Card 1 */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TODAY'S SALES</span>
                <div style={{ background: '#ecfdf5', color: '#10b981', padding: '8px', borderRadius: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>Rs. 125,450</h3>
              <p style={{ fontSize: '13px', color: '#16a34a', margin: 0, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                +12.5% from yesterday
              </p>
            </div>

          <div className="pos-product-scroller">
            <ProductGrid
              products={filteredProducts}
              onAddToCart={addToCart}
              onShowDetails={setSelectedProduct}
            {/* Stat Card 2 */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TRANSACTIONS</span>
                <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '8px', borderRadius: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </div>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>84</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>Completed today</p>
            </div>

            {/* Stat Card 3 */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CUSTOMERS SERVED</span>
                <div style={{ background: '#faf5ff', color: '#a855f7', padding: '8px', borderRadius: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>112</h3>
              <p style={{ fontSize: '13px', color: '#16a34a', margin: 0, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                +14 this shift
              </p>
            </div>

            {/* Stat Card 4 */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>POS STATUS</span>
                <div style={{ background: '#f8fafc', color: '#64748b', padding: '8px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
              </div>
              <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>Healthy</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>Hardware connected</p>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="pos-search-wrapper" style={{ marginTop: '32px' }}>
          <div className="pos-search-glow"></div>
          <div className="pos-search-inner">
            <input
              type="text"
              placeholder="Scan Barcode or Search Product (F1)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pos-search-input"
              style={{ fontSize: '14px', padding: '14px 20px 14px 44px' }}
            />
            <svg className="pos-search-icon" style={{ width: '18px', height: '18px', left: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {/* Product Detail Modal */}
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />

        {/* Right Side: Cart Summary */}
        <div className="pos-dashboard-cart">
          <CartSidebar
            cart={cart}
            updateQty={updateQty}
            removeFromCart={removeFromCart}
            subtotal={subtotal}
            tax={tax}
            total={total}
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
    </POSLayout>
  );
}
