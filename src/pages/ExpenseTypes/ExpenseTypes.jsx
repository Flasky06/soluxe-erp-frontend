import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';

const ExpenseTypes = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const { t } = useLanguage();
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

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredTypes.length / PAGE_SIZE);
    const paginatedTypes = filteredTypes.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
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

            <div className="table-card">
                <div className="overflow-x-auto w-full">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium italic">Loading expense types...</div>
                ) : (
                    <table className="management-table" style={{ minWidth: '400px' }}>
                        <thead>
                            <tr>
                                <th>{t('Category Name')}</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTypes.length > 0 ? paginatedTypes.map((type) => (
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
            </div>

            {!loading && filteredTypes.length > 0 && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredTypes.length}
                    pageSize={PAGE_SIZE}
                />
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingType ? 'Edit Expense Category' : 'New Expense Category'}
                size="sm"
                customClasses="!w-[90%] !max-w-[500px]"
            >
                <form onSubmit={handleSubmit}>
                            <div className="form-grid !grid-cols-1">
                                <div className="form-group">
                                    <label>{t('Category Name')}</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Utilities, Salaries" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{editingType ? 'Save Changes' : 'Create Category'}</button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default ExpenseTypes;
