import React, { useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import { ArrowLeftRight, Search, Plus, Store, CheckCircle2, Clock } from 'lucide-react';

const DUMMY_TRANSFERS = [
    { id: 'ST-8821', from: 'Kandy Express', to: 'Colombo Central', items: 12, status: 'Completed', date: '2026-04-10' },
    { id: 'ST-8825', from: 'Colombo Central', to: 'Galle Coastal', items: 45, status: 'In Transit', date: '2026-04-12' },
    { id: 'ST-8829', from: 'Colombo Central', to: 'Kandy Express', items: 8, status: 'Pending', date: '2026-04-12' },
];

export default function StockTransfer() {
    return (
        <AdminLayout>
            <div className="page-header">
                <div className="header-info">
                    <h1>Stock Transfers</h1>
                    <p>Move inventory between branches and track transport status.</p>
                </div>
                <Button variant="primary" icon={Plus}>Create New Transfer</Button>
            </div>

            <div className="transfer-summary-grid">
                <div className="kpi-card">
                    <div className="kpi-icon blue">
                        <ArrowLeftRight size={24} />
                    </div>
                    <div className="kpi-details">
                        <h3>Total Transfers (MTD)</h3>
                        <div className="kpi-val">124</div>
                        <div className="kpi-trend success">Monthly Throughput</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon primary">
                        <Clock size={24} />
                    </div>
                    <div className="kpi-details">
                        <h3>Active / In-Transit</h3>
                        <div className="kpi-val color-blue">12</div>
                        <div className="kpi-trend success">Active Logistics</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon red">
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="kpi-details">
                        <h3>Pending Approval</h3>
                        <div className="kpi-val warning">3</div>
                        <div className="kpi-trend danger">Action Required</div>
                    </div>
                </div>
            </div>

            <Card glass padding="none">
                <div className="table-responsive">
                    <table className="admin-table-v2">
                        <thead>
                            <tr>
                                <th>Logistics ID</th>
                                <th>Route Visualization</th>
                                <th>Cargo Load</th>
                                <th>Track Status</th>
                                <th>Timeline</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DUMMY_TRANSFERS.map(t => (
                                <tr key={t.id} className="row-hover-premium">
                                    <td className="fw-800 color-main">{t.id}</td>
                                    <td>
                                        <div className="route-badge-v2">
                                            <span className="node-text">{t.from}</span>
                                            <div className="node-sep">
                                                <ArrowLeftRight size={14} />
                                            </div>
                                            <span className="node-text">{t.to}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="items-count-pill">
                                            <span>{t.items} Units</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`transfer-status-chip ${t.status.toLowerCase().replace(' ', '-')}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="color-muted fw-600">{t.date}</td>
                                    <td className="text-right">
                                        <button className="action-btn-link">
                                            Track Hub <Plus size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </AdminLayout>
    );
}
