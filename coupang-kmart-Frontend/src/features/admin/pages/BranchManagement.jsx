import React, { useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import { Store, Plus, Search, MapPin, Settings as SettingsIcon, MoreVertical } from 'lucide-react';

const DUMMY_BRANCHES = [
    { id: 1, name: 'Colombo Central', location: 'Colombo 01', type: 'Main', manager: 'Admin User', status: 'Active' },
    { id: 2, name: 'Kandy Express', location: 'Kandy City Center', type: 'Outlet', manager: 'Unassigned', status: 'Active' },
    { id: 3, name: 'Galle Coastal', location: 'Galle Fort', type: 'Retail', manager: 'Unassigned', status: 'Active' },
    { id: 4, name: 'Jaffna North', location: 'Jaffna Town', type: 'Proposed', manager: 'N/A', status: 'Inactive' },
];

export default function BranchManagement() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBranches = DUMMY_BRANCHES.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="page-header">
                <div className="header-info">
                    <h1>Branch Configuration</h1>
                    <p>Add and manage Coupang Kmart retail locations.</p>
                </div>
                <Button variant="primary" icon={Plus}>Register New Branch</Button>
            </div>

            <div className="management-actions">
                <div className="search-box-premium">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search branches..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="branch-grid-premium">
                {filteredBranches.map(branch => (
                    <Card key={branch.id} padding="md" glass className="branch-card">
                        <div className="branch-card-header">
                            <div className={`status-pill-line ${branch.status.toLowerCase()}`}></div>
                            <div className="branch-type-chip">{branch.type}</div>
                            <button className="icon-btn"><MoreVertical size={16} /></button>
                        </div>

                        <div className="branch-main-info">
                            <div className="store-icon-wrap">
                                <Store size={24} />
                            </div>
                            <div className="title-section">
                                <h3>{branch.name}</h3>
                                <div className="loc">
                                    <MapPin size={12} />
                                    <span>{branch.location}</span>
                                </div>
                            </div>
                        </div>

                        <div className="branch-footer">
                            <div className="mgr-info">
                                <label>Manager</label>
                                <span>{branch.manager}</span>
                            </div>
                            <Button size="sm" variant="secondary" icon={SettingsIcon}>Configure</Button>
                        </div>
                    </Card>
                ))}
            </div>
        </AdminLayout>
    );
}
