import React from 'react';

export default function ProductGrid({ products, onAddToCart }) {
  return (
    <div className="pos-products">
      {products.length === 0 ? (
        <div className="empty-state">No cosmetics found</div>
      ) : (
        products.map(product => (
          <div className="product-card" key={product.id} onClick={() => onAddToCart(product)}>
            <div className="product-img">{product.image}</div>
            <div className="product-info">
              <h4 className="p-name">{product.name}</h4>
              <div className="p-price">Rs. {product.price.toFixed(2)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
