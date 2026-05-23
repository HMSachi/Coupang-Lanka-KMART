import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import Card from '../../../components/shared/Card';
import { Globe, Shield, Printer, Database, Loader2, ChevronRight, Settings as SettingsIcon } from 'lucide-react';
import { apiService } from '../../../services/dummyApi';

const ICON_MAP = { Globe, Shield, Printer, Database };

export default function Settings() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const data = await apiService.getSettings();
            setSettings(data);
            setLoading(false);
        };
        fetchSettings();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="kpi-loading">
                    <Loader2 className="animate-spin" size={40} />
                    <p>Loading configurations...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header">
                <div className="header-info">
                    <h1>System Config</h1>
                    <p>Manage global system parameters, security protocols, and hardware nodes.</p>
                </div>
            </div>

            <div className="settings-panel-v2">
                {settings.map((s) => {
                    const Icon = ICON_MAP[s.icon] || SettingsIcon;
                    return (
                        <Card key={s.id} className="settings-tile-v2" padding="none">
                            <div className="settings-tile-content-v2">
                                <div className="settings-tile-icon-v2">
                                    <Icon size={24} />
                                </div>
                                <div className="settings-tile-info-v2">
                                    <h4>{s.title}</h4>
                                    <p>{s.desc}</p>
                                </div>
                                <ChevronRight className="tile-arrow-v2" size={18} />
                            </div>
                        </Card>
                    );
                })}
            </div>
        </AdminLayout>
    );
}
