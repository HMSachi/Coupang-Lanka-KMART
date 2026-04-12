import React, { useState } from 'react';
import AdminLayout from '../../../layouts/AdminLayout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import { Users, UserPlus, Search, Edit2, Trash2, Shield, Mail } from 'lucide-react';
import { DUMMY_USERS } from '../../../services/dummyData';

export default function UserManagement() {
    const [searchTerm, setSearchTerm] = useState('');

    // Convert dummy users object to array for table display
    const usersList = Object.keys(DUMMY_USERS).map(email => ({
        email,
        ...DUMMY_USERS[email]
    }));

    const filteredUsers = usersList.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="page-header">
                <div className="header-info">
                    <h1>User Management</h1>
                    <p>Create and manage system access for Admins and Cashiers.</p>
                </div>
                <Button variant="primary" icon={UserPlus}>Add New User</Button>
            </div>

            <div className="management-actions">
                <div className="search-box-premium">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card padding="none" glass>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User Name</th>
                                <th>Email Address</th>
                                <th>Role</th>
                                <th>Assigned Branch</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u) => (
                                <tr key={u.email}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar-sm">{u.name[0]}</div>
                                            <span className="fw-600">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="color-muted">{u.email}</td>
                                    <td>
                                        <span className={`role-badge ${u.role}`}>
                                            <Shield size={12} />
                                            {u.role === 'superAdmin' ? 'Super Admin' : u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="branch-tag">{u.branch}</span>
                                    </td>
                                    <td className="text-right">
                                        <div className="action-btns">
                                            <button className="icon-btn edit"><Edit2 size={16} /></button>
                                            <button className="icon-btn delete"><Trash2 size={16} /></button>
                                        </div>
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
