import React, { useState } from 'react';
import POSLayout from '../../../layouts/POSLayout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { DUMMY_SHIFT_REPORT } from '../../../services/dummyData';

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
            <div className="eod-container">
                <div className="content-header">
                    <h1>End of Day (EOD) Close</h1>
                    <p>Review today's shift performance and close the register.</p>
                </div>

                <div className="eod-grid">
                    <div className="eod-summary">
                        <Card title="Shift Summary" subtitle="Total sales for current session">
                            <div className="eod-stats">
                                <div className="stat-item">
                                    <label>Cash Sales</label>
                                    <div className="val">LKR {report.cashSales.toLocaleString()}</div>
                                </div>
                                <div className="stat-item">
                                    <label>Card Sales</label>
                                    <div className="val">LKR {report.cardSales.toLocaleString()}</div>
                                </div>
                                <div className="stat-item total">
                                    <label>Total Collected</label>
                                    <div className="val">LKR {report.totalCollected.toLocaleString()}</div>
                                </div>
                            </div>
                        </Card>

                        <div style={{ marginTop: '1.5rem' }}>
                            <Card title="Cash Drawer" subtitle="Physical cash reconciliation">
                                <div className="drawer-check-premium">
                                    <div className="drawer-field">
                                        <label>Opening Balance</label>
                                        <div className="readonly-val">LKR {report.openingBalance.toLocaleString()}</div>
                                    </div>
                                    <div className="drawer-field">
                                        <label>Actual Cash in Drawer</label>
                                        <input type="number" placeholder="0.00" />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="eod-actions">
                        <Card glass title="Finalize Shift">
                            <div className="eod-alerts">
                                <div className="alert-item success">
                                    <CheckCircle2 size={16} />
                                    <span>All transactions synced</span>
                                </div>
                                <div className="alert-item warning">
                                    <AlertCircle size={16} />
                                    <span>{report.pendingAlerts} Pending low stock alerts</span>
                                </div>
                            </div>

                            <p className="eod-notice">
                                Closing the day will generate the daily report and sign you out of this register. You cannot re-open this shift.
                            </p>

                            <Button
                                variant="primary"
                                fullWidth
                                size="lg"
                                onClick={handleCompleteEod}
                                disabled={isClosing}
                            >
                                {isClosing ? 'Closing Register...' : 'Complete EOD Close'}
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </POSLayout>
    );
}
