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
                <Card glass className="summary-stat-card">
                    <div className="stat-label">Total Transfers (MTD)</div>
                    <div className="stat-value">124</div>
                </Card>
                <Card glass className="summary-stat-card">
                    <div className="stat-label">Active / In-Transit</div>
                    <div className="stat-value color-blue">12</div>
                </Card>
                <Card glass className="summary-stat-card">
                    <div className="stat-label">Pending Approval</div>
                    <div className="stat-value warning">3</div>
                </Card>
            </div>

            <Card title="Recent History" padding="none" glass>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Transfer ID</th>
                                <th>Route</th>
                                <th>Items Count</th>
                                <th>Status</th>
                                <th>Request Date</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DUMMY_TRANSFERS.map(t => (
                                <tr key={t.id}>
                                    <td className="fw-600">{t.id}</td>
                                    <td>
                                        <div className="route-cell">
                                            <span>{t.from}</span>
                                            <ArrowLeftRight size={14} className="color-muted" />
                                            <span>{t.to}</span>
                                        </div>
                                    </td>
                                    <td>{t.items} Items</td>
                                    <td>
                                        <span className={`status-pill-small ${t.status.toLowerCase().replace(' ', '-')}`}>
                                            {t.status === 'Completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="color-muted">{t.date}</td>
                                    <td className="text-right">
                                        <Button size="sm" variant="secondary">Details</Button>
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
