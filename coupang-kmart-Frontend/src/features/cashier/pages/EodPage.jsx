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
    FileSpreadsheet
} from 'lucide-react';
import './EodPage.css';

export default function EodPage() {
    const [step, setStep] = useState(1);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('current'); // 'current' or 'history'
    const [selectedReport, setSelectedReport] = useState(null);

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
        const active = localStorage.getItem('active_session');
        if (active) {
            const sessionData = JSON.parse(active);
            setSession(sessionData);
            calculateDrawerMetrics();
        }

        // Load reports history
        const savedHistory = localStorage.getItem('eod_reports');
        if (savedHistory) {
            setReportsHistory(JSON.parse(savedHistory));
        }

        setLoading(false);
    }, []);

    const calculateDrawerMetrics = () => {
        const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
        const stats = logs.reduce((acc, log) => {
            if (log.type === 'SALE') acc.sales += log.amount;
            if (log.type === 'CASH_IN') acc.cashIn += log.amount;
            if (log.type === 'CASH_OUT') acc.cashOut += log.amount;
            if (log.type === 'REFUND') acc.refunds += log.amount;
            return acc;
        }, { sales: 0, cashIn: 0, cashOut: 0, refunds: 0 });

        setDrawerMetrics(stats);
    };

    const expectedCash = session ? (session.openingBalance + drawerMetrics.sales + drawerMetrics.cashIn - drawerMetrics.cashOut - drawerMetrics.refunds) : 0;
    const difference = physicalCount - expectedCash;

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
            status: difference === 0 ? 'BALANCED' : 'DISCREPANCY'
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
    ArrowRight,
    Printer,
    FileText,
    History,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { DUMMY_SHIFT_REPORT } from '../../../services/dummyData';
import './EodPage.css';

export default function EodPage() {
    const navigate = useNavigate();
    const [isClosing, setIsClosing] = useState(false);
    const [step, setStep] = useState(1);
    const [actualCash, setActualCash] = useState(0);
    const [denominations, setDenominations] = useState({});

    // session state
    const [session, setSession] = useState('loading');
    const [metrics, setMetrics] = useState({
        openingBalance: 0,
        cashSales: 0,
        cardSales: 0,
        refunds: 0,
        cashIn: 0,
        cashOut: 0,
        expectedCash: 0
    });

    useEffect(() => {
        const activeSession = localStorage.getItem('active_session');
        if (!activeSession) {
            setSession(false);
            return;
        }
        const sess = JSON.parse(activeSession);
        setSession(sess);

        const logs = JSON.parse(localStorage.getItem('cash_drawer_logs') || '[]');
        const cashSales = logs.filter(l => l.type === 'CASH_SALE').reduce((sum, l) => sum + l.amount, 0);
        const cardSales = logs.filter(l => l.type === 'CARD_SALE').reduce((sum, l) => sum + l.amount, 0);
        const cashIn = logs.filter(l => l.type === 'CASH_IN').reduce((sum, l) => sum + l.amount, 0);
        const cashOut = logs.filter(l => l.type === 'CASH_OUT').reduce((sum, l) => sum + l.amount, 0);
        const refunds = logs.filter(l => l.type === 'REFUND').reduce((sum, l) => sum + l.amount, 0);

        const opening = sess.openingBalance || 0;
        const expected = opening + cashSales + cashIn - refunds - cashOut;

        setMetrics({
            openingBalance: opening,
            cashSales,
            cardSales,
            refunds,
            cashIn,
            cashOut,
            expectedCash: expected
        });
    }, [navigate]);

    const handleCompleteEod = () => {
        setIsClosing(true);
        setTimeout(() => {
            localStorage.removeItem('active_session');
            localStorage.removeItem('cash_drawer_logs');
            localStorage.setItem('shift_status', 'closed');
            alert('End of Day completed successfully. Session data saved to cloud.');
            window.location.href = '/login';
        }, 2000);
    };

    const difference = actualCash - metrics.expectedCash;

    if (session === 'loading') return null;

    if (session === false) {
        return <SessionStartPage />;
    }

    return (
        <POSLayout>
            <div className="eod-premium-container">

                {/* Header with Navigation */}
                <div className="eod-header-section animate-fade-in">
                    <div className="title-area">
                        <h1>Shift Closing & EOD Reports</h1>
                        <p>Generate financial summaries and reconcile cash drawer</p>
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
                <div className="eod-header-section">
                    <div className="title-area">
                        <h1>Shift Closing & EOD Report</h1>
                        <p>Perform final cash reconciliation and close the active register session.</p>
                    </div>
                </div>

                <div className="eod-workflow-nav">
                    <div className={`workflow-item ${step >= 1 ? 'active' : ''}`}>1. Summary</div>
                    <div className="workflow-connector"></div>
                    <div className={`workflow-item ${step >= 2 ? 'active' : ''}`}>2. Denominations</div>
                    <div className="workflow-connector"></div>
                    <div className={`workflow-item ${step >= 3 ? 'active' : ''}`}>3. Finalize</div>
                </div>

                <div className="eod-main-grid">
                    {step === 1 && (
                        <div className="eod-step-summary animate-fade-in">
                            <div className="summary-cards-grid">
                                <Card glass title="Shift Performance" subtitle="Sales activity for current session">
                                    <div className="eod-metric-row">
                                        <div className="metric">
                                            <label>Total Cash Sales</label>
                                            <div className="val green">LKR {metrics.cashSales.toLocaleString()}</div>
                                        </div>
                                        <div className="metric">
                                            <label>Total Card Sales</label>
                                            <div className="val blue">LKR {metrics.cardSales.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="metric-total-box">
                                        <label>Net Collections</label>
                                        <div className="total-val">LKR {(metrics.cashSales + metrics.cardSales).toLocaleString()}</div>
                                    </div>
                                </Card>

                                <Card glass title="Expected Cash" subtitle="System calculated balance">
                                    <div className="calculation-stack">
                                        <div className="calc-row">
                                            <span>Opening Balance</span>
                                            <span>+ LKR {metrics.openingBalance.toLocaleString()}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Cash Sales</span>
                                            <span>+ LKR {metrics.cashSales.toLocaleString()}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Cash In/Out</span>
                                            <span>{metrics.cashIn - metrics.cashOut >= 0 ? '+' : ''} LKR {(metrics.cashIn - metrics.cashOut).toLocaleString()}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Refunds</span>
                                            <span>- LKR {metrics.refunds.toLocaleString()}</span>
                                        </div>
                                        <div className="calc-divider"></div>
                                        <div className="calc-row result">
                                            <span>Expected In Drawer</span>
                                            <span>LKR {metrics.expectedCash.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <div className="step-actions">
                                <Button variant="primary" size="lg" onClick={() => setStep(2)}>
                                    Verify Physical Cash <ArrowRight size={20} />
                                </Button>
            <div className="eod-page-wrapper">
                <div className="content-header">
                    <h1>End of Day (EOD) Close</h1>
                    <p>Review today's shift performance and close the register.</p>
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
                                <Card white title="Financial Summary" subtitle="System calculated snapshot">
                                    <div className="calculation-stack">
                                        <div className="calc-row">
                                            <span>Opening Balance</span>
                                            <span>LKR {session.openingBalance.toLocaleString()}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Total Cash Sales (+)</span>
                                            <span>LKR {drawerMetrics.sales.toLocaleString()}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Cash In (+)</span>
                                            <span>LKR {drawerMetrics.cashIn.toLocaleString()}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Cash Out (-)</span>
                                            <span style={{ color: '#ef4444' }}>-LKR {drawerMetrics.cashOut.toLocaleString()}</span>
                                        </div>
                                        <div className="calc-row">
                                            <span>Refunds (-)</span>
                                            <span style={{ color: '#ef4444' }}>-LKR {drawerMetrics.refunds.toLocaleString()}</span>
                                        </div>
                                        <div className="calc-divider"></div>
                                        <div className="calc-row result">
                                            <span>Expected Drawer Total</span>
                                            <span>LKR {expectedCash.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 step-actions">
                                        <Button variant="primary" fullWidth onClick={() => setStep(2)}>
                                            Next: Count Physical Cash <ArrowRight size={18} />
                                        </Button>
                                    </div>
                                </Card>

                                <Card white title="Shift Meta" subtitle="Session identification">
                                    <div className="reconcile-card">
                                        <div className="reconcile-item">
                                            <label>Session ID</label>
                                            <span>{session.id}</span>
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
                                    <Card white title="Denomination Verification" subtitle="Count all physical cash in your drawer">
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
                                            <h2>Final Reconciliation Report</h2>
                                            <p>All financial logs and denominations have been verified.</p>
                                        </div>

                                        <div className="report-summary-bits">
                                            <div className="bit"><User size={16} /> {session.cashier}</div>
                                            <div className="bit"><Clock size={16} /> {new Date().toLocaleTimeString()}</div>
                                            <div className="bit"><Calculator size={16} /> {Object.keys(denominations).length} Denoms</div>
                                        </div>

                                        <div className="final-confirmation-list">
                                            <div className="conf-check">
                                                <CheckCircle2 size={18} /> Inventory levels synced to backend
                                            </div>
                                            <div className="conf-check">
                                                <CheckCircle2 size={18} /> Financial logs encrypted and backup created
                                            </div>
                                            <div className={`conf-check ${difference !== 0 ? 'warning' : ''}`}>
                                                {difference === 0 ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                                {difference === 0 ? 'No cash discrepancies detected' : `Detected LKR ${difference} discrepancy - Flagged for review`}
                                            </div>
                                        </div>

                                        <div className="final-actions">
                                            <Button variant="primary" fullWidth size="lg" onClick={handleCompleteEod}>
                                                🔥 FINAL SAVE & CLOSE REGISTER
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
                                            <button className="h-action-btn" onClick={() => downloadReport(report)}>
                                                <Download size={14} /> Download
                                            </button>
                                            <button className="h-action-btn">
                                                <Printer size={14} /> Print
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
                    )}

                    {step === 2 && (
                        <div className="eod-step-denoms animate-slide-up">
                            <div className="denoms-wrapper-grid">
                                <div className="denom-input-col">
                                    <Card glass title="Denomination Verification" subtitle="Count all physical cash in your drawer">
                                        <DenominationCounter
                                            onTotalChange={setActualCash}
                                            onDenominationsChange={setDenominations}
                                        />
                                    </Card>
                                </div>
                                <div className="denom-summary-col">
                                    <Card glass title="Reconciliation" subtitle="Live comparison result">
                                        <div className="reconcile-card">
                                            <div className="reconcile-item">
                                                <label>System Expected</label>
                                                <span>LKR {metrics.expectedCash.toLocaleString()}</span>
                                            </div>
                                            <div className="reconcile-item highlight">
                                                <label>Physical Counted</label>
                                                <span>LKR {actualCash.toLocaleString()}</span>
                                            </div>
                                            <div className="reconcile-divider"></div>
                                            <div className={`reconcile-diff ${difference === 0 ? 'perfect' : (difference > 0 ? 'surplus' : 'mismatch')}`}>
                                                <label>{difference === 0 ? 'Perfect Balance' : (difference > 0 ? 'Cash Surplus' : 'Cash Shortage')}</label>
                                                <div className="diff-val">
                                                    {difference > 0 ? '+' : ''}{difference.toLocaleString()}
                                                </div>
                                                {difference !== 0 && (
                                                    <div className="diff-alert">
                                                        <AlertCircle size={14} />
                                                        <span>Requires admin approval</span>
                                                    </div>
                                                )}
                                                {difference === 0 && (
                                                    <div className="diff-success">
                                                        <CheckCircle2 size={14} />
                                                        <span>Verified & Balanced</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>

                                    <div className="step-actions mt-4">
                                        <Button variant="secondary" onClick={() => setStep(1)}>Go Back</Button>
                                        <Button variant="primary" onClick={() => setStep(3)}>Proceed to Closing</Button>
                                    </div>
                    <div className="eod-actions-sidebar">
                        <div className="eod-sidebar-card">
                            <h2>Finalize Shift</h2>
                            <div className="packed-alerts">
                                <div className="packed-alert-item success">
                                    <CheckCircle2 size={14} />
                                    <span>All transactions synced</span>
                                </div>
                                <div className="packed-alert-item warning">
                                    <AlertCircle size={14} />
                                    <span>{report.pendingAlerts} Pending low stock alerts</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="eod-step-finalize animate-fade-in">
                            <div className="finalize-wrapper">
                                <Card glass className="final-report-card">
                                    <div className="final-header">
                                        <ShieldCheck size={48} className="shield-icon" />
                                        <h2>Ready to Close Session</h2>
                                        <p>Review the final report summary and confirm closure.</p>
                                    </div>

                            <div className="report-print-paper" id="eod-printable-report">
                                <div className="p-report-header">
                                    <div className="p-brand">
                                        <div className="p-logo">CK</div>
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
                                    <div className="report-summary-bits">
                                        <div className="bit">
                                            <History size={16} />
                                            <span>Shift Duration: 8h 24m</span>
                                        </div>
                                        <div className="bit">
                                            <TrendingUp size={16} />
                                            <span>Avg. Ticket: LKR 1,450</span>
                                        </div>
                                    </div>

                                    <div className="final-confirmation-list">
                                        <div className="conf-check">
                                            <CheckCircle2 size={18} />
                                            <span>Inventory levels synced to backend</span>
                                        </div>
                                        <div className="conf-check">
                                            <CheckCircle2 size={18} />
                                            <span>Financial logs encrypted and backup created</span>
                                        </div>
                                        <div className="conf-check warning">
                                            <AlertCircle size={18} />
                                            <span>{difference !== 0 ? 'Discrepancy noted for admin review' : 'No cash discrepancies detected'}</span>
                                        </div>
                                    </div>

                                    <div className="final-actions">
                                        <Button
                                            variant="secondary"
                                            fullWidth
                                            onClick={() => setStep(2)}
                                            disabled={isClosing}
                                        >
                                            Review Denominations
                                        </Button>
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            size="lg"
                                            onClick={handleCompleteEod}
                                            loading={isClosing}
                                        >
                                            Complete EOD & Close Register
                                        </Button>
                                    </div>
                                </Card>

                                <div className="report-actions-mini">
                                    <button className="ra-btn"><Printer size={16} /> Print Shift X-Report</button>
                                    <button className="ra-btn"><FileText size={16} /> Export Detailed CSV</button>
                                </div>
                            </div>
                        </div>
                    )}
                            <p className="packed-notice">
                                Closing the day will generate the daily report and sign you out. You cannot re-open this shift.
                            </p>

                            <button
                                className="complete-eod-btn-new"
                                onClick={handleCompleteEod}
                                disabled={isClosing}
                            >
                                {isClosing ? 'Closing Register...' : 'Complete EOD Close'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </POSLayout>
    );
}

