import React from 'react';
import Button from '../../../components/shared/Button';
import { Plus } from 'lucide-react';

const ProductItem = ({ product, onAddToCart }) => {
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock < 10;

  return (
    <div className={`product-card-premium ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <div className="product-image-container">
        <span className="product-emoji">{product.image}</span>
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
            onClick={() => onAddToCart(product)}
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

export default function ProductGrid({ products, onAddToCart }) {
  return (
    <div className="product-grid-premium">
      {products.map((product) => (
        <ProductItem
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
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
