import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import Card from '../../../components/shared/Card';
import { BarChart2, Download, Calendar, Loader2, FileText, TrendingUp } from 'lucide-react';
import Button from '../../../components/shared/Button';
import { apiService } from '../../../services/dummyApi';

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            const data = await apiService.getReports();
            setReports(data);
            setLoading(false);
        };
        fetchReports();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="kpi-loading">
                    <Loader2 className="animate-spin" size={40} />
                    <p>Generating business metrics...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header">
                <div className="header-info">
                    <h1>Business Intelligence</h1>
                    <p>Advanced metrics and historical reports for strategic planning.</p>
                </div>
                <div className="header-actions">
                    <Button variant="secondary" icon={Calendar}>Quarterly</Button>
                    <Button variant="primary" icon={Download}>Export Collective</Button>
                </div>
            </div>

            <div className="dashboard-grid-premium">
                <div className="grid-main">
                    <Card title="Sales Velocity" subtitle="Real-time transaction momentum" className="analytics-card-v2">
                        <div className="viz-placeholder-premium">
                            <TrendingUp size={48} className="opacity-10" />
                            <span>Interactive Chart Layer</span>
                        </div>
                    </Card>

                    <Card title="Management Data Pool" subtitle="Archive of generated organization reports">
                        <div className="report-archive-v2">
                            {reports.map((rep) => (
                                <div key={rep.id} className="archive-item-v2">
                                    <div className="archive-info-v2">
                                        <div className="file-icon-v2"><FileText size={18} /></div>
                                        <div className="file-meta-v2">
                                            <span className="file-name-v2">{rep.name}</span>
                                            <span className="file-date-v2">Generated: {rep.date}</span>
                                        </div>
                                    </div>
                                    <span className={`file-status-v2 ${rep.status.toLowerCase()}`}>
                                        {rep.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="grid-side">
                    <Card title="Quick Filters">
                        <div className="filter-stack-v2">
                            <div className="filter-item-v2">
                                <label>Target Branch</label>
                                <select className="select-field-premium"><option>Consolidated</option></select>
                            </div>
                            <div className="filter-item-v2">
                                <label>Report Class</label>
                                <select className="select-field-premium"><option>All Classes</option></select>
                            </div>
                            <Button variant="secondary" className="w-100">Apply Intelligence</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
