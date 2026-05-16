import React from 'react';
import Button from '../../../components/shared/Button';
import { Plus } from 'lucide-react';

const ProductItem = ({ product, onAddToCart, onShowDetails }) => {
  const isOutOfStock = product.stock === 0 || product.branch_stock === 0;
  const isLowStock = product.branch_stock > 0 && product.branch_stock < 10;

  return (
    <div
      className={`product-card-premium ${isOutOfStock ? 'out-of-stock' : ''}`}
      onClick={(e) => {
        if (!e.target.closest('.add-to-cart-bubble')) {
          onShowDetails(product);
        }
      }}
    >
      <div className="product-image-container">
        {product.image_urls && product.image_urls.length > 0 ? (
          <img
            src={`http://localhost:5000${product.image_urls[0]}`}
            alt={product.name}
            loading="lazy"
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

        <div className="product-footer-premium" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
          <div className="product-price-premium" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="currency" style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700' }}>TOTAL PRICE</span>
            <span className="amount" style={{ fontSize: '15px', fontWeight: '900', color: '#1e293b' }}>Rs. {product.price.toLocaleString()}</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={isOutOfStock}
            className="add-to-cart-bubble"
          >
            <Plus size={20} strokeWidth={3} />
          </Button>
        </div>
      </div>
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
