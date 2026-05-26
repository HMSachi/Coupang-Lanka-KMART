import React, { useState, useEffect } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import DenominationCounter from '../components/DenominationCounter';
import SessionStartPage from './SessionStartPage';
import {
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Printer,
    Download,
    ArrowLeft,
    ArrowRight,
    ShieldCheck,
    Clock,
    History,
    FileText,
    Calculator,
    ChevronRight,
    User,
    X,
    FileSpreadsheet
} from 'lucide-react';
import logo from '../../../assets/logo.jpeg';
import './EodPage.css';

export default function EodPage() {
    const [step, setStep] = useState(1);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('current'); // 'current' or 'history'
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportSent, setReportSent] = useState(false);
    const [isSelectReportModalOpen, setIsSelectReportModalOpen] = useState(false);
    const [draftsList, setDraftsList] = useState([]);
    const [isCashActionModalOpen, setIsCashActionModalOpen] = useState(false);
    const [cashActionType, setCashActionType] = useState('IN'); // 'IN' or 'OUT'
    const [pendingSettlements, setPendingSettlements] = useState([]);
    const [pendingReturnCashBatches, setPendingReturnCashBatches] = useState([]);
    const [cashActionForm, setCashActionForm] = useState({
        amount: '',
        reason: '',
        batch_number: '',
        transaction_id: null,
        return_ref: null,
        order_id: null,
        return_report: null
    });

    const [drillDownCategory, setDrillDownCategory] = useState(null); // 'SALE', 'CASH_IN', 'CASH_OUT'
    const [drillDownTransactions, setDrillDownTransactions] = useState([]);
    const [selectedCashLog, setSelectedCashLog] = useState(null);

    // Financial metrics
    const [drawerMetrics, setDrawerMetrics] = useState({
        sales: 0,
        cashIn: 0,
        cashOut: 0,
        refunds: 0
    });

    const [physicalCount, setPhysicalCount] = useState(0);
    const [denominations, setDenominations] = useState({});
    const [reportsHistory, setReportsHistory] = useState([]);

    useEffect(() => {
        let cleanup = () => {};
        const active = localStorage.getItem('active_session');
        if (active) {
            const sessionData = JSON.parse(active);
            setSession(sessionData);
            calculateDrawerMetrics();
            fetchPendingSettlements();
            loadPendingReturnCashBatches();

            // Load reports history and filter strictly for this session
            const savedHistory = localStorage.getItem('eod_reports');
            if (savedHistory) {
                let parsedHistory = JSON.parse(savedHistory);
                parsedHistory = parsedHistory.filter(r =>
                    new Date(r.startTime).getTime() === new Date(sessionData.startTime).getTime()
                );
                setReportsHistory(parsedHistory);
            }

            // Listen for cash drawer log updates from other pages
            const handleCashDrawerUpdate = () => {
                calculateDrawerMetrics();
                loadPendingReturnCashBatches();
            };
            window.addEventListener('refreshCashMetrics', handleCashDrawerUpdate);

            cleanup = () => {
                window.removeEventListener('refreshCashMetrics', handleCashDrawerUpdate);
            };
        } else {
            // Load all reports if no active session (or none)
            const savedHistory = localStorage.getItem('eod_reports');
            if (savedHistory) {
                setReportsHistory(JSON.parse(savedHistory));
            }
        }

        setLoading(false);
        return cleanup;
    }, []);

    const fetchPendingSettlements = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/orders/transactions/all?pending=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setPendingSettlements(data);
        } catch (error) {
            console.error('Error fetching settlements:', error);
        }
    };

    const loadPendingReturnCashBatches = () => {
        const pending = JSON.parse(localStorage.getItem('pending_return_cash_batches') || '[]');
        const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
        const unsettled = pending.filter(batch => !logs.some(log => log.return_ref === batch.return_ref && log.batch === batch.batch_number));
        if (unsettled.length !== pending.length) {
            localStorage.setItem('pending_return_cash_batches', JSON.stringify(unsettled));
        }
        setPendingReturnCashBatches(unsettled);
    };

    const calculateDrawerMetrics = () => {
        const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
        const stats = logs.reduce((acc, log) => {
            if (log.type === 'SALE' || log.type === 'CASH_SALE' || log.type === 'CARD_SALE' || log.type === 'BANK_TRANSFER') {
                acc.sales += log.amount;
            }
            if (log.type === 'CASH_IN') acc.cashIn += log.amount;
            if (log.type === 'CASH_OUT' || log.type === 'REFUND') acc.cashOut += log.amount;
            if (log.type === 'REFUND') acc.refunds += log.amount;
            return acc;
        }, { sales: 0, cashIn: 0, cashOut: 0, refunds: 0 });

        setDrawerMetrics(stats);
    };

    const handleDrillDown = (category) => {
        const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
        let filtered = [];

        if (category === 'SALE') {
            filtered = logs.filter(l => l.type === 'SALE' || l.type === 'CASH_SALE' || l.type === 'CARD_SALE' || l.type === 'BANK_TRANSFER');
        } else if (category === 'CASH_IN') {
            filtered = logs.filter(l => l.type === 'CASH_IN');
        } else if (category === 'CASH_OUT') {
            filtered = logs.filter(l => l.type === 'CASH_OUT' || l.type === 'REFUND');
        }

        setDrillDownTransactions(filtered);
        setDrillDownCategory(category);
    };

    const getFilteredLogs = (category) => {
        const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
        if (category === 'SALE') {
            return logs.filter(l => l.type === 'SALE' || l.type === 'CASH_SALE' || l.type === 'CARD_SALE' || l.type === 'BANK_TRANSFER');
        } else if (category === 'CASH_OUT') {
            return logs.filter(l => l.type === 'CASH_OUT' || l.type === 'REFUND');
        }
        return logs.filter(l => l.type === category);
    };

    const handleCashAction = async (e) => {
        e.preventDefault();
        const amount = parseFloat(cashActionForm.amount);
        if (isNaN(amount) || amount <= 0) return alert('Invalid amount');

        // Record locally
        const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
        logs.push({
            id: `TRANS_${Date.now()}`,
            type: cashActionForm.return_ref ? 'REFUND' : (cashActionType === 'IN' ? 'CASH_IN' : 'CASH_OUT'),
            amount: amount,
            reason: cashActionForm.reason,
            batch: cashActionForm.batch_number,
            timestamp: new Date().toISOString(),
            return_ref: cashActionForm.return_ref || null,
            order_id: cashActionForm.order_id || null,
            return_report: cashActionForm.return_report || null
        });
        localStorage.setItem('cash_drawer_logs', JSON.stringify(logs));

        if (cashActionForm.return_ref) {
            const pending = JSON.parse(localStorage.getItem('pending_return_cash_batches') || '[]')
                .filter(batch => batch.return_ref !== cashActionForm.return_ref);
            localStorage.setItem('pending_return_cash_batches', JSON.stringify(pending));
            setPendingReturnCashBatches(pending);
        }

        // If it was a pending settlement, settle it in backend
        if (cashActionForm.transaction_id) {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                await fetch(`${apiUrl}/api/orders/transactions/${cashActionForm.transaction_id}/settle`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (err) {
                console.error('Failed to settle in backend:', err);
            }
        }

        // Reset and Refresh
        setIsCashActionModalOpen(false);
        setCashActionForm({ amount: '', reason: '', batch_number: '', transaction_id: null, return_ref: null, order_id: null, return_report: null });
        calculateDrawerMetrics();
        window.dispatchEvent(new Event('refreshCashMetrics'));
        fetchPendingSettlements();
        loadPendingReturnCashBatches();
        alert(`Cash ${cashActionType} recorded successfully.`);
    };

    const expectedCash = session ? (session.openingBalance + drawerMetrics.sales + drawerMetrics.cashIn - drawerMetrics.cashOut) : 0;
    const difference = physicalCount - expectedCash;

    useEffect(() => {
        // If money counts change, invalidate the sent report so they must resend
        if (reportSent) {
            setReportSent(false);
        }
    }, [physicalCount, expectedCash]);

    const handleCompleteEod = () => {
        const finalReport = {
            id: `REP_${Date.now()}`,
            cashier: session.cashier,
            registerId: session.registerId,
            startTime: session.startTime,
            endTime: new Date().toISOString(),
            openingBalance: session.openingBalance,
            metrics: drawerMetrics,
            expectedCash: expectedCash,
            actualCash: physicalCount,
            difference: difference,
            denominations: denominations,
            notes: session.notes,
            status: difference === 0 ? 'BALANCED' : 'DISCREPANCY',
            sentToAdmin: reportSent
        };

        // Update History
        const updatedHistory = [finalReport, ...reportsHistory];
        localStorage.setItem('eod_reports', JSON.stringify(updatedHistory));
        setReportsHistory(updatedHistory);

        // Clear Session Data
        localStorage.removeItem('active_session');
        localStorage.setItem('shift_status', 'closed');
        localStorage.removeItem('cash_drawer_logs');

        // Show success / History
        setViewMode('history');
        setSession(null);
        setReportSent(false); // reset
    };

    const handleSendReportInit = () => {
        const liveDraft = {
            id: `DRAFT_LIVE_${Date.now()}`,
            cashier: session.cashier,
            endTime: new Date().toISOString(),
            expectedCash: expectedCash,
            actualCash: physicalCount,
            difference: difference,
            isLive: true
        };

        const historyDrafts = reportsHistory.filter(r => r.status === 'DRAFT' && !r.sentToAdmin);
        setDraftsList([liveDraft, ...historyDrafts]);
        setIsSelectReportModalOpen(true);
    };

    const confirmSendReport = async (id) => {
        if (window.confirm('Are you sure you want to securely transmit this End-of-Day report to the Admin for final reconciliation?')) {
            try {
                const draft = draftsList.find(d => d.id === id);
                const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                const token = localStorage.getItem('token');
                const reportEndTime = new Date().toISOString();

                // Get cash drawer logs from localStorage
                const cashDrawerLogs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');

                // Fetch POS/manual orders created or completed inside this exact cashier session
                let sessionOrders = [];
                try {
                    const ordersResponse = await fetch(`${apiUrl}/api/orders/reports/session-orders?cashier_name=${encodeURIComponent(session.cashier)}&start_time=${encodeURIComponent(session.startTime)}&end_time=${encodeURIComponent(reportEndTime)}&session_id=${encodeURIComponent(session.id)}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (ordersResponse.ok) {
                        const data = await ordersResponse.json();
                        sessionOrders = Array.isArray(data) ? data : data.data || [];
                    } else {
                        console.warn(`POS orders fetch failed with status ${ordersResponse.status}`);
                    }
                } catch (err) {
                    console.warn('Could not fetch POS orders:', err.message);
                }

                // Fetch only online orders touched by this cashier during this shift window
                let onlineOrders = [];
                try {
                    const onlineOrdersResponse = await fetch(`${apiUrl}/api/orders/reports/online-session-orders?cashier_name=${encodeURIComponent(session.cashier)}&start_time=${encodeURIComponent(session.startTime)}&end_time=${encodeURIComponent(reportEndTime)}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (onlineOrdersResponse.ok) {
                        const data = await onlineOrdersResponse.json();
                        onlineOrders = Array.isArray(data) ? data : data.data || [];
                    } else {
                        console.warn(`Online orders fetch failed with status ${onlineOrdersResponse.status}`);
                    }
                } catch (err) {
                    console.warn('Could not fetch online orders:', err.message);
                }

                // Create comprehensive order report
                const orderReport = {
                    id: `ORDER_REP_${Date.now()}`,
                    cashier_name: session.cashier,
                    session_id: session.id,
                    start_time: session.startTime,
                    end_time: reportEndTime,
                    pos_orders: Array.isArray(sessionOrders) ? sessionOrders : [],
                    online_orders: Array.isArray(onlineOrders) ? onlineOrders : [],
                    total_pos_orders: Array.isArray(sessionOrders) ? sessionOrders.length : 0,
                    total_online_orders: Array.isArray(onlineOrders) ? onlineOrders.length : 0,
                    report_type: 'ORDER_SUMMARY',
                    scope: 'CURRENT_CASHIER_SHIFT_ONLY'
                };

                // Calculate order summary metrics - ensure arrays exist
                const posOrdersArray = Array.isArray(sessionOrders) ? sessionOrders : [];
                const onlineOrdersArray = Array.isArray(onlineOrders) ? onlineOrders : [];
                const posTotalAmount = posOrdersArray.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
                const onlineTotalAmount = onlineOrdersArray.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);

                orderReport.pos_total_amount = posTotalAmount;
                orderReport.online_total_amount = onlineTotalAmount;
                orderReport.grand_total = posTotalAmount + onlineTotalAmount;

                // Send financial report with order data attached
                const reportResponse = await fetch(`${apiUrl}/api/reports`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        cashier_name: session.cashier,
                        branch_id: null,
                        report_data: {
                            ...draft,
                            // Ensure all critical fields are always included explicitly with proper types
                            openingBalance: parseFloat(draft.openingBalance || session.openingBalance || 0),
                            metrics: {
                                sales: parseFloat(drawerMetrics.sales || 0),
                                cashIn: parseFloat(drawerMetrics.cashIn || 0),
                                cashOut: parseFloat(drawerMetrics.cashOut || 0),
                                refunds: parseFloat(drawerMetrics.refunds || 0)
                            },
                            cash_drawer_logs: cashDrawerLogs,
                            sessionOrders: posOrdersArray,
                            onlineOrders: onlineOrdersArray,
                            orderReport: orderReport
                        },
                        report_type: 'EOD_WITH_ORDERS'
                    })
                });

                if (!reportResponse.ok) {
                    throw new Error(`Failed to send financial report: ${reportResponse.status}`);
                }

                // Also send a separate detailed order report
                await fetch(`${apiUrl}/api/reports/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(orderReport)
                }).catch(err => {
                    // Don't fail the main report if this endpoint doesn't exist
                    console.warn('Order report endpoint not available, but financial report sent successfully');
                });

                setReportSent(true);
                setIsSelectReportModalOpen(false);
                alert('✓ Financial Report & Order Report successfully sent to Admin!');
            } catch (error) {
                console.error('Error sending report:', error);
                alert('Failed to send report. Check connection.');
            }
        }
    };

    const downloadReport = (report) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `EOD_Report_${report.id}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    if (loading) return <div className="eod-loading">Loading Session Data...</div>;

    if (!session && viewMode === 'current') {
        return <SessionStartPage />;
    }

    return (
        <POSLayout>
            <div className="eod-premium-container">

                {/* Header with Navigation */}
                <div className="eod-header-section animate-fade-in">
                    <div className="title-area">
                        <h1 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 400, letterSpacing: '-0.03em', color: '#0f172a' }}>Shift Closing & EOD Reports</h1>
                        <p style={{ fontFamily: '"Inter", system-ui, sans-serif', fontSize: '1.1rem', color: '#64748b' }}>Prepare end-of-day (EOD) reports for management</p>
                    </div>

                    <div className="header-view-toggle">
                        <button
                            className={viewMode === 'current' ? 'active' : ''}
                            onClick={() => setViewMode('current')}
                            disabled={!session}
                        >
                            <Clock size={16} /> Current Session
                        </button>
                        <button
                            className={viewMode === 'history' ? 'active' : ''}
                            onClick={() => setViewMode('history')}
                        >
                            <History size={16} /> Past Reports History
                        </button>
                    </div>
                </div>

                {viewMode === 'current' ? (
                    <>
                        {/* Workflow Nav */}
                        <div className="eod-workflow-nav animate-fade-in">
                            <div className={`workflow-item ${step >= 1 ? 'active' : ''}`}>1. Summary</div>
                            <div className="workflow-connector"></div>
                            <div className={`workflow-item ${step >= 2 ? 'active' : ''}`}>2. Denominations</div>
                            <div className="workflow-connector"></div>
                            <div className={`workflow-item ${step >= 3 ? 'active' : ''}`}>3. Finalize</div>
                        </div>

                        {step === 1 && (
                            <div className="summary-cards-grid animate-slide-up">
                                <Card white title="Financial Summary">
                                    <div className="calculation-stack">
                                        <div className="calc-row">
                                            <span>Opening Balance</span>
                                            <span>LKR {session.openingBalance.toLocaleString()}</span>
                                        </div>
                                         <div className="calc-row clickable" onClick={() => handleDrillDown('SALE')}>
                                            <span>Total Cash Sales (+)</span>
                                            <span>LKR {drawerMetrics.sales.toLocaleString()}</span>
                                        </div>
                                         <div className="calc-row clickable" onClick={() => handleDrillDown('CASH_IN')}>
                                            <span>Cash In (+)</span>
                                            <span>LKR {drawerMetrics.cashIn.toLocaleString()}</span>
                                        </div>
                                         <div className="calc-row clickable" onClick={() => handleDrillDown('CASH_OUT')}>
                                            <span>Cash Out (-)</span>
                                            <span className="eod-amount-negative">-LKR {drawerMetrics.cashOut.toLocaleString()}</span>
                                        </div>
                                        <div className="calc-divider"></div>
                                        <div className="calc-row result">
                                            <span>Expected Drawer Total</span>
                                            <span>LKR {expectedCash.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="eod-quick-actions">
                                <button className="q-action-in" onClick={() => {
                                    setCashActionType('IN');
                                    setCashActionForm({ amount: '', reason: '', batch_number: '', transaction_id: null, return_ref: null, order_id: null, return_report: null });
                                    setIsCashActionModalOpen(true);
                                }}>
                                    <TrendingUp size={16} /> Cash In
                                </button>
                                <button className="q-action-out" onClick={() => {
                                    setCashActionType('OUT');
                                    loadPendingReturnCashBatches();
                                    setCashActionForm({ amount: '', reason: '', batch_number: '', transaction_id: null, return_ref: null, order_id: null, return_report: null });
                                    setIsCashActionModalOpen(true);
                                }}>
                                    <TrendingDown size={16} /> Cash Out
                                        </button>
                                    </div>

                                    <div className="mt-4 step-actions">
                                        <Button variant="primary" fullWidth onClick={() => setStep(2)}>
                                            Next: Count Physical Cash <ArrowRight size={18} />
                                        </Button>
                                    </div>
                                </Card>

                                <Card white title="Session Identification">
                                    <div className="reconcile-card">
                                        <div className="reconcile-item">
                                            <label>Session ID</label>
                                            <span className="eod-session-id">{session.id}</span>
                                        </div>
                                        <div className="reconcile-item">
                                            <label>Cashier</label>
                                            <span>{session.cashier}</span>
                                        </div>
                                        <div className="reconcile-item">
                                            <label>Start Time</label>
                                            <span>{new Date(session.startTime).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="denoms-wrapper-grid animate-slide-up">
                                <div className="denoms-list-col">
                                    <Card white title="Denomination Verification">
                                        <DenominationCounter
                                            onTotalChange={setPhysicalCount}
                                            onDenominationsChange={setDenominations}
                                        />
                                    </Card>
                                </div>

                                <div className="reconcile-status-side animate-scale">
                                    <Card white title="Live Balance">
                                        <div className="reconcile-card">
                                            <div className="reconcile-item">
                                                <label>System Expected</label>
                                                <span>LKR {expectedCash.toLocaleString()}</span>
                                            </div>
                                            <div className="reconcile-item highlight">
                                                <label>Physical Counted</label>
                                                <span>LKR {physicalCount.toLocaleString()}</span>
                                            </div>
                                            <div className="reconcile-divider"></div>
                                            <div className={`reconcile-diff ${difference === 0 ? 'perfect' : (difference > 0 ? 'surplus' : 'mismatch')}`}>
                                                <label>Current Difference</label>
                                                <div className="diff-val">LKR {difference.toLocaleString()}</div>
                                                {difference === 0 ? (
                                                    <span className="diff-success"><ShieldCheck size={16} /> Verified & Balanced</span>
                                                ) : (
                                                    <span className="diff-alert"><AlertCircle size={16} /> {difference > 0 ? 'Cash Surplus' : 'Cash Mismatch'}</span>
                                                )}
                                            </div>

                                            <div className="step-actions-vertical mt-4">
                                                <Button variant="primary" fullWidth size="lg" onClick={() => setStep(3)}>
                                                    Proceed to Finalize <ArrowRight size={18} />
                                                </Button>
                                                <Button variant="secondary" fullWidth onClick={() => {
                                                    const draftReport = {
                                                        id: `DRAFT_${Date.now()}`,
                                                        cashier: session.cashier,
                                                        registerId: session.registerId,
                                                        startTime: session.startTime,
                                                        endTime: new Date().toISOString(),
                                                        openingBalance: session.openingBalance,
                                                        metrics: drawerMetrics,
                                                        expectedCash: expectedCash,
                                                        actualCash: physicalCount,
                                                        difference: difference,
                                                        denominations: denominations,
                                                        notes: session.notes,
                                                        status: 'DRAFT'
                                                    };
                                                    const updatedHistory = [draftReport, ...reportsHistory];
                                                    localStorage.setItem('eod_reports', JSON.stringify(updatedHistory));
                                                    setReportsHistory(updatedHistory);
                                                    alert('Reconciliation draft added to history successfully!');
                                                }}>
                                                    Save Progress Draft
                                                </Button>
                                                <Button variant="secondary" fullWidth onClick={() => setStep(1)}>
                                                    <ArrowLeft size={18} /> Back to Summary
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="finalize-wrapper animate-slide-up">
                                <Card white>
                                    <div className="final-report-card">
                                        <div className="final-header">
                                            <div className="shield-icon"><ShieldCheck size={40} /></div>
                                            <h2 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 400, letterSpacing: '-0.02em', color: '#0f172a' }}>Final Report</h2>
                                            <p style={{ fontFamily: '"Inter", system-ui, sans-serif', color: '#64748b' }}>All financial logs have been verified.</p>
                                        </div>

                                        <div className="report-summary-bits">
                                            <div className="bit"><User size={16} /> {session.cashier}</div>
                                            <div className="bit"><Clock size={16} /> {new Date().toLocaleTimeString()}</div>
                                            <div className="bit"><Calculator size={16} /> {Object.keys(denominations).length} Denoms</div>
                                        </div>

                                        <div className="final-confirmation-list">
                                            <div className={`conf-check ${difference !== 0 ? 'warning' : 'success'}`}>
                                                {difference === 0 ? <CheckCircle2 size={18} className="text-green-500" /> : <X size={18} className="text-red-500" />}
                                                <span className={difference === 0 ? "font-bold text-gray-800" : "font-bold text-red-600"}>Cash balanced</span>
                                                {difference !== 0 && <span className="ml-2 text-xs text-red-500">(Discrepancy: LKR {difference})</span>}
                                            </div>
                                            <div className={`conf-check ${!reportSent ? 'warning text-orange-500' : 'success text-green-500'}`}>
                                                {reportSent ? <CheckCircle2 size={18} /> : <X size={18} />}
                                                <span className="font-bold text-gray-800">Send the report to admin</span>
                                            </div>
                                        </div>

                                        <div className="final-actions">
                                            {!reportSent && (
                                                <Button variant="primary" fullWidth size="lg" onClick={handleSendReportInit}>
                                                    Send Report to Admin
                                                </Button>
                                            )}
                                            <Button
                                                variant="primary"
                                                fullWidth
                                                size="lg"
                                                onClick={handleCompleteEod}
                                                disabled={!reportSent}
                                                style={reportSent ? { background: '#ef4444' } : {}}
                                            >
                                                End shift
                                            </Button>
                                            <Button variant="secondary" fullWidth onClick={() => setStep(2)}>
                                                <ArrowLeft size={18} /> Modify Denominations
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </>
                ) : (
                    /* REPORTS HISTORY VIEW */
                    <div className="history-section animate-slide-up">
                        {reportsHistory.length === 0 ? (
                            <Card white>
                                <div className="empty-history">
                                    <FileText size={48} color="#e2e8f0" />
                                    <h3>No EOD reports found</h3>
                                    <p>When you complete a shift, the reports will appear here.</p>
                                </div>
                            </Card>
                        ) : (
                            <div className="history-grid">
                                {reportsHistory.map(report => (
                                    <Card white key={report.id} className="history-report-card">
                                        <div className="report-h-top">
                                            <div className={`status-tag ${report.status.toLowerCase()}`}>
                                                {report.status}
                                            </div>
                                            <div className="h-date">{new Date(report.endTime).toLocaleDateString()}</div>
                                        </div>

                                        <div className="report-h-main">
                                            <div className="h-metric">
                                                <label>Total Cash</label>
                                                <span>LKR {report.actualCash.toLocaleString()}</span>
                                            </div>
                                            <div className="h-sub-info">
                                                <div><Clock size={12} /> {new Date(report.endTime).toLocaleTimeString()}</div>
                                                <div><User size={12} /> {report.cashier}</div>
                                            </div>
                                        </div>

                                        <div className="report-h-actions">
                                            <button
                                                className={`h-action-btn ${report.sentToAdmin ? 'text-green-500' : ''}`}
                                                onClick={() => {
                                                    if (report.sentToAdmin) return;
                                                    const updated = reportsHistory.map(r => r.id === report.id ? { ...r, sentToAdmin: true } : r);
                                                    setReportsHistory(updated);
                                                    localStorage.setItem('eod_reports', JSON.stringify(updated));
                                                    alert('Report sent to Admin!');
                                                }}
                                                disabled={report.sentToAdmin}
                                            >
                                                {report.sentToAdmin ? <CheckCircle2 size={14} /> : <FileText size={14} />}
                                                {report.sentToAdmin ? 'Sent' : 'Send to Admin'}
                                            </button>
                                            <button className="h-action-btn" onClick={() => downloadReport(report)}>
                                                <Download size={14} /> Download
                                            </button>
                                            <button className="h-action-btn view-btn" onClick={() => setSelectedReport(report)}>
                                                View Details <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* DETAILED REPORT MODAL (PDF STYLE) */}
                {selectedReport && (
                    <div className="report-modal-overlay">
                        <div className="report-modal-container animate-scale">
                            <div className="report-modal-header">
                                <h3>Shift Reconciliation Report</h3>
                                <div className="modal-actions">
                                    <button onClick={() => window.print()} className="print-trigger-btn">
                                        <Printer size={16} /> Print to PDF
                                    </button>
                                    <button onClick={() => setSelectedReport(null)} className="close-modal-btn">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                                <div className="report-print-paper" id="eod-printable-report">
                                    <div className="p-report-header">
                                        <div className="p-brand">
                                            <div className="p-logo">
                                                <img src={logo} alt="Coupang Kmart" />
                                            </div>
                                            <div>
                                                <h2>Coupang Kmart</h2>
                                                <p>Terminal POS - Shift Report</p>
                                            </div>
                                        </div>
                                    <div className="p-meta">
                                        <div><strong>ID:</strong> {selectedReport.id}</div>
                                        <div><strong>Date:</strong> {new Date(selectedReport.endTime).toLocaleDateString()}</div>
                                        <div><strong>Status:</strong> {selectedReport.status}</div>
                                    </div>
                                </div>

                                <div className="p-divider"></div>

                                <div className="p-info-grid">
                                    <div className="p-info-box">
                                        <label>Cashier Information</label>
                                        <div className="p-val"><strong>Name:</strong> {selectedReport.cashier}</div>
                                        <div className="p-val"><strong>Register:</strong> {selectedReport.registerId || 'Register #01'}</div>
                                    </div>
                                    <div className="p-info-box">
                                        <label>Shift Duration</label>
                                        <div className="p-val"><strong>Started:</strong> {new Date(selectedReport.startTime).toLocaleTimeString()}</div>
                                        <div className="p-val"><strong>Ended:</strong> {new Date(selectedReport.endTime).toLocaleTimeString()}</div>
                                    </div>
                                </div>

                                <div className="p-section">
                                    <h4>Financial Reconciliation Summary</h4>
                                    <table className="p-table">
                                        <tbody>
                                            <tr>
                                                <td>Opening Balance</td>
                                                <td className="text-right">LKR {selectedReport.openingBalance.toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Total Cash Sales</td>
                                                <td className="text-right">+ LKR {selectedReport.metrics.sales.toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Total Cash In</td>
                                                <td className="text-right">+ LKR {selectedReport.metrics.cashIn.toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Total Cash Out</td>
                                                <td className="text-right">- LKR {selectedReport.metrics.cashOut.toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td>Refunds Processed</td>
                                                <td className="text-right">- LKR {selectedReport.metrics.refunds?.toLocaleString() || 0}</td>
                                            </tr>
                                            <tr className="p-expected-row">
                                                <td><strong>Expected Drawer Balance</strong></td>
                                                <td className="text-right"><strong>LKR {selectedReport.expectedCash.toLocaleString()}</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-section">
                                    <h4>Denomination Audit Breakdown</h4>
                                    <div className="p-denoms-grid">
                                        {Object.entries(selectedReport.denominations).map(([val, qty]) => (
                                            qty > 0 && (
                                                <div key={val} className="p-denom-row">
                                                    <span>LKR {parseInt(val).toLocaleString()}</span>
                                                    <span>x {qty}</span>
                                                    <span>= LKR {(parseInt(val) * qty).toLocaleString()}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                    <div className="p-actual-row">
                                        <span><strong>Total Physical Cash Counted</strong></span>
                                        <span><strong>LKR {selectedReport.actualCash.toLocaleString()}</strong></span>
                                    </div>
                                </div>

                                <div className={`p-diff-box ${selectedReport.difference === 0 ? 'p-balanced' : 'p-mismatch'}`}>
                                    <div className="p-diff-label">NET DISCREPANCY / BALANCE</div>
                                    <div className="p-diff-val">LKR {selectedReport.difference.toLocaleString()}</div>
                                    <p>{selectedReport.difference === 0 ? 'Shift is perfectly balanced. No issues detected.' : 'Warning: Cash discrepancy identified. Admin review required.'}</p>
                                </div>

                                <div className="p-footer-sigs">
                                    <div className="p-sig-box">
                                        <div className="p-sig-line"></div>
                                        <label>Cashier Signature</label>
                                    </div>
                                    <div className="p-sig-box">
                                        <div className="p-sig-line"></div>
                                        <label>Manager Approval</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SELECT REPORT MODAL */}
                {isSelectReportModalOpen && (
                    <div className="report-modal-overlay">
                        <div className="report-modal-container animate-scale" style={{ maxWidth: '600px' }}>
                            <div className="report-modal-header" style={{ borderBottom: 'none' }}>
                                <h3>Select Report to Transmit</h3>
                                <button onClick={() => setIsSelectReportModalOpen(false)} className="close-modal-btn">
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="modal-desc-text">
                                Please select the physical count draft that you would like to submit to the admin for final reconciliation.
                            </p>

                            <div className="report-select-list custom-scrollbar">
                                {draftsList.map((draft, idx) => (
                                    <div
                                        key={draft.id}
                                        className={`report-select-card ${draft.isLive ? 'live-state' : ''}`}
                                        onClick={() => confirmSendReport(draft.id)}
                                    >
                                        <div className="report-select-info">
                                            <h4>
                                                {draft.isLive ? <Clock size={18} color="#3b82f6" /> : <History size={18} color="#64748b" />}
                                                {draft.isLive ? 'Current Live Register State' : `Saved Draft: ${new Date(draft.endTime).toLocaleTimeString()}`}
                                            </h4>
                                            <p>Cash Counted: LKR {draft.actualCash.toLocaleString()}</p>
                                        </div>
                                        <div className={`report-select-status ${draft.difference === 0 ? 'balanced' : 'discrepancy'}`}
                                            style={draft.difference === 0 ? { background: '#dcfce7', color: '#166534' } : { background: '#fee2e2', color: '#991b1b' }}>
                                            {draft.difference === 0 ? 'Balanced' : 'Discrepancy'}
                                        </div>
                                    </div>
                                ))}
                                {draftsList.length === 0 && (
                                    <div className="text-center text-gray-500 text-sm py-4">No drafts available.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* DRILL DOWN MODAL */}
                {drillDownCategory && (
                    <div className="report-modal-overlay">
                        <div className="report-modal-container animate-scale" style={{ maxWidth: '700px' }}>
                            <div className="report-modal-header">
                                <h3>
                                    {drillDownCategory === 'SALE' ? 'Sales Breakdown' :
                                        drillDownCategory === 'CASH_IN' ? 'Cash-In Details' : 'Cash-Out Details'}
                                </h3>
                                <button onClick={() => setDrillDownCategory(null)} className="close-modal-btn">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="drilldown-content custom-scrollbar">
                                <table className="drilldown-table">
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Description</th>
                                            <th className="text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredLogs(drillDownCategory).map(log => (
                                            <tr key={log.id} onClick={() => setSelectedCashLog(log)} style={{ cursor: 'pointer' }}>
                                                <td>{new Date(log.timestamp || Date.now()).toLocaleTimeString()}</td>
                                                <td>
                                                    {log.reason || log.desc || log.id}
                                                    {log.batch && <div className="batch-tag">{log.batch}</div>}
                                                    {log.return_ref && <div className="batch-tag">{log.return_ref}</div>}
                                                </td>
                                                <td className="text-right font-bold">
                                                    LKR {log.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {getFilteredLogs(drillDownCategory).length === 0 && (
                                    <div className="p-8 text-center text-gray-400">No transactions recorded in this category.</div>
                                )}
                            </div>

                            <div className="report-modal-footer" style={{ padding: '20px', borderTop: '1px solid #f1f5f9' }}>
                                <div className="total-summary-line">
                                    <span>Total for Category</span>
                                    <span className="amount-highlight">
                                        LKR {
                                            getFilteredLogs(drillDownCategory)
                                                .reduce((sum, log) => sum + log.amount, 0)
                                                .toLocaleString()
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {selectedCashLog && (
                    <div className="report-modal-overlay">
                        <div className="report-modal-container animate-scale" style={{ maxWidth: '760px' }}>
                            <div className="report-modal-header">
                                <h3>{selectedCashLog.type === 'REFUND' ? 'Refund Cash-Out Batch' : 'Cash Transaction Details'}</h3>
                                <button onClick={() => setSelectedCashLog(null)} className="close-modal-btn">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="drilldown-content custom-scrollbar" style={{ padding: '20px' }}>
                                <div className="p-summary-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                    <div className="p-summary-card">
                                        <label>Batch / Transaction</label>
                                        <strong>{selectedCashLog.batch || selectedCashLog.id}</strong>
                                    </div>
                                    <div className="p-summary-card">
                                        <label>Type</label>
                                        <strong>{selectedCashLog.type}</strong>
                                    </div>
                                    <div className="p-summary-card">
                                        <label>Amount</label>
                                        <strong>LKR {Number(selectedCashLog.amount || 0).toLocaleString()}</strong>
                                    </div>
                                </div>

                                <div className="cash-detail-block" style={{ marginTop: '18px' }}>
                                    <p><strong>Description:</strong> {selectedCashLog.reason || selectedCashLog.desc || 'N/A'}</p>
                                    {selectedCashLog.return_ref && <p><strong>Return ID:</strong> {selectedCashLog.return_ref}</p>}
                                    {selectedCashLog.order_id && <p><strong>Order ID:</strong> {selectedCashLog.order_id}</p>}
                                    <p><strong>Time:</strong> {new Date(selectedCashLog.timestamp || Date.now()).toLocaleString()}</p>
                                </div>

                                {selectedCashLog.return_report?.items?.length > 0 && (
                                    <table className="drilldown-table" style={{ marginTop: '18px' }}>
                                        <thead>
                                            <tr>
                                                <th>Returned Item</th>
                                                <th>Reason</th>
                                                <th className="text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedCashLog.return_report.items.map(item => (
                                                <tr key={item.id}>
                                                    <td>{item.product_name} x {item.quantity}</td>
                                                    <td>{item.reason_text || item.custom_note || 'N/A'}</td>
                                                    <td className="text-right font-bold">LKR {Number(item.refund_amount || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* CASH IN / OUT MODAL (SIDEBAR STYLE) */}
                {isCashActionModalOpen && (
                    <div className="report-modal-overlay">
                        <div className="cash-action-sidebar animate-slide-left">
                            <div className="sidebar-header">
                                <h3>{cashActionType === 'IN' ? 'Register Cash-In' : 'Register Cash-Out'}</h3>
                                <button onClick={() => setIsCashActionModalOpen(false)}><X size={20} /></button>
                            </div>

                            <form className="sidebar-form" onSubmit={handleCashAction}>
                                {cashActionType === 'IN' && pendingSettlements.length > 0 && (
                                    <div className="pending-settlements-box">
                                        <label>Select Pending Batch (Web Orders)</label>
                                        <div className="settlement-list">
                                            {pendingSettlements.map(item => (
                                                <div
                                                    key={item.id}
                                                    className="settlement-item"
                                                    onClick={() => setCashActionForm({
                                                        amount: item.amount,
                                                        reason: item.reason,
                                                        batch_number: item.batch_number,
                                                        transaction_id: item.id,
                                                        return_ref: null,
                                                        order_id: null,
                                                        return_report: null
                                                    })}
                                                >
                                                    <div className="s-info">
                                                        <strong>{item.batch_number}</strong>
                                                        <span>LKR {parseFloat(item.amount).toLocaleString()}</span>
                                                    </div>
                                                    <div className="s-reason">{item.reason}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {cashActionType === 'OUT' && pendingReturnCashBatches.length > 0 && (
                                    <div className="pending-settlements-box">
                                        <label>Select Pending Return Cash Batch</label>
                                        <div className="settlement-list">
                                            {pendingReturnCashBatches.map(item => (
                                                <div
                                                    key={item.return_ref}
                                                    className="settlement-item"
                                                    onClick={() => setCashActionForm({
                                                        amount: item.amount,
                                                        reason: item.reason,
                                                        batch_number: item.batch_number,
                                                        transaction_id: null,
                                                        return_ref: item.return_ref,
                                                        order_id: item.order_id,
                                                        return_report: item.return_report
                                                    })}
                                                >
                                                    <div className="s-info">
                                                        <strong>{item.batch_number}</strong>
                                                        <span>LKR {parseFloat(item.amount).toLocaleString()}</span>
                                                    </div>
                                                    <div className="s-reason">{item.return_ref} | {item.order_id}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Amount (LKR)</label>
                                    <input
                                        type="number"
                                        required
                                        value={cashActionForm.amount}
                                        onChange={(e) => setCashActionForm({ ...cashActionForm, amount: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Reason / Description</label>
                                    <textarea
                                        required
                                        value={cashActionForm.reason}
                                        onChange={(e) => setCashActionForm({ ...cashActionForm, reason: e.target.value })}
                                        placeholder="Ex: Refunding online order, adding petty cash..."
                                    />
                                </div>

                                {cashActionType === 'IN' && (
                                    <div className="form-group">
                                        <label>Batch Number (Optional)</label>
                                        <input
                                            type="text"
                                            value={cashActionForm.batch_number}
                                            onChange={(e) => setCashActionForm({ ...cashActionForm, batch_number: e.target.value })}
                                            placeholder="Ex: BATCH-001"
                                        />
                                    </div>
                                )}

                                {cashActionType === 'OUT' && cashActionForm.return_ref && (
                                    <div className="form-group">
                                        <label>Selected Return Batch</label>
                                        <input
                                            type="text"
                                            value={cashActionForm.batch_number}
                                            readOnly
                                        />
                                    </div>
                                )}

                                <div className="sidebar-footer">
                                    <button type="submit" className={`submit-btn ${cashActionType.toLowerCase()}`}>
                                        Complete Cash {cashActionType === 'IN' ? 'In' : 'Out'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </POSLayout>
    );
}
