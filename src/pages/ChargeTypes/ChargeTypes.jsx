import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus } from 'lucide-react';

const ChargeTypes = () => {
    const [chargeTypes, setChargeTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        active: true
    });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchChargeTypes = async () => {
        try {
            const response = await api.get('/charge-types');
            setChargeTypes(response.data);
        } catch (err) {
            console.error('Failed to fetch charge types:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChargeTypes();
    }, []);

    const handleOpenModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name,
                description: type.description || '',
                active: type.active ?? true
            });
        } else {
            setEditingType(null);
            setFormData({ 
                name: '', 
                description: '', 
                active: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await api.put(`/charge-types/${editingType.id}`, formData);
            } else {
                await api.post('/charge-types', formData);
            }
            setShowModal(false);
            fetchChargeTypes();
        } catch (err) {
            console.error('Failed to save charge type:', err);
            alert('Failed to save charge type.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this charge type?')) {
            try {
                await api.delete(`/charge-types/${id}`);
                fetchChargeTypes();
            } catch (err) {
                console.error('Failed to delete charge type:', err);
                alert('Failed to delete charge type.');
            }
        }
    };

    const filteredTypes = chargeTypes.filter(type => 
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search charge types by name..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Charge Type</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium">Loading charge types...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Name</th>
                                <th style={{ width: '45%' }}>Description</th>
                                <th style={{ width: '10%' }}>Status</th>
                                <th style={{ width: '15%' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTypes.length > 0 ? filteredTypes.map((type) => (
                                <tr key={type.id}>
                                    <td><span className="font-bold text-slate-800">{type.name}</span></td>
                                    <td><span className="text-slate-600 italic">{type.description || '-'}</span></td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${type.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {type.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(type)}>Edit</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all" onClick={() => handleDelete(type.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-20 text-slate-400 italic">
                                        {searchTerm ? 'No types match your search.' : 'No charge types defined yet.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[85%] !max-w-[600px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">{editingType ? 'Edit Charge Type' : 'Add New Charge Type'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Type Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. Laundry, Spa, Extra Bed"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea 
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                        placeholder="Enter details..."
                                        className="min-h-[100px]"
                                    />
                                </div>
                                <div className="form-group flex items-center gap-2 mt-4">
                                    <input 
                                        type="checkbox" 
                                        id="activeStatus"
                                        checked={formData.active} 
                                        onChange={(e) => setFormData({...formData, active: e.target.checked})} 
                                    />
                                    <label htmlFor="activeStatus" className="m-0 cursor-pointer text-sm font-semibold text-slate-700">Set as Active</label>
                                </div>
                            </div>
                            <div className="modal-footer mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">Save Charge Type</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChargeTypes;
