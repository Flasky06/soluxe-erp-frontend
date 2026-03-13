import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Calendar } from 'lucide-react';

const LeaveTypes = () => {
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLeaveTypes = async () => {
        try {
            const response = await api.get('/leave-types');
            setLeaveTypes(response.data);
        } catch (err) {
            console.error('Failed to fetch leave types:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const handleOpenModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name,
                description: type.description || ''
            });
        } else {
            setEditingType(null);
            setFormData({ name: '', description: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await api.put(`/leave-types/${editingType.id}`, formData);
            } else {
                await api.post('/leave-types', formData);
            }
            setShowModal(false);
            fetchLeaveTypes();
        } catch (err) {
            console.error('Failed to save leave type:', err);
            alert('Failed to save leave type.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this leave type?')) {
            try {
                await api.delete(`/leave-types/${id}`);
                fetchLeaveTypes();
            } catch (err) {
                console.error('Failed to delete leave type:', err);
                alert('Failed to delete leave type. It might be assigned to some requests.');
            }
        }
    };

    const filteredTypes = leaveTypes.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search leave types..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Leave Type</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium">Syncing HR records...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Policy Name</th>
                                <th style={{ width: '55%' }}>Policy Description</th>
                                <th style={{ width: '15%' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTypes.length > 0 ? filteredTypes.map((t) => (
                                <tr key={t.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-800">{t.name}</span>
                                        </div>
                                    </td>
                                    <td><span className="text-slate-500 text-sm leading-relaxed">{t.description || 'No description provided.'}</span></td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(t)}>Edit</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all" onClick={() => handleDelete(t.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="text-center py-20 text-slate-400 italic font-medium">
                                        {searchTerm ? 'No leave policies match your search.' : 'No leave types registered.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[85%] !max-w-[500px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">{editingType ? 'Edit Leave Type' : 'Create HR Policy'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-6 p-7">
                                <div className="form-group">
                                    <label>Policy Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. Annual Leave, Sick Leave"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description & Scope</label>
                                    <textarea 
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                        placeholder="Define the scope and eligibility for this leave type"
                                        rows="4"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">Save Policy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveTypes;
