import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import POSLayout from '../../../layouts/POSLayout';
import CategoryTabs from '../components/CategoryTabs';
import ProductGrid from '../components/ProductGrid';
import CartSidebar from '../components/CartSidebar';
import ProductDetailModal from '../components/ProductDetailModal';
import '../styles/cashier.css';
import '../styles/cashier-dashboard.css';

// Removed static dummy data as per request - will fetch dynamically in the future
// import { CATEGORIES, DUMMY_PRODUCTS } from '../../../services/dummyData';

import { useNavigate } from 'react-router-dom';

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
      <div className="pos-dashboard-full">

        {/* Dashboard Overview Section */}
        <div className="dash-overview">
          <div className="dash-overview-top">
            <h1>Dashboard Overview</h1>
            <span className="dash-status-badge">
              <span className="dash-status-dot" />
              SYSTEM ONLINE
            </span>
          </div>

          <div className="dash-drawer-hero">
            <div className="dash-drawer-decor">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z" /></svg>
            </div>
            <div className="dash-drawer-inner">
              <div className="dash-drawer-top">
                <div>
                  <h2>Live Cash Drawer Tracker</h2>
                  <p>Real-time monitoring of all financial movements in this session</p>
                </div>
                <div className="dash-expected-block">
                  <div className="dash-expected-label">Expected Cash</div>
                  <div className="dash-expected-value">Rs. {drawerMetrics.expectedCash.toLocaleString()}</div>
                </div>
              </div>

              <div className="dash-metrics-grid">
                <div className="dash-metric-cell">
                  <div className="dash-metric-label">OPENING</div>
                  <div className="dash-metric-value">Rs. {drawerMetrics.openingBalance.toLocaleString()}</div>
                </div>
                <div className="dash-metric-cell">
                  <div className="dash-metric-label">CASH SALES</div>
                  <div className="dash-metric-value dash-metric-value--positive">+Rs. {drawerMetrics.cashSales.toLocaleString()}</div>
                </div>
                <div className="dash-metric-cell">
                  <div className="dash-metric-label">CARD SALES</div>
                  <div className="dash-metric-value dash-metric-value--card">Rs. {drawerMetrics.cardSales.toLocaleString()}</div>
                </div>
                <div className="dash-metric-cell">
                  <div className="dash-metric-label">CASH IN / OUT</div>
                  <div className="dash-metric-value dash-metric-value--warning">
                    {drawerMetrics.cashIn > 0 ? `+${drawerMetrics.cashIn}` : ''}
                    {drawerMetrics.cashOut > 0 ? ` -${drawerMetrics.cashOut}` : ''}
                    {drawerMetrics.cashIn === 0 && drawerMetrics.cashOut === 0 ? 'Rs. 0' : ''}
                  </div>
                </div>
                <div className="dash-metric-cell">
                  <div className="dash-metric-label">REFUNDS</div>
                  <div className="dash-metric-value dash-metric-value--danger">-Rs. {drawerMetrics.refunds.toLocaleString()}</div>
                </div>
              </div>

              <div className="dash-formula-row">
                <div className="dash-formula-text">
                  <span className="dash-formula-chip">Formula</span>
                  <span>Expected = Opening + Cash Sales + Cash In - Refunds - Cash Out</span>
                </div>

                <div className="dash-actions">
                  <button
                    type="button"
                    className="dash-btn-cash-in"
                    onClick={() => {
                      const amount = prompt('Enter Cash IN amount:');
                      if (amount && !isNaN(amount)) {
                        const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
                        logs.push({ type: 'CASH_IN', amount: parseFloat(amount), timestamp: new Date().toISOString(), desc: 'Manual Cash In' });
                        localStorage.setItem('cash_drawer_logs', JSON.stringify(logs));
                        window.location.reload();
                      }
                    }}
                  >
                    + Cash In
                  </button>
                  <button
                    type="button"
                    className="dash-btn-cash-out"
                    onClick={() => {
                      const amount = prompt('Enter Cash OUT amount:');
                      if (amount && !isNaN(amount)) {
                        const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
                        logs.push({ type: 'CASH_OUT', amount: parseFloat(amount), timestamp: new Date().toISOString(), desc: 'Manual Cash Out' });
                        localStorage.setItem('cash_drawer_logs', JSON.stringify(logs));
                        window.location.reload();
                      }
                    }}
                  >
                    - Cash Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="dash-stats-grid">
            <div className="dash-stat-card">
              <div className="dash-stat-header">
                <span className="dash-stat-label">TODAY&apos;S SALES</span>
                <div className="dash-stat-icon dash-stat-icon--green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
              </div>
              <h3 className="dash-stat-value">Rs. 125,450</h3>
              <p className="dash-stat-sub dash-stat-sub--green">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                +12.5%
              </p>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-header">
                <span className="dash-stat-label">TRANSACTIONS</span>
                <div className="dash-stat-icon dash-stat-icon--brand">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                </div>
              </div>
              <h3 className="dash-stat-value">84</h3>
              <p className="dash-stat-sub dash-stat-sub--muted">Completed today</p>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-header">
                <span className="dash-stat-label">CUSTOMERS</span>
                <div className="dash-stat-icon dash-stat-icon--purple">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
              </div>
              <h3 className="dash-stat-value">112</h3>
              <p className="dash-stat-sub dash-stat-sub--green">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                +14 shift
              </p>
            </div>

            <div className="dash-stat-card">
              <div className="dash-stat-header">
                <span className="dash-stat-label">POS STATUS</span>
                <div className="dash-stat-icon dash-stat-icon--neutral">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
              </div>
              <h3 className="dash-stat-value">Healthy</h3>
              <p className="dash-stat-sub dash-stat-sub--muted">Active</p>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="pos-search-wrapper">
          <div className="pos-search-inner">
            <Search className="pos-search-icon" size={20} strokeWidth={2.25} aria-hidden="true" />
            <input
              type="text"
              placeholder="Scan Barcode or Search Product (F1)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pos-search-input"
              aria-label="Search products"
            />
            <div className="pos-search-glow" aria-hidden="true" />
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
