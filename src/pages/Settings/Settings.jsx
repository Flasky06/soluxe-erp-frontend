import React, { useState, useEffect } from 'react';
import api from '../../services/api';
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


    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">System Settings</h1>
                    <p className="text-text-slate text-base">Configure property identity, users, and global policies.</p>
                </div>
            </div>

            <div className="flex gap-2 mb-8 border-b border-slate-200">
                <button 
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'users' ? 'text-primary border-primary bg-primary/5' : 'text-text-slate border-transparent hover:text-primary'}`} 
                    onClick={() => setActiveTab('users')}
                >
                    User Management
                </button>
                <button 
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'profile' ? 'text-primary border-primary bg-primary/5' : 'text-text-slate border-transparent hover:text-primary'}`} 
                    onClick={() => setActiveTab('profile')}
                >
                    Hotel Profile
                </button>
            </div>

            {activeTab === 'users' ? (
                <>
                    <div className="flex justify-end mb-6">
                        <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add New User</button>
                    </div>
                    <div className="premium-card overflow-hidden">
                        {loading ? (
                            <div className="text-center py-20 text-text-slate animate-pulse text-lg">Loading user accounts...</div>
                        ) : (
                            <table className="management-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Contact Information</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-primary text-white rounded-lg flex items-center justify-center text-xs font-bold uppercase">
                                                        {user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700">{user.username}</span>
                                                        <span className="text-[12px] text-slate-500">{user.fullName}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] text-slate-700">{user.email || 'No Email'}</span>
                                                    <span className="text-[11px] text-slate-400 font-medium">{user.phoneNumber || 'No Phone'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                                    user.role === 'HOTEL_ADMIN' ? 'bg-red-50 text-red-600' :
                                                    user.role === 'MANAGER' ? 'bg-amber-50 text-amber-600' :
                                                    user.role === 'RECEPTIONIST' ? 'bg-green-50 text-green-600' :
                                                    user.role === 'ACCOUNTANT' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {user.isActive ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex justify-end">
                                                    <button className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded text-[11px] font-bold transition-all" onClick={() => handleOpenModal(user)}>Edit Profile</button>
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
                <div className="premium-card p-8 !max-w-[800px] mx-auto">
                    <form onSubmit={handleSaveHotelInfo} className="flex flex-col gap-8">
                        <div className="flex items-center gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="text-4xl w-20 h-20 bg-white shadow-sm border border-slate-200 flex items-center justify-center rounded-xl">{hotelInfo.logo}</div>
                            <button type="button" className="btn-secondary text-sm">Upload New Logo</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="form-group md:col-span-2">
                                <label>Address</label>
                                <textarea rows="3" value={hotelInfo.address} onChange={(e) => setHotelInfo({...hotelInfo, address: e.target.value})} className="min-h-[100px]"></textarea>
                            </div>
                            <div className="form-group">
                                <label>Default Tax Rate (%)</label>
                                <input type="number" step="0.1" value={hotelInfo.taxRate} onChange={(e) => setHotelInfo({...hotelInfo, taxRate: parseFloat(e.target.value) || 0})} />
                            </div>
                        </div>
                        <div className="flex justify-end pt-6 border-t border-slate-200">
                            <button type="submit" className="btn-primary !px-10">Update Property Profile</button>
                        </div>
                    </form>
                </div>
            )}

            {/* User Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[85%] !max-w-[800px]">
                        <div className="modal-header">
                            <div>
                                <h2 className="text-xl font-bold text-primary">{editingUser ? 'Edit User Profile' : 'Create New User Account'}</h2>
                                <p className="text-sm text-text-slate mt-0.5">Define system access roles and credentials.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-7">
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
                                    <label>{editingUser ? 'New Password (Optional)' : 'Account Password'}</label>
                                    <input 
                                        type="password" 
                                        required={!editingUser}
                                        value={formData.password} 
                                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                        <input 
                                            type="checkbox" 
                                            id="isActive"
                                            checked={formData.isActive} 
                                            onChange={(e) => setFormData({...formData, isActive: e.target.checked})} 
                                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor="isActive" className="mb-0 font-medium text-slate-700">Account is Active (Allow login and system access)</label>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">{editingUser ? 'Save Updates' : 'Create Account'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
