import React, { useState } from 'react';
import Button from '../../../components/shared/Button';
import { Plus, Check } from 'lucide-react';

const ProductItem = ({ product, onAddToCart, onShowDetails }) => {
  const isOutOfStock = product.stock === 0 || product.branch_stock === 0;
  const isLowStock = product.branch_stock > 0 && product.branch_stock < 10;
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  };

  return (
    <div
      className={`product-card-premium ${isOutOfStock ? 'out-of-stock' : ''}`}
      onClick={(e) => {
        if (!e.target.closest('.add-to-cart-bubble')) {
          onShowDetails(product);
        }
      }}
    >
      {/* Added to Cart flash overlay */}
      {justAdded && (
        <div className="added-flash-overlay">
          <Check size={22} strokeWidth={3} />
          <span>Added!</span>
        </div>
      )}

      <div className="product-image-container">
        {product.image_urls && product.image_urls.length > 0 ? (
          <img
            src={`http://localhost:5000${product.image_urls[0]}`}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<div class="flex flex-col items-center justify-center w-full h-full bg-slate-50"><span style="font-size:32px;opacity:0.2">${product.image || '📦'}</span><span style="font-size:9px;color:#94a3b8;font-weight:600;margin-top:4px">No Image</span></div>`;
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50">
            <span className="product-emoji" style={{ fontSize: '32px', opacity: 0.2 }}>{product.image || '📦'}</span>
            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '600', marginTop: '4px' }}>No Image</span>
          </div>
        )}
        {isOutOfStock && <div className="stock-overlay" style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#ef4444' }}>OUT OF STOCK</div>}
        {isLowStock && !isOutOfStock && <div className="stock-badge-low">LOW STOCK</div>}
      </div>

      <div className="product-info-premium">
        <div className="product-category-label">{product.category}</div>
        <h4 className="product-name-premium" title={product.name}>{product.name}</h4>

        <p className="product-desc-mini">
          {product.description || "Fresh premium selection from our KMART inventory."}
        </p>

        <div className="product-footer-premium">
          <div className="product-price-premium">
            <span className="currency">TOTAL PRICE</span>
            <span className="amount">Rs. {product.price.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`add-to-cart-bubble ${justAdded ? 'added-success' : ''}`}
      >
        {justAdded ? <Check size={28} strokeWidth={3} /> : <Plus size={28} strokeWidth={2.5} />}
      </Button>
    </div>
  );
};

export default function ProductGrid({ products, onAddToCart, onShowDetails }) {
  return (
    <div className="product-grid-premium">
      {products.map((product) => (
        <ProductItem
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onShowDetails={onShowDetails}
        />
      ))}
      {products.length === 0 && (
        <div className="no-results-premium">
          <p>No products found matching your search.</p>
        </div>
      )}
    </div>
  );
}
