import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import Card from '../../../components/shared/Card';
import { ShieldCheck, Lock, Eye, Edit3, Loader2, ChevronRight } from 'lucide-react';
import { apiService } from '../../../services/dummyApi';

export default function RolesPermissions() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoles = async () => {
            const data = await apiService.getRoles();
            setRoles(data);
            setLoading(false);
        };
        fetchRoles();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="kpi-loading">
                    <Loader2 className="animate-spin" size={40} />
                    <p>Securing access protocols...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header">
                <div className="header-info">
                    <h1>Roles & Permissions</h1>
                    <p>Define global access levels and security policies for your administration team.</p>
                </div>
            </div>

            <div className="roles-grid-v2">
                {roles.map((r) => (
                    <Card key={r.id} className="role-security-card-v2" padding="none">
                        <div className="role-card-header-v2">
                            <div className="role-icon-v2">
                                <ShieldCheck size={24} />
                            </div>
                            <div className="role-meta-v2">
                                <h4>{r.title}</h4>
                                <span className="level-indicator">{r.level}</span>
                            </div>
                        </div>
                        <div className="role-card-body-v2">
                            <p className="role-desc-v2">{r.desc}</p>
                            <div className="permission-matrix-v2">
                                {r.permissions.map(p => (
                                    <div key={p} className="p-pill-v2">
                                        {p === 'View' && <Eye size={14} />}
                                        {p === 'Edit' && <Edit3 size={14} />}
                                        {p === 'Safe' && <Lock size={14} />}
                                        {p === 'Global' && <ShieldCheck size={14} />}
                                        <span>{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="role-card-footer-v2">
                            <button className="text-btn-premium">
                                Manage Permissions <ChevronRight size={14} />
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
        </AdminLayout>
    );
}
