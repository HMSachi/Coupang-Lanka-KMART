import React, { useState } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { DUMMY_SHIFT_REPORT } from '../../../services/dummyData';
import './EodPage.css';

export default function EodPage() {
    const [isClosing, setIsClosing] = useState(false);
    const report = DUMMY_SHIFT_REPORT;

    const handleCompleteEod = () => {
        setIsClosing(true);
        // Simulate API call
        setTimeout(() => {
            localStorage.setItem('shift_status', 'closed');
            alert('End of Day completed. Shift report sent to Admin.');
            window.location.href = '/login';
        }, 1500);
    };

    return (
        <POSLayout>
            <div className="eod-page-wrapper">
                <div className="content-header">
                    <h1>End of Day (EOD) Close</h1>
                    <p>Review today's shift performance and close the register.</p>
                </div>

                <div className="eod-grid-new">
                    <div className="eod-card-unified">
                        <div className="eod-section-card">
                            <h2>Shift Summary</h2>
                            <p className="subtitle">Total sales for current session</p>
                            <div className="eod-stats-packed">
                                <div className="packed-stat">
                                    <label>Cash Sales</label>
                                    <div className="val">LKR {report.cashSales.toLocaleString()}</div>
                                </div>
                                <div className="packed-stat">
                                    <label>Card Sales</label>
                                    <div className="val">LKR {report.cardSales.toLocaleString()}</div>
                                </div>
                                <div className="packed-stat full">
                                    <label>Total Collected</label>
                                    <div className="val">LKR {report.totalCollected.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        <div className="eod-section-card">
                            <h2>Cash Drawer</h2>
                            <p className="subtitle">Physical cash reconciliation</p>
                            <div className="drawer-check-packed">
                                <div className="packed-field">
                                    <label>Opening Balance</label>
                                    <div className="packed-readonly">LKR {report.openingBalance.toLocaleString()}</div>
                                </div>
                                <div className="packed-field">
                                    <label>Actual Cash in Drawer</label>
                                    <input type="number" className="packed-input" placeholder="0.00" />
                                </div>
                            </div>
                        </div>
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
                </div>
            </div>
        </POSLayout>
    );
}
