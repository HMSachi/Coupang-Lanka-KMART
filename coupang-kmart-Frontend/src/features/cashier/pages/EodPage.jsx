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
    const [reportSent, setReportSent] = useState(false);
    const [isSelectReportModalOpen, setIsSelectReportModalOpen] = useState(false);
    const [draftsList, setDraftsList] = useState([]);

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

    const confirmSendReport = (id) => {
        if (window.confirm('Are you sure you want to securely transmit this End-of-Day report to the Admin for final reconciliation?')) {
            // Here you would implement backend call
            setReportSent(true);
            setIsSelectReportModalOpen(false);
            alert('Report successfully sent to Admin!');
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
                        <h1 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>Shift Closing & EOD Reports</h1>
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

                                <Card white title="Session Identification">
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
                                            <h2 style={{ fontFamily: '"Inter", system-ui, sans-serif', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>Final Report</h2>
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
            </div>
        </POSLayout>
    );
}
