import React, { useState, useEffect } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import CategoryTabs from '../components/CategoryTabs';
import ProductGrid from '../components/ProductGrid';
import CartSidebar from '../components/CartSidebar';
import ProductDetailModal from '../components/ProductDetailModal';
import '../styles/cashier.css';

// Removed static dummy data as per request - will fetch dynamically in the future
// import { CATEGORIES, DUMMY_PRODUCTS } from '../../../services/dummyData';

import { useNavigate } from 'react-router-dom';
import '../styles/cashier.css';

export default function CashierDashboard() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [session, setSession] = useState(null);
  const [drawerMetrics, setDrawerMetrics] = useState({
    openingBalance: 0,
    cashSales: 0,
    cardSales: 0,
    bankTransfers: 0,
    refunds: 0,
    cashIn: 0,
    cashOut: 0,
    expectedCash: 0,
    drawerBalance: 0
  });

  // Session Check
  useEffect(() => {
    const activeSession = localStorage.getItem('active_session');
    if (activeSession) {
      const sess = JSON.parse(activeSession);
      setSession(sess);

      // Calculate metrics from logs
      const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
      const cashSales = logs.filter(l => l.type === 'CASH_SALE').reduce((sum, l) => sum + l.amount, 0);
      const cardSales = logs.filter(l => l.type === 'CARD_SALE').reduce((sum, l) => sum + l.amount, 0);
      const refunds = logs.filter(l => l.type === 'REFUND').reduce((sum, l) => sum + l.amount, 0);
      const cashIn = logs.filter(l => l.type === 'CASH_IN').reduce((sum, l) => sum + l.amount, 0);
      const cashOut = logs.filter(l => l.type === 'CASH_OUT').reduce((sum, l) => sum + l.amount, 0);
      const opening = sess.openingBalance || 0;

      const expectedCash = opening + cashSales + cashIn - refunds - cashOut;

      setDrawerMetrics({
        openingBalance: opening,
        cashSales,
        cardSales,
        bankTransfers: 0,
        refunds,
        cashIn,
        cashOut,
        expectedCash,
        drawerBalance: expectedCash
      });
    }
  }, [navigate]);

  // Empty inventory states, ready for backend integration later
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);

  // Fetch Live Inventory from DB 
  useEffect(() => {
    const fetchLiveInventory = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      let branchId = user.branch_id;
      const role = user.role ? user.role.toLowerCase() : '';

      if (!branchId) {
        if (role === 'admin' || role === 'superadmin') {
          console.warn('No branch_id found for admin, defaulting to Branch 1 for POS visualization.');
          branchId = 1;
        } else {
          console.warn('No branch_id found in session.');
          return;
        }
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

        if (!Array.isArray(catData) || !Array.isArray(prodData)) {
          console.error('Invalid response format from inventory API:', { catData, prodData });
          setCategories(['All']);
          setProducts([]);
          return;
        }

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
        setProducts([]);
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
  const total = subtotal;
  const tax = 0;

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

          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '16px', padding: '32px', color: 'white', marginBottom: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '20px', opacity: 0.1 }}>
              <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z" /></svg>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0' }}>Live Cash Drawer Tracker</h2>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 24px 0' }}>Real-time monitoring of all financial movements in this session</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Expected Cash</div>
                  <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981' }}>Rs. {drawerMetrics.expectedCash.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginTop: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>OPENING</div>
                  <div style={{ fontSize: '16px', fontWeight: '700' }}>Rs. {drawerMetrics.openingBalance.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>CASH SALES</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>+Rs. {drawerMetrics.cashSales.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>CARD SALES</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6' }}>Rs. {drawerMetrics.cardSales.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>CASH IN / OUT</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b' }}>
                    {drawerMetrics.cashIn > 0 ? `+${drawerMetrics.cashIn}` : ''}
                    {drawerMetrics.cashOut > 0 ? ` -${drawerMetrics.cashOut}` : ''}
                    {drawerMetrics.cashIn === 0 && drawerMetrics.cashOut === 0 ? 'Rs. 0' : ''}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>REFUNDS</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#ef4444' }}>-Rs. {drawerMetrics.refunds.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#334155', padding: '2px 8px', borderRadius: '4px', color: '#e2e8f0' }}>Formula</span>
                  <span>Expected = Opening + Cash Sales + Cash In - Refunds - Cash Out</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      const amount = prompt('Enter Cash IN amount:');
                      if (amount && !isNaN(amount)) {
                        const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
                        logs.push({ type: 'CASH_IN', amount: parseFloat(amount), timestamp: new Date().toISOString(), desc: 'Manual Cash In' });
                        localStorage.setItem('cash_drawer_logs', JSON.stringify(logs));
                        window.location.reload();
                      }
                    }}
                    style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + Cash In
                  </button>
                  <button
                    onClick={() => {
                      const amount = prompt('Enter Cash OUT amount:');
                      if (amount && !isNaN(amount)) {
                        const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
                        logs.push({ type: 'CASH_OUT', amount: parseFloat(amount), timestamp: new Date().toISOString(), desc: 'Manual Cash Out' });
                        localStorage.setItem('cash_drawer_logs', JSON.stringify(logs));
                        window.location.reload();
                      }
                    }}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    - Cash Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {/* Stat Card 1 */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '14px 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TODAY'S SALES</span>
                <div style={{ background: '#ecfdf5', color: '#10b981', padding: '6px', borderRadius: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>Rs. 125,450</h3>
              <p style={{ fontSize: '12px', color: '#16a34a', margin: 0, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                +12.5%
              </p>
            </div>

            {/* Stat Card 2 */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '14px 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TRANSACTIONS</span>
                <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                </div>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>84</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '500' }}>Completed today</p>
            </div>

            {/* Stat Card 3 */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '14px 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CUSTOMERS</span>
                <div style={{ background: '#faf5ff', color: '#a855f7', padding: '6px', borderRadius: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>112</h3>
              <p style={{ fontSize: '12px', color: '#16a34a', margin: 0, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                +14 shift
              </p>
            </div>

            {/* Stat Card 4 */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '14px 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>POS STATUS</span>
                <div style={{ background: '#f8fafc', color: '#64748b', padding: '6px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>Healthy</h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '500' }}>Active</p>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="pos-search-wrapper">
          <div className="pos-search-inner">
            <input
              type="text"
              placeholder="Scan Barcode or Search Product (F1)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pos-search-input"
            />
            <svg className="pos-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <div className="pos-search-glow"></div>
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
            onShowDetails={setSelectedProduct}
          />
        </div>

        {/* Product Detail Modal */}
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />

        {/* Optional: Cart Sidebar if you want it on the dashboard too */}
        {/* <div className="pos-dashboard-cart">
          <CartSidebar
            cart={cart}
            updateQty={updateQty}
            removeFromCart={removeFromCart}
            subtotal={subtotal}
            tax={tax}
            total={total}
          />
        </div> */}
      </div>
    </POSLayout >
  );
}
