import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import Card from '../../../components/shared/Card';
import { Bell, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { apiService } from '../../../services/dummyApi';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const data = await apiService.getNotifications();
            setNotifications(data);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="kpi-loading">
                    <Loader2 className="animate-spin" size={40} />
                    <p>Syncing secure notifications...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header">
                <div className="header-info">
                    <h1>System Notifications</h1>
                    <p>Real-time alerts and updates from your organization.</p>
                </div>
            </div>

            <div className="notifications-list-premium">
                {notifications.map(a => (
                    <Card key={a.id} className="notification-card-premium">
                        <div className={`notif-icon-wrap ${a.type}`}>
                            {a.type === 'warning' && <AlertCircle size={20} />}
                            {a.type === 'success' && <CheckCircle size={20} />}
                            {a.type === 'info' && <Info size={20} />}
                        </div>
                        <div className="notif-content">
                            <h4>{a.title}</h4>
                            <p>{a.msg}</p>
                            <span className="notif-time">{a.time}</span>
                        </div>
                    </Card>
                ))}
            </div>
        </AdminLayout>
    );
}
