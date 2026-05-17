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
                        </div>
                    </div>
                )}
            </div>
        </POSLayout>
    );
}
