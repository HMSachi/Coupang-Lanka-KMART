import React, { useState } from 'react';
import { X, ShoppingCart, Tag, Package, CreditCard, Info, Calendar, Hash } from 'lucide-react';
import Button from '../../../components/shared/Button';

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
    const [selectedImageIdx, setSelectedImageIdx] = useState(0);

    if (!product) return null;

    const isOutOfStock = product.branch_stock === 0;

    // Handle multiple images
    const images = product.image_urls && product.image_urls.length > 0
        ? product.image_urls
        : null;

    const mainImage = images
        ? `http://localhost:5000${images[selectedImageIdx]}`
        : null;

    return (
        <div className="product-modal-overlay" onClick={onClose}>
            <div className="product-modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="product-modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="product-modal-content">
                    {/* LEFT PANEL: IMAGE STAGE */}
                    <div className="product-modal-left">
                        <div className="image-stage">
                            {mainImage ? (
                                <div className="flex flex-col items-center w-full">
                                    <div className="premium-image-box">
                                        <img src={mainImage} alt={product.name} className="product-modal-img" />
                                    </div>
                                    {images.length > 1 && (
                                        <div className="thumbnail-strip">
                                            {images.map((url, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedImageIdx(idx)}
                                                    className={`thumb-btn ${selectedImageIdx === idx ? 'active' : ''}`}
                                                >
                                                    <img src={`http://localhost:5000${url}`} alt="thumb" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="placeholder-stage">
                                    <span className="product-modal-emoji">{product.image}</span>
                                </div>
                            )}
                            <div className="stage-glow"></div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: PRODUCT INTELLIGENCE */}
                    <div className="product-modal-right">
                        {/* Header Section */}
                        <div className="product-modal-header">
                            <div className="header-top">
                                <span className="product-modal-category">{product.category}</span>
                                {product.discount_value > 0 && (
                                    <div className="discount-pill">
                                        <Tag size={12} />
                                        <span>-{product.discount_value}{product.discount_type === 'percentage' ? '%' : ' LKR'} OFF</span>
                                    </div>
                                )}
                            </div>
                            <h2 className="product-modal-title">{product.name}</h2>
                            <div className="product-identifier-grid">
                                <div className="id-chip">
                                    <Hash size={12} />
                                    <span>Item ID: {product.id}</span>
                                </div>
                            </div>
                        </div>

                        {/* Primary Stats Grid */}
                        <div className="product-modal-stats">
                            <div className="product-modal-stat-card">
                                <div className="stat-icon-wrapper price">
                                    <CreditCard size={18} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Retail Price</span>
                                    <span className="stat-value">LKR {product.price.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="product-modal-stat-card">
                                <div className={`stat-icon-wrapper stock ${isOutOfStock ? 'danger' : 'success'}`}>
                                    <Package size={18} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Stock Status</span>
                                    <span className={`stat-value ${isOutOfStock ? 'danger' : 'success'}`}>
                                        {isOutOfStock ? 'Out of Stock' : `${product.branch_stock} In Stock`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Metadata Grid */}
                        <div className="metadata-grid">
                            <div className="meta-card">
                                <div className="meta-icon-box orange">
                                    <Calendar size={14} />
                                </div>
                                <div className="meta-content">
                                    <span className="meta-label">Expiry Date</span>
                                    <span className="meta-value">{product.expiry_date ? new Date(product.expiry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Expiry'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="product-modal-description">
                            <div className="desc-header">
                                <Info size={14} />
                                <span>Product Overview</span>
                            </div>
                            <p className="desc-text text-sm">
                                {product.description || "Official Coupang Kmart retail product. This item undergoes rigorous quality checks to ensure the highest standards for our customers."}
                            </p>
                        </div>

                        {/* Footer Actions */}
                        <div className="product-modal-actions">
                            <Button
                                variant="primary"
                                fullWidth
                                size="lg"
                                onClick={() => {
                                    onAddToCart(product);
                                    onClose();
                                }}
                                disabled={isOutOfStock}
                                className="modal-checkout-btn"
                            >
                                <ShoppingCart size={20} className="mr-2" />
                                {isOutOfStock ? 'Out of Stock' : 'Add to Current Order'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
