import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus } from 'lucide-react';

const ExpenseTypes = () => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: ''
    });

    const fetchTypes = async () => {
        try {
            const res = await api.get('/expense-types');
            setTypes(res.data);
        } catch (err) {
            console.error('Failed to fetch expense types:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    const handleOpenModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name
            });
        } else {
            setEditingType(null);
            setFormData({
                name: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await api.put(`/expense-types/${editingType.id}`, formData);
            } else {
                await api.post('/expense-types', formData);
            }
            setShowModal(false);
            fetchTypes();
        } catch (err) {
            console.error('Failed to save expense type:', err);
            alert('Failed to save expense type.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense category? This may affect existing records.')) {
            try {
                await api.delete(`/expense-types/${id}`);
                fetchTypes();
            } catch (err) {
                console.error('Failed to delete expense type:', err);
                alert('Failed to delete expense type.');
            }
        }
    };

    const filteredTypes = types.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search categories..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} className="inline mr-1" />
                    New Category
                </button>
            </div>

            <div className="table-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium italic">Loading expense types...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th style={{ width: '85%' }}>Category Name</th>
                                <th style={{ width: '15%' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTypes.length > 0 ? filteredTypes.map((type) => (
                                <tr key={type.id}>
                                    <td>
                                        <span className="font-bold text-text-dark uppercase text-sm tracking-wide">{type.name}</span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(type)}>Edit</button>
                                            <button className="delete-btn" onClick={() => handleDelete(type.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="2" className="text-center py-12 text-slate-400 font-medium italic">
                                        No categories found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[90%] !max-w-[400px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">{editingType ? 'Edit Expense Category' : 'New Expense Category'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid !grid-cols-1">
                                <div className="form-group">
                                    <label>Category Name</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Utilities, Salaries" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{editingType ? 'Save Changes' : 'Create Category'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseTypes;
