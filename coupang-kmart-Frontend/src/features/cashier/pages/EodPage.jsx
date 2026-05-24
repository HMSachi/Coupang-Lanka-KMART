import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    FileSpreadsheet,
    Activity,
    ShoppingBag,
    PlusCircle,
    ArrowUpCircle,
    RotateCcw,
    Target,
    Lock
} from 'lucide-react';
import logo from '../../../assets/logo.jpeg';
import './EodPage.css';

export default function EodPage() {
    const [step, setStep] = useState(1);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('current');
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportSent, setReportSent] = useState(false);
    const [isSelectReportModalOpen, setIsSelectReportModalOpen] = useState(false);
    const [draftsList, setDraftsList] = useState([]);
    const [isCashActionModalOpen, setIsCashActionModalOpen] = useState(false);
    const [cashActionType, setCashActionType] = useState('IN'); // 'IN' or 'OUT'
    const [pendingSettlements, setPendingSettlements] = useState([]);
    const [cashActionForm, setCashActionForm] = useState({
        amount: '',
        reason: '',
        batch_number: '',
        transaction_id: null
    });

    const [drillDownCategory, setDrillDownCategory] = useState(null); // 'SALE', 'CASH_IN', 'CASH_OUT'
    const [drillDownTransactions, setDrillDownTransactions] = useState([]);

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
            };
            window.addEventListener('refreshCashMetrics', handleCashDrawerUpdate);

            cleanup = () => {
                window.removeEventListener('refreshCashMetrics', handleCashDrawerUpdate);
            };
        } else {
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

    const calculateDrawerMetrics = () => {
        const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
        const stats = logs.reduce((acc, log) => {
            if (log.type === 'SALE' || log.type === 'CASH_SALE' || log.type === 'CARD_SALE' || log.type === 'BANK_TRANSFER') {
                acc.sales += log.amount;
            }
            if (log.type === 'CASH_IN') acc.cashIn += log.amount;
            if (log.type === 'CASH_OUT' || log.type === 'REFUND') acc.cashOut += log.amount;
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
            type: cashActionType === 'IN' ? 'CASH_IN' : 'CASH_OUT',
            amount: amount,
            reason: cashActionForm.reason,
            batch: cashActionForm.batch_number,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('cash_drawer_logs', JSON.stringify(logs));

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
        setCashActionForm({ amount: '', reason: '', batch_number: '', transaction_id: null });
        calculateDrawerMetrics();
        window.dispatchEvent(new Event('refreshCashMetrics'));
        fetchPendingSettlements();
        alert(`Cash ${cashActionType} recorded successfully.`);
    };

    const expectedCash = session ? (session.openingBalance + drawerMetrics.sales + drawerMetrics.cashIn - drawerMetrics.cashOut) : 0;
    const difference = physicalCount - expectedCash;

    useEffect(() => {
        if (reportSent) setReportSent(false);
    }, [physicalCount, expectedCash, reportSent]);

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

        const updatedHistory = [finalReport, ...reportsHistory];
        localStorage.setItem('eod_reports', JSON.stringify(updatedHistory));
        setReportsHistory(updatedHistory);

        localStorage.removeItem('active_session');
        localStorage.setItem('shift_status', 'closed');
        localStorage.removeItem('cash_drawer_logs');

        setViewMode('history');
        setSession(null);
        setReportSent(false);
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
        if (window.confirm('Securely transmit this report?')) {
            try {
                const draft = draftsList.find(d => d.id === id);
                const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                const token = localStorage.getItem('token');

                // Get cash drawer logs from localStorage
                const cashDrawerLogs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');

                // Fetch all orders for this session (completed and hold orders)
                let sessionOrders = [];
                try {
                    const ordersResponse = await fetch(`${apiUrl}/api/orders/reports/session-orders?cashier_name=${encodeURIComponent(session.cashier)}&start_time=${encodeURIComponent(session.startTime)}`, {
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

                // Fetch online orders for the same period
                let onlineOrders = [];
                try {
                    const onlineOrdersResponse = await fetch(`${apiUrl}/api/orders?status=ALL&created_after=${encodeURIComponent(session.startTime)}`, {
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
                    end_time: new Date().toISOString(),
                    pos_orders: Array.isArray(sessionOrders) ? sessionOrders : [],
                    online_orders: Array.isArray(onlineOrders) ? onlineOrders : [],
                    total_pos_orders: Array.isArray(sessionOrders) ? sessionOrders.length : 0,
                    total_online_orders: Array.isArray(onlineOrders) ? onlineOrders.length : 0,
                    report_type: 'ORDER_SUMMARY'
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

                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cashier_name: session.cashier, branch_id: null, report_data: draft })
                });
                setReportSent(true);
                setIsSelectReportModalOpen(false);
                alert('✓ Financial Report & Order Report successfully sent to Admin!');
            } catch (error) {
                console.error('Error sending report:', error);
                alert('Failed to send report.');
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
            <div className="eod-container">

                {viewMode === 'current' ? (
                    <>
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
                                        <div className="calc-row result"><span><Target size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Expected Total</span><span>LKR {expectedCash.toLocaleString()}</span></div>
                                    </div>

                                    <div className="eod-quick-actions">
                                        <button className="q-action-in" onClick={() => {
                                            setCashActionType('IN');
                                            setIsCashActionModalOpen(true);
                                        }}>
                                            <TrendingUp size={16} /> Cash In
                                        </button>
                                        <button className="q-action-out" onClick={() => {
                                            setCashActionType('OUT');
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
                                <Card white title="Session Identity" subtitle="Operator credentials">
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
                                    <Card white title="Archive Validation">
                                        <div className="reconcile-card">
                                            <div className="reconcile-item"><label>System Ledgers</label><span>{expectedCash.toLocaleString()}</span></div>
                                            <div className="reconcile-item highlight"><label>Physical Audit</label><span style={{ color: '#6366f1' }}>{physicalCount.toLocaleString()}</span></div>
                                            <div className="reconcile-diff">
                                                <label>Audit Discrepancy</label>
                                                <div className="diff-val">LKR {difference.toLocaleString()}</div>
                                                {difference === 0 ? <span className="status-tag balanced">SYSTEMS BALANCED</span> : <span className="status-tag discrepancy">DELTA DETECTED</span>}
                                            </div>
                                            <div className="step-actions-vertical" style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '16px' }}>
                                                <Button variant="primary" fullWidth onClick={() => setStep(3)}>Generate Final Report <ArrowRight size={14} /></Button>
                                                <Button variant="secondary" onClick={() => setStep(1)}><ArrowLeft size={14} /></Button>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="finalize-wrapper animate-slide-up" style={{ maxWidth: '480px', margin: '0 auto' }}>
                                <Card white>
                                    <div className="final-report-card">
                                        <div className="final-header" style={{ textAlign: 'center', padding: '24px 0' }}>
                                            <div className="shield-icon" style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', background: 'rgba(99, 102, 241, 0.08)', color: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={32} /></div>
                                            <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#1e293b' }}>Shift Secured</h2>
                                            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.6' }}>Audit protocols are synchronized. Terminal will be locked upon transmission.</p>
                                        </div>
                                        <div className="final-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                            {!reportSent && <Button variant="primary" fullWidth onClick={handleSendReportInit}>Transmit Cloud Archive</Button>}
                                            <Button variant="primary" fullWidth onClick={handleCompleteEod} disabled={!reportSent} style={reportSent ? { background: '#f43f5e', color: 'white' } : {}}>
                                                {reportSent ? 'Terminate Session' : 'Awaiting Encryption'}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="history-section animate-slide-up">
                        {reportsHistory.length === 0 ? (
                            <Card white><div className="empty-history"><h3>No EOD reports found</h3></div></Card>
                        ) : (
                            <div className="history-grid">
                                {reportsHistory.map(report => (
                                    <Card white key={report.id} className="history-report-card">
                                        <div className="report-h-top">
                                            <div className="h-date">{new Date(report.startTime).toLocaleDateString()}</div>
                                            <div className={`status-tag ${report.status.toLowerCase()}`}>{report.status}</div>
                                        </div>
                                        <div className="report-h-main">
                                            <div className="h-metric">
                                                <label>Total physical</label>
                                                <span>LKR {report.actualCash.toLocaleString()}</span>
                                            </div>
                                            <div className="h-sub-info">
                                                <span>{report.cashier}</span>
                                                <span className={report.difference < 0 ? 'text-red-500' : 'text-green-500'}>
                                                    Diff: LKR {report.difference.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="report-h-actions">
                                            <button className="h-action-btn" onClick={() => downloadReport(report)}><Download size={14} /> Export</button>
                                            <button className="h-action-btn view-btn" onClick={() => setSelectedReport(report)}>Audit details <ChevronRight size={14} /></button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedReport && (
                <div className="report-modal-overlay">
                    <div className="report-modal-container animate-scale">
                        <div className="report-modal-header">
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Audit Reconciliation</h3>
                                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Terminal Session Report</p>
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
                                <div className="p-meta">
                                    <div><strong>Report ID:</strong> {selectedReport.id}</div>
                                    <div><strong>Generated:</strong> {new Date().toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="p-divider"></div>
                            <div className="p-info-grid">
                                <div className="p-info-box">
                                    <label>Session Context</label>
                                    <p><strong>Cashier:</strong> {selectedReport.cashier}</p>
                                    <p><strong>Register:</strong> {selectedReport.registerId || 'Register #01'}</p>
                                </div>
                                <div className="p-info-box" style={{ textAlign: 'right' }}>
                                    <label>Timeline</label>
                                    <p><strong>Started:</strong> {new Date(selectedReport.startTime).toLocaleString()}</p>
                                    <p><strong>Closed:</strong> {new Date(selectedReport.endTime).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="p-section">
                                <h4>Financial Breakdown</h4>
                                <table className="p-table">
                                    <tbody>
                                        <tr><td>Opening Balance</td><td style={{ textAlign: 'right' }}>LKR {selectedReport.openingBalance.toLocaleString()}</td></tr>
                                        <tr><td>Total Sales</td><td style={{ textAlign: 'right' }}>LKR {selectedReport.metrics.sales.toLocaleString()}</td></tr>
                                        <tr><td>Cash In/Out</td><td style={{ textAlign: 'right' }}>LKR {(selectedReport.metrics.cashIn - selectedReport.metrics.cashOut).toLocaleString()}</td></tr>
                                        <tr className="p-expected-row"><td><strong>Expected Total</strong></td><td style={{ textAlign: 'right' }}><strong>LKR {selectedReport.expectedCash.toLocaleString()}</strong></td></tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-section" style={{ marginTop: '2rem' }}>
                                <h4>Physical Verification</h4>
                                <div className="p-denoms-grid">
                                    {Object.entries(selectedReport.denominations).map(([val, count]) => (
                                        <div key={val} className="p-denom-row">
                                            <span>LKR {val}</span>
                                            <span>x {count}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-actual-row">
                                    <strong>Actual Counted Total</strong>
                                    <strong>LKR {selectedReport.actualCash.toLocaleString()}</strong>
                                </div>
                            </div>

                            <div className={`p-diff-box ${selectedReport.difference === 0 ? 'p-balanced' : 'p-mismatch'}`}>
                                <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Reconciliation Difference</div>
                                <div className="p-diff-val">LKR {selectedReport.difference.toLocaleString()}</div>
                                <div style={{ fontWeight: '700' }}>{selectedReport.difference === 0 ? '✓ Audit Verified' : '⚠ Audit Discrepancy'}</div>
                            </div>

                            <div className="p-footer-sigs">
                                <div><div className="p-sig-line"></div><label style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', color: '#94a3b8' }}>Cashier Signature</label></div>
                                <div><div className="p-sig-line"></div><label style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', color: '#94a3b8' }}>Manager Approval</label></div>
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
                                            <tr key={log.id}>
                                                <td>{new Date(log.timestamp || Date.now()).toLocaleTimeString()}</td>
                                                <td>
                                                    {log.reason || log.desc || log.id}
                                                    {log.batch && <div className="batch-tag">{log.batch}</div>}
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
                                                        transaction_id: item.id
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
