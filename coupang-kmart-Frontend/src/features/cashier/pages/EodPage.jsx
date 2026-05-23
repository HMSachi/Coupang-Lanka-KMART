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
            <div className="eod-page-wrapper">
                <div className="content-header">
                    <h1>End of Day (EOD) Close</h1>
                    <p>Review today's shift performance and close the register.</p>
                </div>

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
                                <Card white title="Financial Summary" subtitle="System calculated snapshot">
                                    <div className="calculation-stack">
                                        <div className="calc-row"><span>Opening Balance</span><span>LKR {session.openingBalance.toLocaleString()}</span></div>
                                        <div className="calc-row"><span>Total Cash Sales (+)</span><span>LKR {drawerMetrics.sales.toLocaleString()}</span></div>
                                        <div className="calc-row"><span>Cash In (+)</span><span>LKR {drawerMetrics.cashIn.toLocaleString()}</span></div>
                                        <div className="calc-row"><span>Cash Out (-)</span><span style={{ color: '#ef4444' }}>-LKR {drawerMetrics.cashOut.toLocaleString()}</span></div>
                                        <div className="calc-row"><span>Refunds (-)</span><span style={{ color: '#ef4444' }}>-LKR {drawerMetrics.refunds.toLocaleString()}</span></div>
                                        <div className="calc-divider"></div>
                                        <div className="calc-row result"><span>Expected Drawer Total</span><span>LKR {expectedCash.toLocaleString()}</span></div>
                                    </div>
                                    <div className="mt-4 step-actions">
                                        <Button variant="primary" fullWidth onClick={() => setStep(2)}>Next: Count Physical Cash <ArrowRight size={18} /></Button>
                                    </div>
                                </Card>
                                <Card white title="Session Identification">
                                    <div className="reconcile-card">
                                        <div className="reconcile-item"><label>Session ID</label><span>{session.id}</span></div>
                                        <div className="reconcile-item"><label>Cashier</label><span>{session.cashier}</span></div>
                                        <div className="reconcile-item"><label>Start Time</label><span>{new Date(session.startTime).toLocaleString()}</span></div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="denoms-wrapper-grid animate-slide-up">
                                <div className="denoms-list-col">
                                    <Card white title="Denomination Verification" subtitle="Count all physical cash in your drawer">
                                        <DenominationCounter onTotalChange={setPhysicalCount} onDenominationsChange={setDenominations} />
                                    </Card>
                                </div>
                                <div className="reconcile-status-side animate-scale">
                                    <Card white title="Live Balance">
                                        <div className="reconcile-card">
                                            <div className="reconcile-item"><label>System Expected</label><span>LKR {expectedCash.toLocaleString()}</span></div>
                                            <div className="reconcile-item highlight"><label>Physical Counted</label><span>LKR {physicalCount.toLocaleString()}</span></div>
                                            <div className="reconcile-divider"></div>
                                            <div className={`reconcile-diff ${difference === 0 ? 'perfect' : (difference > 0 ? 'surplus' : 'mismatch')}`}>
                                                <label>Current Difference</label>
                                                <div className="diff-val">LKR {difference.toLocaleString()}</div>
                                                {difference === 0 ? <span className="diff-success"><ShieldCheck size={16} /> Verified</span> : <span className="diff-alert"><AlertCircle size={16} /> Mismatch</span>}
                                            </div>
                                            <div className="step-actions-vertical mt-4">
                                                <Button variant="primary" fullWidth size="lg" onClick={() => setStep(3)}>Proceed to Finalize <ArrowRight size={18} /></Button>
                                                <Button variant="secondary" fullWidth onClick={() => setStep(1)}><ArrowLeft size={18} /> Back</Button>
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
                                            <h2>Final Report</h2>
                                            <p>All financial logs have been verified.</p>
                                        </div>
                                        <div className="final-actions">
                                            {!reportSent && <Button variant="primary" fullWidth size="lg" onClick={handleSendReportInit}>Send Report to Admin</Button>}
                                            <Button variant="primary" fullWidth size="lg" onClick={handleCompleteEod} disabled={!reportSent} style={reportSent ? { background: '#ef4444' } : {}}>End shift</Button>
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
                                        <div className="report-h-top"><div className={`status-tag ${report.status.toLowerCase()}`}>{report.status}</div></div>
                                        <div className="report-h-actions">
                                            <button className="h-action-btn view-btn" onClick={() => setSelectedReport(report)}>View Details <ChevronRight size={14} /></button>
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
                            <h3>Shift Reconciliation Report</h3>
                            <button onClick={() => setSelectedReport(null)} className="close-modal-btn"><X size={20} /></button>
                        </div>
                        <div className="report-print-paper" id="eod-printable-report">
                            <div className="p-report-header">
                                <h2>Coupang Kmart Shift Report</h2>
                                <div><strong>ID:</strong> {selectedReport.id}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </POSLayout>
    );
}
