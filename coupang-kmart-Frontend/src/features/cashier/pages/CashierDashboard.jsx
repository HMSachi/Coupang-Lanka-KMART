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
  const drawerStatCardStyle = {
    background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #d8e1ec',
    boxShadow: '0 2px 7px rgba(15, 23, 42, 0.04)',
    minHeight: '96px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };
  const drawerLabelStyle = {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    marginBottom: '8px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  };
  const drawerValueStyle = {
    fontSize: '17px',
    fontWeight: '650',
    color: '#1f2937',
    lineHeight: 1.35
  };
  const drawerChipStyle = {
    alignSelf: 'flex-start',
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    borderRadius: '999px',
    color: '#991b1b',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.04em',
    padding: '3px 8px',
    textTransform: 'uppercase'
  };

  return (
    <POSLayout>
      <div className="pos-dashboard-full">

        {/* Dashboard Overview Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Dashboard Overview</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              <span style={{ width: '6px', height: '6px', background: '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span>
              SYSTEM ONLINE
            </span>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '10px', padding: '28px', color: '#111827', marginBottom: '24px', border: '1px solid #dbe3ee', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.07)' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', paddingBottom: '22px', borderBottom: '1px solid #e5eaf1' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '999px', color: '#1d4ed8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.04em', padding: '5px 10px', textTransform: 'uppercase', marginBottom: '10px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', display: 'inline-block' }}></span>
                    Current Shift
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 6px 0', color: '#111827' }}>Live Cash Drawer Tracker</h2>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Real-time financial summary for the current cashier session</p>
                </div>
                <div style={{ textAlign: 'right', background: '#fffafa', border: '1px solid #fecdd3', borderRadius: '8px', padding: '14px 18px', minWidth: '220px', boxShadow: 'inset 3px 0 0 #e51f2a' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Expected Cash</div>
                  <div style={{ fontSize: '27px', fontWeight: '650', color: '#1f2937', lineHeight: 1.15 }}>Rs. {drawerMetrics.expectedCash.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '16px', marginTop: '22px' }}>
                <div style={drawerStatCardStyle}>
                  <div>
                    <div style={drawerLabelStyle}>Opening</div>
                    <div style={drawerValueStyle}>Rs. {drawerMetrics.openingBalance.toLocaleString()}</div>
                  </div>
                  <span style={drawerChipStyle}>Session Start</span>
                </div>
                <div style={drawerStatCardStyle}>
                  <div>
                    <div style={drawerLabelStyle}>Cash Sales</div>
                    <div style={drawerValueStyle}>Rs. {drawerMetrics.cashSales.toLocaleString()}</div>
                  </div>
                  <span style={drawerChipStyle}>Order Payments</span>
                </div>
                <div style={drawerStatCardStyle}>
                  <div>
                    <div style={drawerLabelStyle}>Card Sales</div>
                    <div style={drawerValueStyle}>Rs. {drawerMetrics.cardSales.toLocaleString()}</div>
                  </div>
                  <span style={drawerChipStyle}>Non-Cash</span>
                </div>
                <div style={drawerStatCardStyle}>
                  <div>
                    <div style={drawerLabelStyle}>Cash In / Out</div>
                    <div style={drawerValueStyle}>
                      {drawerMetrics.cashIn > 0 ? `In Rs. ${drawerMetrics.cashIn.toLocaleString()}` : ''}
                      {drawerMetrics.cashIn > 0 && drawerMetrics.cashOut > 0 ? ' / ' : ''}
                      {drawerMetrics.cashOut > 0 ? `Out Rs. ${drawerMetrics.cashOut.toLocaleString()}` : ''}
                      {drawerMetrics.cashIn === 0 && drawerMetrics.cashOut === 0 ? 'Rs. 0' : ''}
                    </div>
                  </div>
                  <span style={drawerChipStyle}>Adjustments</span>
                </div>
                <div style={drawerStatCardStyle}>
                  <div>
                    <div style={drawerLabelStyle}>Refunds</div>
                    <div style={drawerValueStyle}>Rs. {drawerMetrics.refunds.toLocaleString()}</div>
                  </div>
                  <span style={drawerChipStyle}>Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="pos-search-wrapper" style={{ marginTop: '24px' }}>
          <div className="pos-search-glow"></div>
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
