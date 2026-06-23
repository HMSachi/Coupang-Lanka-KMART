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
import { API_BASE_URL } from '../../../config';

export default function CashierDashboard() {
  const navigate = useNavigate();
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
          fetch(`${API_BASE_URL}/api/products/categories`, { headers }),
          fetch(`${API_BASE_URL}/api/products/branch-inventory/${branchId}`, { headers })
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



        {/* Search Box */}
        <div className="pos-search-wrapper" style={{ marginTop: '24px' }}>
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
