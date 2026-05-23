import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import Card from '../../../components/shared/Card';
import { FileText, Download, Printer, User, Clock, ChevronRight, X, ShieldCheck } from 'lucide-react';
import '../../cashier/pages/EodPage.css'; // Reusing styles from EOD for the printable modal

export default function CashierReports() {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock fetching only reports sent to admin
        const fetchSentReports = () => {
            const allLocalReports = JSON.parse(localStorage.getItem('eod_reports') || '[]');
            const sentReports = allLocalReports.filter(r => r.sentToAdmin === true);
            setReports(sentReports);
            setLoading(false);
        };

        fetchSentReports();
    }, []);

    const downloadReport = (report) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `Cashier_EOD_${report.id}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    if (loading) {
        return (
            <AdminLayout>
                <div style={{ padding: '2rem' }}>Loading Cashier Reports...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Cashier End-of-Day Reports</h1>
                    <p style={{ color: '#64748b' }}>Review financial reports submitted by branch cashiers.</p>
                </div>

                <div className="history-section animate-slide-up bg-white/10 p-6 rounded-[2rem]">
                    {reports.length === 0 ? (
                        <Card white>
                            <div className="empty-history" style={{ textAlign: 'center', padding: '40px' }}>
                                <FileText size={48} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
                                <h3>No Reports Received Yet</h3>
                                <p style={{ color: '#94a3b8' }}>When a cashier sends their final reconciliation report to the admin, it will appear here.</p>
                            </div>
                        </Card>
                    ) : (
                        <div className="history-grid">
                            {reports.map((report) => (
                                <Card white key={report.id} className="history-report-card shadow-sm border border-gray-100">
                                    <div className="report-h-top">
                                        <div className={`status-tag ${report.status.toLowerCase()}`}>
                                            {report.status}
                                        </div>
                                        <div className="h-date font-semibold">
                                            {new Date(report.endTime).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="report-h-main">
                                        <div className="h-metric">
                                            <label>Total Cash Returned</label>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>
                                                LKR {report.actualCash.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="h-sub-info mt-3 flex flex-col gap-1 text-gray-500 text-sm">
                                            <div className="flex items-center gap-1"><Clock size={14} /> Completed: {new Date(report.endTime).toLocaleTimeString()}</div>
                                            <div className="flex items-center gap-1"><User size={14} /> Cashier: {report.cashier}</div>
                                        </div>
                                    </div>

                                    <div className="report-h-actions mt-4 pt-4 border-t border-gray-100 flex gap-2">
                                        <button className="h-action-btn flex items-center justify-center gap-1 flex-1 bg-gray-50 hover:bg-blue-50 py-2 rounded-lg text-gray-600 hover:text-blue-600 transition-colors" onClick={() => downloadReport(report)}>
                                            <Download size={14} /> JSON
                                        </button>
                                        <button className="h-action-btn view-btn flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 py-2 rounded-lg transition-colors" onClick={() => setSelectedReport(report)}>
                                            View Report
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* REUSED MODAL FROM EOD FOR ADMIN VIEW */}
                {selectedReport && (
                    <div className="report-modal-overlay">
                        <div className="report-modal-container animate-scale" style={{ maxWidth: '700px' }}>
                            <div className="report-modal-header bg-gray-900 text-white">
                                <h3>Official Administrative Shift Report</h3>
                                <div className="modal-actions">
                                    <button onClick={() => window.print()} className="print-trigger-btn flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors">
                                        <Printer size={16} /> Print Data
                                    </button>
                                    <button onClick={() => setSelectedReport(null)} className="close-modal-btn p-1 hover:bg-white/10 rounded ml-2">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="report-print-paper" id="eod-printable-report" style={{ background: 'white' }}>
                                <div className="p-report-header">
                                    <div className="p-brand">
                                        <div className="p-logo bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl">CK</div>
                                        <div style={{ marginLeft: '12px' }}>
                                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Coupang Kmart</h2>
                                            <p style={{ color: '#64748b' }}>Admin Copy - Confirmed EOD Report</p>
                                        </div>
                                    </div>
                                    <div className="p-meta text-right text-sm text-gray-600">
                                        <div><strong>Report ID:</strong> {selectedReport.id}</div>
                                        <div><strong>Submitted:</strong> {new Date(selectedReport.endTime).toLocaleString()}</div>
                                        <div style={{ color: selectedReport.status === 'BALANCED' ? '#10b981' : '#ef4444' }}>
                                            <strong>Status:</strong> {selectedReport.status}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-divider my-6 border-b-2 border-dashed border-gray-200"></div>

                                <div className="p-info-grid grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-info-box bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <label className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2 block">Employee Identity</label>
                                        <div className="p-val text-sm mb-1"><strong>Name:</strong> {selectedReport.cashier}</div>
                                        <div className="p-val text-sm"><strong>Register ID:</strong> {selectedReport.registerId || 'Register #01'}</div>
                                    </div>
                                    <div className="p-info-box bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <label className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2 block">Time Log</label>
                                        <div className="p-val text-sm mb-1"><strong>Session Open:</strong> {new Date(selectedReport.startTime).toLocaleTimeString()}</div>
                                        <div className="p-val text-sm"><strong>Session Close:</strong> {new Date(selectedReport.endTime).toLocaleTimeString()}</div>
                                    </div>
                                </div>

                                <div className="p-section mb-8">
                                    <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Financial Reconciliation Summary</h4>
                                    <table className="p-table w-full text-sm">
                                        <tbody>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 text-gray-600">Opening Balance</td>
                                                <td className="py-2 text-right font-medium text-gray-900">LKR {selectedReport.openingBalance.toLocaleString()}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 text-gray-600">Total Cash Sales</td>
                                                <td className="py-2 text-right font-medium text-green-600">+ LKR {selectedReport.metrics.sales.toLocaleString()}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 text-gray-600">Total Cash In</td>
                                                <td className="py-2 text-right font-medium text-green-600">+ LKR {selectedReport.metrics.cashIn.toLocaleString()}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 text-gray-600">Total Cash Out</td>
                                                <td className="py-2 text-right font-medium text-red-500">- LKR {selectedReport.metrics.cashOut.toLocaleString()}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 text-gray-600">Refunds Processed</td>
                                                <td className="py-2 text-right font-medium text-red-500">- LKR {selectedReport.metrics.refunds?.toLocaleString() || 0}</td>
                                            </tr>
                                            <tr className="p-expected-row bg-gray-50 p-2 mt-2 font-bold text-gray-900">
                                                <td className="py-2 px-2 rounded-l-lg border-t border-b border-l border-gray-200 uppercase tracking-wide text-xs">System Expected Balance</td>
                                                <td className="py-2 px-2 text-right text-lg rounded-r-lg border-t border-b border-r border-gray-200">LKR {selectedReport.expectedCash.toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-section mb-8">
                                    <h4 className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Physical Count Audit</h4>
                                    <div className="p-denoms-grid bg-white border border-gray-200 rounded-lg p-4">
                                        {Object.entries(selectedReport.denominations).map(([val, qty]) => (
                                            qty > 0 && (
                                                <div key={val} className="p-denom-row flex justify-between py-1 border-b border-gray-50 last:border-0 text-sm">
                                                    <span className="text-gray-500">LKR {parseInt(val).toLocaleString()}</span>
                                                    <span className="text-gray-400">x {qty}</span>
                                                    <span className="font-medium text-gray-800">LKR {(parseInt(val) * qty).toLocaleString()}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                    <div className="p-actual-row flex justify-between items-center bg-gray-900 text-white mt-4 p-4 rounded-xl shadow-inner">
                                        <span className="uppercase text-xs font-bold tracking-widest text-gray-300">Total Handed Over</span>
                                        <span className="text-xl font-bold">LKR {selectedReport.actualCash.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className={`p-diff-box p-4 rounded-xl border-l-4 mb-8 ${selectedReport.difference === 0 ? 'bg-green-50 border-green-500 text-green-900' : 'bg-red-50 border-red-500 text-red-900'}`}>
                                    <div className="p-diff-label text-xs uppercase font-bold tracking-wider mb-1 opacity-70">Admin Review Outcome</div>
                                    <div className="p-diff-val text-2xl font-black mb-2 flex items-center gap-2">
                                        {selectedReport.difference === 0 ? <ShieldCheck size={28} /> : <X size={28} />}
                                        LKR {selectedReport.difference.toLocaleString()} Variance
                                    </div>
                                    <p className="font-medium">{selectedReport.difference === 0 ? 'Verified: Cash drawer perfectly balanced.' : 'Action Required: Cash irregularity flagged limits exceeded.'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
