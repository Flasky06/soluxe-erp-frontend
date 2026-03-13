import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Box } from 'lucide-react';

const InventoryUnits = () => {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUnits = async () => {
        try {
            const response = await api.get('/inventory-units');
            setUnits(response.data);
        } catch (err) {
            console.error('Failed to fetch inventory units:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const handleOpenModal = (unit = null) => {
        if (unit) {
            setEditingUnit(unit);
            setFormData({
                name: unit.name,
                description: unit.description || ''
            });
        } else {
            setEditingUnit(null);
            setFormData({ name: '', description: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUnit) {
                await api.put(`/inventory-units/${editingUnit.id}`, formData);
            } else {
                await api.post('/inventory-units', formData);
            }
            setShowModal(false);
            fetchUnits();
        } catch (err) {
            console.error('Failed to save inventory unit:', err);
            alert('Failed to save stock unit.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this unit?')) {
            try {
                await api.delete(`/inventory-units/${id}`);
                fetchUnits();
            } catch (err) {
                console.error('Failed to delete unit:', err);
                alert('Failed to delete unit. It might be linked to existing items.');
            }
        }
    };

    const filteredUnits = units.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search stock units..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Unit</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium">Loading stock units...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Unit Name</th>
                                <th style={{ width: '55%' }}>Description</th>
                                <th style={{ width: '15%' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUnits.length > 0 ? filteredUnits.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-800 tracking-tight">{u.name}</span>
                                        </div>
                                    </td>
                                    <td><span className="text-slate-500 text-sm italic">{u.description || '-'}</span></td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(u)}>Edit</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all" onClick={() => handleDelete(u.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="text-center py-20 text-slate-400 italic">
                                        {searchTerm ? 'No units match your search.' : 'No units defined. Add units like Kgs, Litres, etc.'}
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
                            <h2 className="text-xl font-bold text-primary">{editingUnit ? 'Edit Unit' : 'Add Stock Unit'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-6 p-7">
                                <div className="form-group">
                                    <label>Unit Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. Kgs, Litres, Trays, Pieces"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description (Optional)</label>
                                    <textarea 
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                        placeholder="Brief purpose of this unit"
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">Save Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryUnits;
