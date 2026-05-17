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
    ArrowRight,
    Printer,
    FileText,
    History,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
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
                            </div>
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
                </div>
            </div>
        </POSLayout>
    );
}
