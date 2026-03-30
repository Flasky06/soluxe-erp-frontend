import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Wrench } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';

const MaintenanceIssueTypes = () => {
    const { t } = useLanguage();
    const [issueTypes, setIssueTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchIssueTypes = async () => {
        try {
            const response = await api.get('/maintenance-issue-types');
            setIssueTypes(response.data);
        } catch (err) {
            console.error('Failed to fetch maintenance issue types:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssueTypes();
    }, []);

    const handleOpenModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name
            });
        } else {
            setEditingType(null);
            setFormData({ name: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await api.put(`/maintenance-issue-types/${editingType.id}`, formData);
            } else {
                await api.post('/maintenance-issue-types', formData);
            }
            setShowModal(false);
            fetchIssueTypes();
        } catch (err) {
            console.error('Failed to save issue type:', err);
            alert('Failed to save category.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await api.delete(`/maintenance-issue-types/${id}`);
                fetchIssueTypes();
            } catch (err) {
                console.error('Failed to delete issue type:', err);
                alert('Failed to delete. It might be assigned to active tickets.');
            }
        }
    };

    const filteredTypes = issueTypes.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search issue categories..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Category</button>
            </div>

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                    {loading ? (
                        <div className="text-center py-20 text-text-slate animate-pulse font-bold tracking-wider uppercase text-xs">Loading maintenance directory...</div>
                    ) : (
                        <table className="management-table" style={{ minWidth: '400px' }}>
                            <thead>
                                <tr>
                                    <th>{t('Category Name')}</th>
                                    <th className="text-right">Actions</th>
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
                                        <td>
                                            <div className="table-actions">
                                                <button className="view-btn" onClick={() => handleOpenModal(t)}>Edit</button>
                                                <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all" onClick={() => handleDelete(t.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="2" className="text-center py-20 text-slate-400 italic">
                                            {searchTerm ? 'No categories match your search.' : 'Define your first maintenance category.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingType ? 'Edit Category' : 'New Issue Category'}
                size="sm"
                customClasses="!w-[85%] !max-w-[500px]"
            >
                <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-6 p-7">
                                <div className="form-group">
                                    <label>{t('Category Label')}</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. Electrical, Plumbing, HVAC, ICT"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">Save Category</button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default MaintenanceIssueTypes;
