import React, { useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import Modal from '../../../components/shared/Modal';
import Input from '../../../components/shared/Input';
import { Package, Plus, Search, Filter, AlertTriangle, ArrowUpDown, MoreHorizontal, Barcode, Tags, Image as ImageIcon, DollarSign, Database } from 'lucide-react';
import { DUMMY_PRODUCTS } from '../../../services/dummyData';

export default function ProductCatalog() {
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Modal States
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Form States
    const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '', image: '📦' });
    const [newCategory, setNewCategory] = useState({ name: '', icon: '🏷️' });

    const categories = ['All', ...new Set(DUMMY_PRODUCTS.map(p => p.category))];

    const filteredProducts = DUMMY_PRODUCTS.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesStock = activeTab === 'low' ? p.stock < 20 : true;
        return matchesSearch && matchesCategory && matchesStock;
    });

    const handleSaveProduct = () => {
        console.log('Saving Product:', newProduct);
        setIsProductModalOpen(false);
        // In a real app, this would refresh data or call an API
    };

    const handleSaveCategory = () => {
        console.log('Saving Category:', newCategory);
        setIsCategoryModalOpen(false);
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <div className="header-info">
                    <h1>Product Catalog</h1>
                    <p>Manage your organization's inventory, pricing, and stock levels.</p>
                </div>
                <div className="header-actions">
                    <Button variant="secondary" icon={Tags} onClick={() => setIsCategoryModalOpen(true)}>Categories</Button>
                    <Button variant="primary" icon={Plus} onClick={() => setIsProductModalOpen(true)}>Add New Product</Button>
                </div>
            </div>

            <div className="inventory-tabs">
                <button
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Products
                    <span className="count">{DUMMY_PRODUCTS.length}</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'low' ? 'active' : ''}`}
                    onClick={() => setActiveTab('low')}
                >
                    Low Stock
                    <span className="count warning">{DUMMY_PRODUCTS.filter(p => p.stock < 20).length}</span>
                </button>
            </div>

            <Card glass padding="none">
                <div className="table-controls-premium">
                    <div className="search-group">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by product name, SKU or barcode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <Filter size={18} />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>
                                    <div className="th-sort">
                                        Price
                                        <ArrowUpDown size={14} />
                                    </div>
                                </th>
                                <th>Stock Level</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="product-cell">
                                            <div className="prod-img">{p.image}</div>
                                            <div className="prod-info">
                                                <span className="name">{p.name}</span>
                                                <span className="sku">SKU: CK-00{p.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="category-pill">{p.category}</span></td>
                                    <td className="fw-600">LKR {p.price.toLocaleString()}</td>
                                    <td>
                                        <div className="stock-level-cell">
                                            <span className={`stock-count ${p.stock < 20 ? 'danger' : ''}`}>{p.stock}</span>
                                            <div className="stock-bar-bg">
                                                <div
                                                    className={`stock-bar-fill ${p.stock < 20 ? 'danger' : ''}`}
                                                    style={{ width: `${Math.min(p.stock, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {p.stock < 20 ? (
                                            <span className="status-badge warning">
                                                <AlertTriangle size={12} />
                                                Low Stock
                                            </span>
                                        ) : (
                                            <span className="status-badge success">In Stock</span>
                                        )}
                                    </td>
                                    <td className="text-right">
                                        <button className="icon-btn"><MoreHorizontal size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add Product Modal */}
            <Modal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                title="Add New Product"
                footer={
                    <div className="modal-actions-premium">
                        <Button variant="secondary" onClick={() => setIsProductModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveProduct}>Create Product</Button>
                    </div>
                }
            >
                <div className="form-grid-premium">
                    <Input
                        label="Product Name"
                        placeholder="e.g. MAC Foundation"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        icon={Package}
                    />
                    <div className="input-container">
                        <label className="input-label">Category</label>
                        <select
                            className="select-field-premium"
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <Input
                        label="Unit Price (LKR)"
                        type="number"
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        icon={DollarSign}
                    />
                    <Input
                        label="Initial Stock"
                        type="number"
                        placeholder="0"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        icon={Database}
                    />
                    <Input
                        label="Display Emoji/Icon"
                        placeholder="📦"
                        value={newProduct.image}
                        onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                        icon={ImageIcon}
                    />
                </div>
            </Modal>

            {/* Add Category Modal */}
            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                title="Manage Categories"
                footer={
                    <div className="modal-actions-premium">
                        <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)}>Close</Button>
                        <Button variant="primary" onClick={handleSaveCategory}>Add Category</Button>
                    </div>
                }
            >
                <div className="category-form-premium">
                    <Input
                        label="Category Name"
                        placeholder="e.g. Skin Care"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        icon={Tags}
                    />
                    <Input
                        label="Category Icon"
                        placeholder="💄"
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                        icon={ImageIcon}
                    />

                    <div className="existing-categories-chip-wrap">
                        <label className="input-label">Existing Categories</label>
                        <div className="chips-grid">
                            {categories.filter(c => c !== 'All').map(cat => (
                                <div key={cat} className="category-chip">
                                    <span>{cat}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
