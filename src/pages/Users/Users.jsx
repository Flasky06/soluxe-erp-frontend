import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'RECEPTIONIST',
        active: true
    });

    const roles = [
        'HOTEL_ADMIN', 'MANAGER', 'ACCOUNTANT', 'RECEPTIONIST', 
        'CASHIER', 'WAITER', 'CHEF', 'STORE_KEEPER', 
        'HOUSEKEEPING', 'MAINTENANCE'
    ];

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                fullName: user.fullName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                password: '', // Don't show password hash
                role: user.role,
                active: user.active
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                fullName: '',
                email: '',
                phoneNumber: '',
                password: '',
                role: 'RECEPTIONIST',
                active: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, formData);
            } else {
                await api.post('/users', formData);
            }
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            console.error('Failed to save user:', err);
            alert('Failed to save user details.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
            } catch (err) {
                console.error('Failed to delete user:', err);
                alert('Failed to delete user.');
            }
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'HOTEL_ADMIN': return 'bg-purple-100 text-purple-700';
            case 'MANAGER': return 'bg-blue-100 text-blue-700';
            case 'RECEPTIONIST': return 'bg-green-100 text-green-700';
            case 'ACCOUNTANT': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">User Management</h1>
                    <p className="text-text-slate text-base">Manage application access, security credentials, and system roles.</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add New User</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium italic">Synchronizing security records...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>User Profile</th>
                                <th>System Role</th>
                                <th>Contact Details</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-text-dark text-base">{u.username}</span>
                                            <span className="text-[12px] text-text-slate font-medium">{u.fullName}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${getRoleBadgeColor(u.role)}`}>
                                            {u.role.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-0.5 text-sm">
                                            <span className="text-slate-700 font-medium">{u.email}</span>
                                            <span className="text-slate-500">{u.phoneNumber}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {u.active ? 'Authenticated' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(u)}>Configure</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-bold transition-all duration-300 ml-2" onClick={() => handleDelete(u.id)}>Retract Access</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[80%] !max-w-[800px]">
                        <div className="modal-header">
                            <div>
                                <h2 className="text-xl font-bold text-primary">{editingUser ? 'Update User Security Profile' : 'Register New System User'}</h2>
                                <p className="text-sm text-text-slate mt-0.5">Define access permissions and authentication credentials.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Username (Login ID)</label>
                                    <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="e.g. admin_soluxe" disabled={editingUser} />
                                </div>
                                <div className="form-group">
                                    <label>System Role</label>
                                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                        {roles.map(r => (
                                            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Jane Doe" />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="jane@soluxehotel.com" />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} placeholder="+254..." />
                                </div>
                                <div className="form-group">
                                    <label>{editingUser ? 'New Password (Optional)' : 'Initial Password'}</label>
                                    <input type="password" required={!editingUser} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                                </div>
                                <div className="flex items-center gap-2.5 mt-6 col-span-2">
                                    <input type="checkbox" id="active" checked={formData.active} onChange={(e) => setFormData({...formData, active: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20" />
                                    <label htmlFor="active" className="mb-0 text-sm font-semibold text-slate-700 uppercase tracking-wide">Account Active & Enabled</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">{editingUser ? 'Update Profile' : 'Provision User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
