import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import Card from '../../../components/shared/Card';
import { FileText, Download, Printer, User, Clock, ChevronRight, X, ShieldCheck } from 'lucide-react';
import '../../cashier/pages/EodPage.css'; // Reusing styles from EOD for the printable modal

import { API_BASE_URL } from '../../../config';

export default function CashierReports() {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedOrderReport, setSelectedOrderReport] = useState(null);
    const [drillDownCategory, setDrillDownCategory] = useState(null);
    const [drillDownTransactions, setDrillDownTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = API_BASE_URL;
                const response = await fetch(`${apiUrl}/api/reports`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                // Map database fields to the structural format used in the UI
                const mappedData = data.map(r => {
                    let reportData = r.report_data || {};
                    if (typeof reportData === 'string') {
                        try {
                            reportData = JSON.parse(reportData);
                        } catch (err) {
                            reportData = {};
                        }
                    }

                    // Ensure numeric fields are properly coerced
                    const mapped = {
                        ...reportData,
                        db_id: r.id,
                        db_status: r.status,
                        submitted_at: r.created_at
                    };
                    
                    // Force numeric types for critical fields
                    if (mapped.openingBalance !== undefined && mapped.openingBalance !== null) {
                        mapped.openingBalance = parseFloat(mapped.openingBalance) || 0;
                    }
                    
                    return mapped;
                });

                setReports(mappedData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching reports:', error);
                setLoading(false);
            }
        };

        fetchReports();
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

    // Helper to filter logs by category (matching EodPage logic)
    const getFilteredLogs = (logs, category) => {
        if (!Array.isArray(logs)) return [];
        
        switch (category) {
            case 'SALE':
                return logs.filter(log => ['SALE', 'CASH_SALE', 'CARD_SALE', 'BANK_TRANSFER'].includes(log.type));
            case 'CASH_IN':
                return logs.filter(log => log.type === 'CASH_IN');
            case 'CASH_OUT':
                return logs.filter(log => log.type === 'CASH_OUT');
            case 'REFUND':
                return logs.filter(log => log.type === 'REFUND');
            default:
                return logs;
        }
    };

    const calculateMetricsFromLogs = (logs) => {
        if (!Array.isArray(logs)) return { sales: 0, cashIn: 0, cashOut: 0, refunds: 0 };
        return logs.reduce((acc, log) => {
            const amount = Number(log.amount) || 0;
            if (['SALE', 'CASH_SALE', 'CARD_SALE', 'BANK_TRANSFER'].includes(log.type)) acc.sales += amount;
            if (log.type === 'CASH_IN') acc.cashIn += amount;
            if (log.type === 'CASH_OUT') acc.cashOut += amount;
            if (log.type === 'REFUND') acc.refunds += amount;
            return acc;
        }, { sales: 0, cashIn: 0, cashOut: 0, refunds: 0 });
    };

    const getReportMetrics = (report) => {
        const metrics = report?.metrics || {};
        const metricsStats = {
            sales: Number(metrics.sales) || 0,
            cashIn: Number(metrics.cashIn) || 0,
            cashOut: Number(metrics.cashOut) || 0,
            refunds: Number(metrics.refunds) || 0
        };
        
        // Prefer pre-calculated metrics from the draft
        const metricsTotal = metricsStats.sales + metricsStats.cashIn + metricsStats.cashOut + metricsStats.refunds;
        if (metricsTotal > 0) return metricsStats;
        
        // Fallback: calculate from logs if metrics are not available
        const logsStats = calculateMetricsFromLogs(report?.cash_drawer_logs || []);
        return logsStats;
    };

    const getOrderItems = (report) => {
        const sessionOrders = Array.isArray(report?.sessionOrders) ? report.sessionOrders : [];
        const onlineOrders = Array.isArray(report?.onlineOrders) ? report.onlineOrders : [];
        return [...sessionOrders, ...onlineOrders];
    };

    const getOrderId = (order) => order?.order_id || order?.id || order?.orderId || 'N/A';

    const isOnlineOrder = (order) => {
        const orderId = String(getOrderId(order));
        return orderId.startsWith('ORD-') || order?.source === 'ONLINE' || order?.channel === 'ONLINE' || order?.order_type === 'ONLINE';
    };

    const getOrderAmount = (order) => parseFloat(order?.total_amount ?? order?.totalAmount ?? order?.amount ?? 0) || 0;

    const getOrderPayment = (order) => order?.payment_method || order?.paymentMethod || order?.payment || 'N/A';

    const getSessionActions = (order, cashier) => {
        if (Array.isArray(order?.session_actions) && order.session_actions.length > 0) {
            return order.session_actions;
        }

        const actions = [];
        if (order.approved_by === cashier) actions.push('Approved');
        if (order.processed_by === cashier) actions.push('Processed');
        if (order.shipped_by === cashier) actions.push('Handover');
        if (order.delivered_by === cashier) actions.push('Delivered');
        if (order.cash_received_by === cashier) actions.push('Cash Received');
        if (order.cashier_name === cashier) actions.push('POS Issued');
        return actions;
    };

    // Handle drill down into financial details
    const handleFinancialDrillDown = (category, report) => {
        const logs = report.cash_drawer_logs || [];
        const filtered = getFilteredLogs(logs, category);
        setDrillDownCategory(category);
        setDrillDownTransactions(filtered);
    };

    const selectedReportMetrics = selectedReport
        ? getReportMetrics(selectedReport)
        : { sales: 0, cashIn: 0, cashOut: 0, refunds: 0 };
    const selectedOrderItems = selectedOrderReport ? getOrderItems(selectedOrderReport) : [];

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

                                    <div className="report-h-actions mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                                        <button className="h-action-btn view-btn bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold shadow-sm" onClick={() => setSelectedReport(report)}>
                                            <FileText size={18} /> Open Cash Report
                                        </button>
                                        <button className="h-action-btn flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl transition-all font-bold shadow-sm" onClick={() => setSelectedOrderReport(report)}>
                                            <Printer size={18} /> Open Order Report
                                        </button>
                                        <button className="h-action-btn flex items-center justify-center gap-1 py-1 rounded-lg text-gray-400 hover:text-gray-600 text-[10px] transition-colors" onClick={() => downloadReport(report)}>
                                            <Download size={10} /> Download Raw Log
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
                                        <button
                                            onClick={() => {
                                                setSelectedOrderReport(selectedReport);
                                                setSelectedReport(null);
                                            }}
                                            className="print-trigger-btn flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
                                        >
                                            <FileText size={16} /> View Order Report
                                        </button>
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
                                            <tr className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => handleFinancialDrillDown('OPENING_BALANCE', selectedReport)}>
                                                <td className="py-2 text-gray-600">Opening Balance</td>
                                                <td className="py-2 text-right font-medium text-gray-900">LKR {((selectedReport?.openingBalance !== undefined && selectedReport?.openingBalance !== null) ? selectedReport.openingBalance : (selectedReport?.metrics?.openingBalance || 0)).toLocaleString()}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100 hover:bg-green-50 cursor-pointer transition-colors" onClick={() => handleFinancialDrillDown('SALE', selectedReport)}>
                                                <td className="py-2 text-gray-600">Total Cash Sales</td>
                                                <td className="py-2 text-right font-medium text-green-600">+ LKR {selectedReportMetrics.sales.toLocaleString()}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100 hover:bg-green-50 cursor-pointer transition-colors" onClick={() => handleFinancialDrillDown('CASH_IN', selectedReport)}>
                                                <td className="py-2 text-gray-600">Total Cash In</td>
                                                <td className="py-2 text-right font-medium text-green-600">+ LKR {selectedReportMetrics.cashIn.toLocaleString()}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100 hover:bg-red-50 cursor-pointer transition-colors" onClick={() => handleFinancialDrillDown('CASH_OUT', selectedReport)}>
                                                <td className="py-2 text-gray-600">Total Cash Out</td>
                                                <td className="py-2 text-right font-medium text-red-500">- LKR {selectedReportMetrics.cashOut.toLocaleString()}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100 hover:bg-red-50 cursor-pointer transition-colors" onClick={() => handleFinancialDrillDown('REFUND', selectedReport)}>
                                                <td className="py-2 text-gray-600">Refunds Processed</td>
                                                <td className="py-2 text-right font-medium text-red-500">- LKR {selectedReportMetrics.refunds.toLocaleString()}</td>
                                            </tr>
                                            <tr className="p-expected-row bg-gray-50 p-2 mt-2 font-bold text-gray-900">
                                                <td className="py-2 px-2 rounded-l-lg border-t border-b border-l border-gray-200 uppercase tracking-wide text-xs">System Expected Balance</td>
                                                <td className="py-2 px-2 text-right text-lg rounded-r-lg border-t border-b border-r border-gray-200">LKR {(selectedReport.expectedCash || 0).toLocaleString()}</td>
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

                {/* FINANCIAL DRILL-DOWN MODAL */}
                {drillDownCategory && (
                    <div className="report-modal-overlay">
                        <div className="report-modal-container animate-scale" style={{ maxWidth: '600px' }}>
                            <div className="report-modal-header bg-slate-900 text-white">
                                <h3>
                                    {drillDownCategory === 'SALE' ? 'Cash Sales Details' : 
                                     drillDownCategory === 'CASH_IN' ? 'Cash In Details' : 
                                     drillDownCategory === 'CASH_OUT' ? 'Cash Out Details' : 
                                     drillDownCategory === 'REFUND' ? 'Refund Details' : 'Transaction Details'}
                                </h3>
                                <button onClick={() => setDrillDownCategory(null)} className="close-modal-btn p-1 hover:bg-white/10 rounded">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="report-print-paper custom-scrollbar" style={{ background: 'white', padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b-2 border-slate-900">
                                            <th className="py-3 px-2 text-left text-xs font-bold text-slate-600">Time</th>
                                            <th className="py-3 px-2 text-left text-xs font-bold text-slate-600">Description</th>
                                            <th className="py-3 px-2 text-right text-xs font-bold text-slate-600">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {drillDownTransactions.length > 0 ? (
                                            drillDownTransactions.map((log, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="py-2 px-2 text-xs text-slate-600">
                                                        {new Date(log.timestamp).toLocaleTimeString()}
                                                    </td>
                                                    <td className="py-2 px-2 text-sm text-slate-700">
                                                        {log.desc || log.reason || 'N/A'}
                                                    </td>
                                                    <td className="py-2 px-2 text-right text-sm font-medium text-slate-900">
                                                        LKR {(log.amount || 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="py-8 text-center text-slate-400 text-sm">
                                                    No transactions recorded in this category
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>

                                {drillDownTransactions.length > 0 && (
                                    <div className="mt-6 pt-4 border-t-2 border-slate-900 flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-600">Total:</span>
                                        <span className="text-lg font-black text-slate-900">
                                            LKR {drillDownTransactions.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ORDER REPORT MODAL (OFFICIAL / DETAILED) */}
                {selectedOrderReport && (
                    <div className="report-modal-overlay">
                        <div className="report-modal-container animate-scale" style={{ maxWidth: '900px', height: '90vh' }}>
                            <div className="report-modal-header bg-slate-900 text-white">
                                <h3>Official Order Execution Report</h3>
                                <div className="modal-actions">
                                    <button onClick={() => window.print()} className="print-trigger-btn flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-all font-bold">
                                        <Printer size={18} /> Print Distribution Copy
                                    </button>
                                    <button onClick={() => setSelectedOrderReport(null)} className="close-modal-btn p-1 hover:bg-white/10 rounded ml-2">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="report-print-paper custom-scrollbar" id="order-printable-report" style={{ background: 'white', padding: '40px' }}>
                                <div className="p-report-header flex justify-between items-start mb-8">
                                    <div className="p-brand flex items-center gap-4">
                                        <div className="p-logo bg-slate-900 text-white w-12 h-12 flex items-center justify-center rounded-xl font-black text-2xl shadow-lg">CK</div>
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight">Coupang Kmart</h2>
                                            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Transaction & Fulfillment Audit</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-400">SESSION ID</div>
                                        <div className="text-lg font-black text-slate-800">{selectedOrderReport.id}</div>
                                    </div>
                                </div>

                                <div className="info-bar bg-slate-50 border border-slate-100 rounded-2xl p-6 grid grid-cols-3 gap-8 mb-10">
                                    <div>
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 block">Assigned Cashier</label>
                                        <div className="font-bold text-slate-800">{selectedOrderReport.cashier}</div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 block">Reporting Period</label>
                                        <div className="font-bold text-slate-800">
                                            {new Date(selectedOrderReport.startTime).toLocaleTimeString()} - {new Date(selectedOrderReport.endTime).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 block">Total Volume</label>
                                        <div className="font-bold text-slate-800">{selectedOrderItems.length} Transactions</div>
                                    </div>
                                </div>

                                <div className="orders-table-wrapper">
                                    <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                        <ShieldCheck size={20} className="text-blue-600" /> itemized Order Audit
                                    </h4>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b-2 border-slate-900">
                                                <th className="py-4 text-xs font-black uppercase tracking-wider text-slate-500">ID / Type</th>
                                                <th className="py-4 text-xs font-black uppercase tracking-wider text-slate-500">Fulfillment Status</th>
                                                <th className="py-4 text-xs font-black uppercase tracking-wider text-slate-500">Staff Interaction</th>
                                                <th className="py-2 text-xs font-black uppercase tracking-wider text-slate-500 text-right">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedOrderItems.map((order, idx) => {
                                                const orderId = getOrderId(order);
                                                const orderAmount = getOrderAmount(order);
                                                const sessionActions = getSessionActions(order, selectedOrderReport.cashier);
                                                return (
                                                    <tr key={`${orderId}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-4">
                                                            <div className="font-bold text-slate-900">{orderId}</div>
                                                            <div className="text-[10px] font-black text-blue-600 uppercase">
                                                                {isOnlineOrder(order) ? 'Online Web Order' : 'POS Retail Sale'}
                                                            </div>
                                                        </td>
                                                        <td className="py-4">
                                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${order.status === 'DELIVERED' || order.status === 'CASH RECEIVED' || order.status === 'COMPLETED'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                {order.status || 'PENDING'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4">
                                                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Audit Trail Record:</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {sessionActions.map(action => (
                                                                    <span
                                                                        key={action}
                                                                        className={`text-[9px] px-1 rounded font-bold ${action === 'Cash Received' ? 'bg-blue-100 text-blue-700 underline' : action === 'POS Issued' ? 'bg-indigo-100 text-indigo-700 italic' : 'bg-slate-100'}`}
                                                                    >
                                                                        {action}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <div className="font-black text-slate-900">LKR {orderAmount.toLocaleString()}</div>
                                                            <div className="text-[9px] text-slate-400 font-bold">{getOrderPayment(order)}</div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {selectedOrderItems.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="py-20 text-center text-slate-300 font-bold italic">No order activity recorded for this session.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-12 pt-8 border-t-2 border-slate-900 flex justify-between">
                                    <div className="w-1/2">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-12">Authorized Validation Signature</div>
                                        <div className="w-48 h-px bg-slate-300"></div>
                                        <div className="text-xs font-bold text-slate-900 mt-2">{selectedOrderReport.cashier}</div>
                                        <div className="text-[10px] text-slate-400">Accountability Signature</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-slate-400 uppercase mb-1">Net Session Revenue</div>
                                        <div className="text-4xl font-black text-slate-900">
                                            LKR {selectedOrderItems.reduce((sum, o) => sum + getOrderAmount(o), 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
