import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import POSLayout from '../../../layouts/POSLayout';
import { Banknote, CreditCard, QrCode, Building2, Wallet, ArrowLeft, Receipt, CheckCircle, Trash2, Info, Calculator } from 'lucide-react';
import './PaymentPage.css';

export default function PaymentPage() {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [orderSummary, setOrderSummary] = useState(null);

    // Payment State
    const [orderTotal, setOrderTotal] = useState(0);
    const [remainingBalance, setRemainingBalance] = useState(0);
    const [selectedMethod, setSelectedMethod] = useState('cash');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [appliedPayments, setAppliedPayments] = useState([]);
    const [cashReceived, setCashReceived] = useState('');

    useEffect(() => {
        const savedCart = localStorage.getItem('pos_cart');
        const savedSummary = localStorage.getItem('pending_order_summary');

        if (savedCart) {
            setCart(JSON.parse(savedCart));

            if (savedSummary) {
                const summary = JSON.parse(savedSummary);
                setOrderSummary(summary);
                setOrderTotal(summary.total);
                setRemainingBalance(summary.total);
            } else {
                const total = JSON.parse(savedCart).reduce((sum, item) => sum + (item.price * item.qty), 0);
                setOrderTotal(total);
                setRemainingBalance(total);
            }
        } else {
            navigate('/pos');
        }
    }, [navigate]);

    const calcCashChange = (received, amountDue) => {
        const tendered = Number(received) || 0;
        const due = Number(amountDue) || 0;
        const applied = Math.min(tendered, due);
        return Math.max(0, tendered - applied);
    };

    const handleAddPayment = () => {
        let amt = 0;
        let change = 0;
        if (selectedMethod === 'cash') {
            const received = Number(cashReceived) || 0;
            amt = Math.min(received, remainingBalance);
            change = calcCashChange(received, remainingBalance);
            if (amt <= 0) return;
        } else {
            amt = Number(paymentAmount) || 0;
            if (amt <= 0 || amt > remainingBalance) return;
        }

        const newPayment = {
            id: Date.now(),
            method: selectedMethod,
            amount: amt,
            received: selectedMethod === 'cash' ? Number(cashReceived) : amt,
            change: selectedMethod === 'cash' ? change : 0,
        };

        setAppliedPayments([...appliedPayments, newPayment]);
        setRemainingBalance(prev => Math.max(0, prev - amt));
        setPaymentAmount('');
        if (selectedMethod === 'cash') setCashReceived('');
    };

    const removePayment = (id, amount) => {
        setAppliedPayments(appliedPayments.filter(p => p.id !== id));
        setRemainingBalance(prev => prev + amount);
    };

    const handleFinalizeOrder = () => {
        setIsProcessing(true);
        setTimeout(() => {
            // Log payments to session
            const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
            appliedPayments.forEach(p => {
                logs.push({
                    type: p.method === 'cash' ? 'CASH_SALE' : (p.method === 'card' ? 'CARD_SALE' : 'BANK_TRANSFER'),
                    amount: p.amount,
                    timestamp: new Date().toISOString(),
                    desc: `Sale Transaction #${Math.floor(Math.random() * 10000)}`
                });
            });
            localStorage.setItem('cash_drawer_logs', JSON.stringify(logs));

            setIsProcessing(false);
            setIsSuccess(true);
            localStorage.removeItem('pos_cart');
            localStorage.removeItem('pending_order_summary');
            window.dispatchEvent(new Event('cartUpdated'));
        }, 1500);
    };

    const cashTendered = Number(cashReceived) || 0;
    const lastCashPayment = [...appliedPayments].reverse().find((p) => p.method === 'cash');
    const changeDue =
        remainingBalance > 0 && cashTendered > 0
            ? calcCashChange(cashTendered, remainingBalance)
            : lastCashPayment?.change ?? calcCashChange(lastCashPayment?.received, lastCashPayment?.amount);

    if (isSuccess) {
        return (
            <POSLayout>
                <div className="invoice-success-container">
                    <div className="invoice-actions-sidebar">
                        <div className="action-card">
                            <h3>Share & Print</h3>
                            <button className="action-btn-p thermal"><Calculator size={18} /> Thermal Print</button>
                            <button className="action-btn-p pdf"><Receipt size={18} /> Download PDF</button>
                            <button className="action-btn-p whatsapp">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.43h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                WhatsApp Receipt
                            </button>
                            <button className="new-order-btn-final" onClick={() => navigate('/pos')}>
                                <CheckCircle size={18} /> New Order
                            </button>
                        </div>
                    </div>

                    <div className="invoice-preview-card">
                        <div className="invoice-paper">
                            {/* Shop Details */}
                            <div className="inv-header">
                                <div className="inv-shop-logo">CK</div>
                                <h2>COUPANG KMART</h2>
                                <p>No 125, Galle Road, Colombo 03</p>
                                <p>Tel: +94 11 234 5678</p>
                            </div>

                            <div className="inv-meta-grid">
                                <div>
                                    <label>Invoice No</label>
                                    <span>#{Math.floor(Math.random() * 100000).toString().padStart(6, '0')}</span>
                                </div>
                                <div>
                                    <label>Date & Time</label>
                                    <span>{new Date().toLocaleString()}</span>
                                </div>
                                <div>
                                    <label>Cashier</label>
                                    <span>{JSON.parse(localStorage.getItem('user'))?.name || 'Cashier #01'}</span>
                                </div>
                            </div>

                            <div className="inv-separator"></div>

                            <div className="inv-items-table">
                                <div className="inv-table-header">
                                    <span>Item</span>
                                    <span>Qty</span>
                                    <span>Price</span>
                                    <span className="text-right">Total</span>
                                </div>
                                {cart.map((item, idx) => (
                                    <div key={idx} className="inv-table-row">
                                        <span>{item.name}</span>
                                        <span>{item.qty}</span>
                                        <span>{item.price.toLocaleString()}</span>
                                        <span className="text-right">{(item.price * item.qty).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="inv-separator"></div>

                            <div className="inv-summary">
                                <div className="inv-sum-row">
                                    <span>Subtotal</span>
                                    <span>LKR {orderSummary?.subtotal?.toLocaleString()}</span>
                                </div>
                                {orderSummary?.discountAmount > 0 && (
                                    <div className="inv-sum-row">
                                        <span>Discount</span>
                                        <span>- LKR {orderSummary.discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="inv-sum-row total">
                                    <span>Grand Total</span>
                                    <span>LKR {orderTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="inv-payments">
                                <h3>Payment Details</h3>
                                {appliedPayments.map(p => (
                                    <div key={p.id} className="inv-pay-row">
                                        <span className="capitalize">{p.method}</span>
                                        <span>LKR {p.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                {appliedPayments.find(p => p.method === 'cash') && (
                                    <div className="inv-pay-row balance">
                                        <span>Balance/Change</span>
                                        <span>LKR {changeDue.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="inv-footer">
                                <div className="inv-barcode">
                                    <div className="barcode-mock">||||| | || ||| | ||| ||</div>
                                    <p>INV-{Date.now().toString().slice(-8)}</p>
                                </div>
                                <div className="inv-policy">
                                    <p><strong>Return Policy:</strong> Returns accepted within 7 days with valid receipt. Items must be in original condition.</p>
                                    <h4>Thank you for shopping with us!</h4>
                                    <p>www.coupangkmart.lk</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </POSLayout>
        );
    }

    return (
        <POSLayout>
            <div className="payment-container">
                <div className="payment-header">
                    <button className="back-btn" onClick={() => navigate('/pos/checkout')}>
                        <ArrowLeft size={18} /> Back to Checkout
                    </button>
                    <h1>Payment & Finalization</h1>
                </div>

                <div className="payment-grid">
                    {/* LEFT: Mini Order Summary */}
                    <div className="payment-sidebar">
                        <div className="payment-card summary-card">
                            <div className="card-header">
                                <Receipt size={18} />
                                <h2>Order Summary</h2>
                            </div>
                            <div className="payment-items-list">
                                {cart.map((item, idx) => (
                                    <div key={idx} className="pay-item">
                                        <span>{item.qty}x {item.name}</span>
                                        <span>LKR {(item.price * item.qty).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pay-totals">
                                <div className="pay-total-row sub">
                                    <span>Subtotal</span>
                                    <span>LKR {orderSummary?.subtotal?.toLocaleString() || orderTotal.toLocaleString()}</span>
                                </div>
                                {orderSummary?.discountAmount > 0 && (
                                    <div className="pay-total-row discount">
                                        <span>Discount</span>
                                        <span>- LKR {orderSummary.discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                {orderSummary?.vatAmount > 0 && (
                                    <div className="pay-total-row">
                                        <span>VAT</span>
                                        <span>LKR {orderSummary.vatAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                {orderSummary?.serviceCharge > 0 && (
                                    <div className="pay-total-row">
                                        <span>Service Charge</span>
                                        <span>LKR {orderSummary.serviceCharge.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="pay-total-row final">
                                    <span>Total Payable</span>
                                    <span>LKR {orderTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="payment-card balance-card">
                            <label>Remaining Balance</label>
                            <div className={`large-balance ${remainingBalance === 0 ? 'cleared' : ''}`}>
                                LKR {remainingBalance.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Payment Logic */}
                    <div className="payment-main">
                        <div className="payment-card methods-card">
                            <div className="card-header">
                                <Calculator size={18} />
                                <h2>Select Payment Method</h2>
                            </div>
                            <div className="methods-selector-grid">
                                <button className={selectedMethod === 'cash' ? 'active' : ''} onClick={() => setSelectedMethod('cash')}>
                                    <Banknote size={20} /> <span>Cash</span>
                                </button>
                                <button className={selectedMethod === 'card' ? 'active' : ''} onClick={() => setSelectedMethod('card')}>
                                    <CreditCard size={20} /> <span>Card</span>
                                </button>
                                <button className={selectedMethod === 'qr' ? 'active' : ''} onClick={() => setSelectedMethod('qr')}>
                                    <QrCode size={20} /> <span>QR Pay</span>
                                </button>
                                <button className={selectedMethod === 'bank' ? 'active' : ''} onClick={() => setSelectedMethod('bank')}>
                                    <Building2 size={20} /> <span>Bank</span>
                                </button>
                                <button className={selectedMethod === 'wallet' ? 'active' : ''} onClick={() => setSelectedMethod('wallet')}>
                                    <Wallet size={20} /> <span>Wallet</span>
                                </button>
                            </div>

                            <div className="payment-entry-area">
                                {selectedMethod === 'cash' ? (
                                    <div className="cash-entry-grid">
                                        <div className="entry-field">
                                            <label>Amount Received</label>
                                            <input
                                                type="number"
                                                placeholder="LKR 0.00"
                                                value={cashReceived}
                                                onChange={(e) => setCashReceived(e.target.value)}
                                            />
                                        </div>
                                        <div className="entry-field">
                                            <label>Change to Return</label>
                                            <div className="change-display">
                                                LKR {changeDue.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="entry-field">
                                        <label>Amount to Pay via {selectedMethod}</label>
                                        <input
                                            type="number"
                                            placeholder={`Max ${remainingBalance}`}
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                        />
                                    </div>
                                )}

                                {remainingBalance > 0 && (
                                    <button className="add-payment-btn" onClick={handleAddPayment}>
                                        Add Payment
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Applied Payments History */}
                        {appliedPayments.length > 0 && (
                            <div className="payment-card applied-payments">
                                <div className="card-header">
                                    <CheckCircle size={18} />
                                    <h2>Applied Payments</h2>
                                </div>
                                <div className="applied-list">
                                    {appliedPayments.map(p => (
                                        <div key={p.id} className="applied-row">
                                            <div className="applied-info">
                                                <span className="method-tag">{p.method}</span>
                                                <span className="applied-amt">LKR {p.amount.toLocaleString()}</span>
                                            </div>
                                            <button onClick={() => removePayment(p.id, p.amount)} className="remove-pay-btn">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            className={`final-confirm-btn ${remainingBalance === 0 ? 'active' : ''}`}
                            disabled={remainingBalance > 0}
                            onClick={handleFinalizeOrder}
                        >
                            {isProcessing ? 'Processing...' : 'Complete Order & Print Receipt'}
                        </button>
                    </div>
                </div>
            </div>
        </POSLayout>
    );
}
