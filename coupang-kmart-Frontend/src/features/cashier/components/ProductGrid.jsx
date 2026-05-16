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
        // Only show details if the click wasn't on the plus button
        if (!e.target.closest('.add-to-cart-bubble')) {
          onShowDetails(product);
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className="product-image-container">
        {product.image_urls && product.image_urls.length > 0 ? (
          <img
            src={`http://localhost:5000${product.image_urls[0]}`}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <span className="product-emoji">{product.image}</span>
        )}
        {isOutOfStock && <div className="stock-overlay">Out of Stock</div>}
        {isLowStock && <div className="stock-badge-low">Low Stock</div>}
      </div>

      <div className="product-info-premium">
        <div className="product-category-label">{product.category}</div>
        <h4 className="product-name-premium">{product.name}</h4>

        <div className="product-footer-premium">
          <div className="product-price-premium">
            <span className="currency">LKR</span>
            <span className="amount">{product.price.toLocaleString()}</span>
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
            <Plus size={16} />
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
