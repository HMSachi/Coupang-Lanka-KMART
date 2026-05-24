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

            const savedHistory = localStorage.getItem('eod_reports');
            if (savedHistory) {
                let parsedHistory = JSON.parse(savedHistory);
                parsedHistory = parsedHistory.filter(r =>
                    new Date(r.startTime).getTime() === new Date(sessionData.startTime).getTime()
                );
                setReportsHistory(parsedHistory);
            }
        } else {
            const savedHistory = localStorage.getItem('eod_reports');
            if (savedHistory) {
                setReportsHistory(JSON.parse(savedHistory));
            }
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
                await fetch(`${apiUrl}/api/reports`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cashier_name: session.cashier, branch_id: null, report_data: draft })
                });
                setReportSent(true);
                setIsSelectReportModalOpen(false);
                alert('Report successfully sent to Admin!');
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
                                <Card white title="Financial Audit" subtitle="System accuracy check">
                                    <div className="calculation-stack">
                                        <div className="calc-row"><span><Activity size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Opening Balance</span><span>LKR {session.openingBalance.toLocaleString()}</span></div>
                                        <div className="calc-row"><span><ShoppingBag size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Cash Sales</span><span>LKR {drawerMetrics.sales.toLocaleString()}</span></div>
                                        <div className="calc-row"><span><PlusCircle size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Injections</span><span>LKR {drawerMetrics.cashIn.toLocaleString()}</span></div>
                                        <div className="calc-row"><span><ArrowUpCircle size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Withdrawals</span><span className="text-red-500">-LKR {drawerMetrics.cashOut.toLocaleString()}</span></div>
                                        <div className="calc-row"><span><RotateCcw size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Refunds</span><span className="text-red-500">-LKR {drawerMetrics.refunds.toLocaleString()}</span></div>
                                        <div className="calc-divider"></div>
                                        <div className="calc-row result"><span><Target size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Expected Total</span><span>LKR {expectedCash.toLocaleString()}</span></div>
                                    </div>
                                    <div className="mt-6 step-actions">
                                        <Button variant="primary" fullWidth onClick={() => setStep(2)}>Secure Audit Transfer <ArrowRight size={14} /></Button>
                                    </div>
                                </Card>
                                <Card white title="Session Identity" subtitle="Operator credentials">
                                    <div className="reconcile-card">
                                        <div className="reconcile-item"><label>Register Terminal</label><span>{session.registerId || 'POS-01'}</span></div>
                                        <div className="reconcile-item"><label>Active Cashier</label><span>{session.cashier}</span></div>
                                        <div style={{ gridColumn: 'span 2', height: '1px', background: 'rgba(0,0,0,0.03)', margin: '4px 0' }}></div>
                                        <div className="reconcile-item" style={{ gridColumn: 'span 2' }}><label>Session Timestamp</label><span>{new Date(session.startTime).toLocaleString()}</span></div>
                                        <div className="reconcile-item" style={{ gridColumn: 'span 2' }}><label>Unique Trace ID</label><span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{session.id}</span></div>
                                    </div>
                                    <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}><Lock size={16} color="#6366f1" /></div>
                                            <div>
                                                <h4 style={{ fontSize: '12px', fontWeight: '800', margin: 0 }}>Audit Protocol</h4>
                                                <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Closure will finalize all ledgers</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="denoms-wrapper-grid animate-slide-up">
                                <div className="denoms-list-col">
                                    <Card white title="Physical Inventory" subtitle="Categorized audit">
                                        <DenominationCounter onTotalChange={setPhysicalCount} onDenominationsChange={setDenominations} />
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
                            <div className="modal-actions">
                                <button className="print-trigger-btn" onClick={() => window.print()}><Printer size={16} /> Print Audit</button>
                                <button onClick={() => setSelectedReport(null)} className="close-modal-btn"><X size={20} /></button>
                            </div>
                        </div>
                        <div className="report-print-paper" id="eod-printable-report">
                            <div className="p-report-header">
                                <div className="p-brand">
                                    <div className="p-logo">K</div>
                                    <div>
                                        <h2>Kmart Terminal POS</h2>
                                        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Session Audit Report</p>
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
                </div>
            )}
        </POSLayout>
    );
}
