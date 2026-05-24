import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import POSLayout from '../../../layouts/POSLayout';
import { User, Phone, Tag, Percent, Receipt, ArrowLeft, CheckCircle, Calculator, Info } from 'lucide-react';
import './CheckoutPage.css';

export default function CheckoutPage() {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState(() => {
        const savedCustomer = localStorage.getItem('pos_customer');
        return savedCustomer ? JSON.parse(savedCustomer) : { name: '', phone: '' };
    });
    const [discountType, setDiscountType] = useState('none'); // percentage, fixed, coupon
    const [discountVal, setDiscountVal] = useState(0);
    const [couponCode, setCouponCode] = useState('');

    const [vatPercent, setVatPercent] = useState(0);
    const [serviceCharge, setServiceCharge] = useState(0);

    useEffect(() => {
        const savedCart = localStorage.getItem('pos_cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        } else {
            navigate('/pos');
        }
    }, [navigate]);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    let discountAmount = 0;
    if (discountType === 'percentage') {
        discountAmount = (subtotal * discountVal) / 100;
    } else if (discountType === 'fixed') {
        discountAmount = discountVal;
    }

    const taxableAmount = subtotal - discountAmount;
    const vatAmount = (taxableAmount * vatPercent) / 100;
    const total = taxableAmount + vatAmount + Number(serviceCharge);

    const handleFinalize = () => {
        const orderSummary = {
            subtotal,
            discountType,
            discountAmount,
            vatAmount,
            serviceCharge: Number(serviceCharge),
            total,
            customer // Include customer details in summary
        };
        localStorage.setItem('pending_order_summary', JSON.stringify(orderSummary));
        localStorage.setItem('pos_customer', JSON.stringify(customer));
        navigate('/pos/payment');
    };

    return (
        <POSLayout>
            <div className="checkout-container">
                {/* Header Section */}
                <div className="checkout-header">
                    <button className="back-btn" onClick={() => navigate('/pos/cart')}>
                        <ArrowLeft size={18} /> Back to Cart
                    </button>
                    <h1>Finalize Order</h1>
                </div>

                <div className="checkout-grid">
                    {/* LEFT: Order Intel (Read Only) */}
                    <div className="checkout-card order-preview">
                        <div className="card-header">
                            <Receipt size={20} className="text-blue-600" />
                            <h2>Order Summary</h2>
                        </div>

                        <div className="order-items-list">
                            {cart.map((item, idx) => (
                                <div key={idx} className="order-item-row">
                                    <div className="item-info">
                                        <span className="item-qty">{item.qty}x</span>
                                        <span className="item-name">{item.name}</span>
                                    </div>
                                    <span className="item-total">LKR {(item.price * item.qty).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <div className="checkout-calculations">
                            <div className="calc-row">
                                <span>Subtotal</span>
                                <span>LKR {subtotal.toLocaleString()}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="calc-row discount">
                                    <span>Discount ({discountType})</span>
                                    <span>- LKR {discountAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="calc-row">
                                <span>VAT ({vatPercent}%)</span>
                                <span>LKR {vatAmount.toLocaleString()}</span>
                            </div>
                            <div className="calc-row">
                                <span>Service Charge</span>
                                <span>LKR {Number(serviceCharge).toLocaleString()}</span>
                            </div>
                            <div className="calc-total">
                                <span>Total Payable</span>
                                <span>LKR {total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Customer & Adjustment Forms */}
                    <div className="checkout-actions">
                        {/* Unified Action Card */}
                        <div className="checkout-card action-card-unified">
                            {/* Customer Section */}
                            <div className="unified-section">
                                <div className="card-header">
                                    <User size={18} className="text-blue-500" />
                                    <h2>Customer Details</h2>
                                </div>
                                <div className="input-group-grid">
                                    <div className="pos-field">
                                        <label>Customer Name</label>
                                        <div className="input-wrapper">
                                            <User size={14} className="input-icon" />
                                            <input
                                                type="text"
                                                placeholder="Enter name..."
                                                value={customer.name}
                                                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="pos-field">
                                        <label>Phone Number</label>
                                        <div className="input-wrapper">
                                            <Phone size={14} className="input-icon" />
                                            <input
                                                type="text"
                                                placeholder="Enter phone..."
                                                value={customer.phone}
                                                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="section-divider"></div>

                            {/* Discount Section */}
                            <div className="unified-section">
                                <div className="card-header">
                                    <Tag size={18} className="text-blue-500" />
                                    <h2>Discount System</h2>
                                </div>
                                <div className="discount-type-selector">
                                    <button className={discountType === 'percentage' ? 'active' : ''} onClick={() => setDiscountType('percentage')}>
                                        <Percent size={13} /> Percentage
                                    </button>
                                    <button className={discountType === 'fixed' ? 'active' : ''} onClick={() => setDiscountType('fixed')}>
                                        <Tag size={13} /> Fixed Amount
                                    </button>
                                    <button className={discountType === 'coupon' ? 'active' : ''} onClick={() => setDiscountType('coupon')}>
                                        <Info size={13} /> Coupon
                                    </button>
                                </div>

                                {discountType !== 'none' && (
                                    <div className="discount-input-area">
                                        {discountType === 'coupon' ? (
                                            <div className="pos-field">
                                                <label>Coupon Code</label>
                                                <input
                                                    type="text"
                                                    className="modern-input"
                                                    placeholder="Enter code..."
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value)}
                                                />
                                            </div>
                                        ) : (
                                            <div className="pos-field">
                                                <label>{discountType === 'percentage' ? 'Discount Percentage (%)' : 'Fixed Amount (LKR)'}</label>
                                                <input
                                                    type="number"
                                                    className="modern-input"
                                                    value={discountVal}
                                                    onChange={(e) => setDiscountVal(Number(e.target.value))}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="section-divider"></div>

                            {/* Tax Section */}
                            <div className="unified-section">
                                <div className="card-header">
                                    <Calculator size={18} className="text-blue-500" />
                                    <h2>Taxes & Charges</h2>
                                </div>
                                <div className="input-group-grid">
                                    <div className="pos-field">
                                        <label>VAT (%)</label>
                                        <input
                                            type="number"
                                            className="modern-input"
                                            value={vatPercent}
                                            onChange={(e) => setVatPercent(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="pos-field">
                                        <label>Service Charge (Fixed)</label>
                                        <input
                                            type="number"
                                            className="modern-input"
                                            value={serviceCharge}
                                            onChange={(e) => setServiceCharge(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="checkout-footer-action mt-8">
                            <button className="finalize-btn" onClick={handleFinalize}>
                                <CheckCircle size={22} />
                                <span>Complete Order & Finalize Payment</span>
                            </button>
                            <p className="footer-note">
                                <Info size={12} />
                                Once you complete this order, it will be recorded in the branch history and cannot be edited.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </POSLayout>
    );
}
