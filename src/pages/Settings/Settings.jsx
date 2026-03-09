import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Settings.css';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'RECEPTIONIST',
        password: '',
        isActive: true
    });

    const [hotelInfo, setHotelInfo] = useState({
        name: 'Soluxe Hotel & Spa',
        address: '123 Luxury Ave, Nairobi, Kenya',
        email: 'info@soluxe.com',
        phone: '+254 700 000 000',
        currency: 'KES',
        taxRate: 16,
        logo: '🏨'
    });

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                fullName: user.fullName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                role: user.role,
                password: '', // Don't populate password
                isActive: user.isActive
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                fullName: '',
                email: '',
                phoneNumber: '',
                role: 'RECEPTIONIST',
                password: '',
                isActive: true
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

    const handleSaveHotelInfo = (e) => {
        e.preventDefault();
        alert('Hotel profile updated successfully!');
        // In a real app, this would call an API
    };

    const getRoleBadgeClass = (role) => {
        return role ? role.toLowerCase().replace('_', '-') : 'staff';
    };

    return (
        <div className="settings-page">
            <div className="page-header">
                <div>
                    <h1>System Settings</h1>
                    <p>Configure property identity, users, and global policies.</p>
                </div>
            </div>

            <div className="settings-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('users')}
                >
                    User Management
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('profile')}
                >
                    Hotel Profile
                </button>
            </div>

            {activeTab === 'users' ? (
                <>
                    <div className="section-actions">
                        <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add New User</button>
                    </div>
                    <div className="premium-card table-container">
                        {loading ? (
                            <div className="loading">Loading user accounts...</div>
                        ) : (
                            <table className="management-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Contact Information</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-avatar-mini">
                                                        {user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="user-details">
                                                        <span className="bold">{user.username}</span>
                                                        <span className="sub-text">{user.fullName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="contact-cell">
                                                    <span>{user.email || 'No Email'}</span>
                                                    <span className="sub-text">{user.phoneNumber || 'No Phone'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${user.isActive ? 'active' : 'inactive'}`}>
                                                    {user.isActive ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="view-btn" onClick={() => handleOpenModal(user)}>Edit Profile</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            ) : (
                <div className="premium-card profile-section">
                    <form onSubmit={handleSaveHotelInfo} className="hotel-form">
                        <div className="form-grid">
                            <div className="form-group full-width branding-group">
                                <div className="logo-preview">{hotelInfo.logo}</div>
                                <button type="button" className="btn-secondary">Upload New Logo</button>
                            </div>
                            <div className="form-group">
                                <label>Hotel Name</label>
                                <input type="text" value={hotelInfo.name} onChange={(e) => setHotelInfo({...hotelInfo, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Business Email</label>
                                <input type="email" value={hotelInfo.email} onChange={(e) => setHotelInfo({...hotelInfo, email: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Contact Phone</label>
                                <input type="text" value={hotelInfo.phone} onChange={(e) => setHotelInfo({...hotelInfo, phone: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Default Currency</label>
                                <select value={hotelInfo.currency} onChange={(e) => setHotelInfo({...hotelInfo, currency: e.target.value})}>
                                    <option value="KES">Kenyan Shilling (KES)</option>
                                    <option value="USD">US Dollar (USD)</option>
                                    <option value="EUR">Euro (EUR)</option>
                                </select>
                            </div>
                            <div className="form-group full-width">
                                <label>Address</label>
                                <textarea rows="3" value={hotelInfo.address} onChange={(e) => setHotelInfo({...hotelInfo, address: e.target.value})}></textarea>
                            </div>
                            <div className="form-group">
                                <label>Default Tax Rate (%)</label>
                                <input type="number" value={hotelInfo.taxRate} onChange={(e) => setHotelInfo({...hotelInfo, taxRate: e.target.value})} />
                            </div>
                        </div>
                        <div className="form-footer">
                            <button type="submit" className="btn-primary">Update Property Profile</button>
                        </div>
                    </form>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card modal-lg">
                        <div className="modal-header">
                            <h2>{editingUser ? 'Edit User Profile' : 'Create New User Account'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Username</label>
                                    <input 
                                        type="text" 
                                        required 
                                        disabled={!!editingUser}
                                        value={formData.username} 
                                        onChange={(e) => setFormData({...formData, username: e.target.value})} 
                                        placeholder="Identification name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.fullName} 
                                        onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input 
                                        type="email" 
                                        required 
                                        value={formData.email} 
                                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                        placeholder="user@soluxe.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input 
                                        type="text" 
                                        value={formData.phoneNumber} 
                                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} 
                                        placeholder="+254..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Security Role</label>
                                    <select 
                                        value={formData.role} 
                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                    >
                                        <option value="HOTEL_ADMIN">Hotel Admin</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="RECEPTIONIST">Receptionist</option>
                                        <option value="ACCOUNTANT">Accountant</option>
                                        <option value="HOUSEKEEPING">Housekeeping</option>
                                        <option value="MAINTENANCE">Maintenance</option>
                                        <option value="CHEF">Chef</option>
                                        <option value="STORE_KEEPER">Store Keeper</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{editingUser ? 'New Password (leave blank to keep current)' : 'Account Password'}</label>
                                    <input 
                                        type="password" 
                                        required={!editingUser}
                                        value={formData.password} 
                                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <div className="checkbox-group">
                                        <input 
                                            type="checkbox" 
                                            id="isActive"
                                            checked={formData.isActive} 
                                            onChange={(e) => setFormData({...formData, isActive: e.target.checked})} 
                                        />
                                        <label htmlFor="isActive">Account is Active (Allow login and system access)</label>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{editingUser ? 'Save Updates' : 'Create Account'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
