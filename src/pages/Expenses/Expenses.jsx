import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Search, Plus } from 'lucide-react';
import Pagination from '../../components/Pagination/Pagination';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import useAuthStore from '../../store/authStore';

const Expenses = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ROLE_HOTEL_ADMIN' || user?.role === 'HOTEL_ADMIN';
    const { t } = useLanguage();
    const [expenses, setExpenses] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        expenseType: { id: '' },
        paymentMethod: 'CASH',
        referenceNumber: ''
    });
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [addingType, setAddingType] = useState(false);

    const paymentMethods = [
        'CASH', 'BANK_TRANSFER', 'MPESA', 'CREDIT_CARD', 'CHEQUE'
    ];

    const fetchData = useCallback(async () => {
        try {
            const [expRes, typesRes] = await Promise.all([
                api.get('/expenses'),
                api.get('/expense-types')
            ]);
            setExpenses(expRes.data);
            setTypes(typesRes.data);
            
            // Set default type if none selected and types exist
            if (typesRes.data.length > 0 && !formData.expenseType.id) {
                setFormData(prev => ({...prev, expenseType: { id: typesRes.data[0].id }}));
            }
        } catch (err) {
            console.error('Failed to fetch expenses:', err);
        } finally {
            setLoading(false);
        }
    }, [formData.expenseType.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (expense = null) => {
        if (expense) {
            setEditingExpense(expense);
            setFormData({
                description: expense.description,
                amount: expense.amount,
                expenseDate: expense.expenseDate,
                expenseType: { id: expense.expenseType?.id || '' },
                paymentMethod: expense.paymentMethod || 'CASH',
                referenceNumber: expense.referenceNumber || ''
            });
        } else {
            setEditingExpense(null);
            setFormData({
                description: '',
                amount: '',
                expenseDate: new Date().toISOString().split('T')[0],
                expenseType: { id: types[0]?.id || '' },
                paymentMethod: 'CASH',
                referenceNumber: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingExpense) {
                await api.put(`/expenses/${editingExpense.id}`, formData);
            } else {
                await api.post('/expenses', formData);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save expense:', err);
            alert('Failed to save expense.');
        }
    };

    const handleQuickAddExpenseType = async (e) => {
        e.preventDefault();
        if (!newTypeName.trim()) return;
        
        setAddingType(true);
        try {
            const res = await api.post('/expense-types', { name: newTypeName });
            // Refresh types
            const typesRes = await api.get('/expense-types');
            setTypes(typesRes.data);
            
            // Set as selected
            setFormData(prev => ({ ...prev, expenseType: { id: res.data.id } }));
            
            setNewTypeName('');
            setShowTypeModal(false);
        } catch (err) {
            console.error('Failed to add expense type:', err);
            alert('Failed to add category.');
        } finally {
            setAddingType(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense record?')) {
            try {
                await api.delete(`/expenses/${id}`);
                fetchData();
            } catch (err) {
                console.error('Failed to delete expense:', err);
                alert('Failed to delete expense.');
            }
        }
    };

    const filteredExpenses = expenses.filter(exp => 
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.expenseType?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredExpenses.length / PAGE_SIZE);
    const paginatedExpenses = filteredExpenses.slice(
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
                        placeholder="Search expenses by description or category..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} className="inline mr-1" />
                    Record Expense
                </button>
            </div>

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                    {loading ? (
                        <div className="text-center py-20 text-text-slate animate-pulse font-medium italic">Synchronizing financial records...</div>
                    ) : (
                        <table className="management-table" style={{ minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th>{t('Date')}</th>
                                    <th>{t('Description')}</th>
                                    <th>{t('Category')}</th>
                                    <th>{t('Amount')}</th>
                                    <th>{t('Payment Info')}</th>
                                    {isAdmin && <th>{t('Audit')}</th>}
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                        <tbody>
                            {paginatedExpenses.length > 0 ? paginatedExpenses.map((exp) => (
                                <tr key={exp.id}>
                                    <td>
                                        <span className="font-medium text-text-slate">{exp.expenseDate}</span>
                                    </td>
                                    <td>
                                        <span className="font-bold text-text-dark">{exp.description}</span>
                                    </td>
                                    <td>
                                        <span className="status-badge info">{exp.expenseType?.name || 'Uncategorized'}</span>
                                    </td>
                                    <td>
                                        <span className="font-bold text-maroon">$ {Number(exp.amount).toLocaleString()}</span>
                                    </td>
                                    <td>
                                        <div className="flex flex-col text-[11px]">
                                            <span className="font-bold text-slate-700">{exp.paymentMethod || 'CASH'}</span>
                                            <span className="text-slate-400">{exp.referenceNumber || '-'}</span>
                                        </div>
                                    </td>
                                    {isAdmin && (
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-text-slate font-medium">Created: <span className="font-bold text-text-dark">{exp.createdBy || '-'}</span></span>
                                                <span className="text-[10px] text-text-slate font-medium">Modified: <span className="font-bold text-text-dark">{exp.modifiedBy || '-'}</span></span>
                                            </div>
                                        </td>
                                    )}
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(exp)}>Edit</button>
                                            <button className="delete-btn" onClick={() => handleDelete(exp.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={isAdmin ? 7 : 6} className="text-center py-12 text-slate-400 font-medium italic">
                                        No financial records found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>
            {!loading && filteredExpenses.length > 0 && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredExpenses.length}
                    pageSize={PAGE_SIZE}
                />
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingExpense ? 'Update Expense Record' : 'Record New Hotel Expense'}
                size="md"
                customClasses="!w-[80%] !max-w-[800px]"
            >
                <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>{t('Description / Item Name')}</label>
                                    <input type="text" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="e.g. Electricity Bill October 2023" />
                                </div>
                                <div className="form-group">
                                    <label>{t('Amount ($)')}</label>
                                    <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
                                </div>
                                <div className="form-group">
                                    <label>{t('Expense Date')}</label>
                                    <input type="date" required value={formData.expenseDate} onChange={(e) => setFormData({...formData, expenseDate: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="flex justify-between">
                                        Expenditure Category
                                        <button 
                                            type="button" 
                                            className="text-primary text-[10px] flex items-center hover:underline"
                                            onClick={() => setShowTypeModal(true)}
                                        >
                                            <Plus size={10} className="mr-1" /> New Category
                                        </button>
                                    </label>
                                    <select 
                                        required
                                        value={formData.expenseType.id} 
                                        onChange={(e) => setFormData({...formData, expenseType: { id: e.target.value }})}
                                    >
                                        <option value="" disabled>Select Category</option>
                                        {types.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('Payment Method')}</label>
                                    <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
                                        {paymentMethods.map(pm => (
                                            <option key={pm} value={pm}>{pm.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group full-width">
                                    <label>{t('Reference # / Receipt No.')}</label>
                                    <input type="text" value={formData.referenceNumber} onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})} placeholder="e.g. Transaction ID or Invoice Number" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">{editingExpense ? 'Save Updates' : 'Record Expense'}</button>
                            </div>
                        </form>
            </Modal>

            <Modal
                isOpen={showTypeModal}
                onClose={() => setShowTypeModal(false)}
                title="Quick-Add Category"
                size="sm"
                customClasses="!max-w-[500px]"
                overlayClasses="z-[1100]"
            >
                <form onSubmit={handleQuickAddExpenseType}>
                            <div className="p-4">
                                <label className="block text-sm font-medium mb-1">New Category Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    autoFocus
                                    className="w-full p-2 border rounded"
                                    value={newTypeName}
                                    onChange={(e) => setNewTypeName(e.target.value)}
                                    placeholder="e.g. Marketing, Repairs"
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowTypeModal(false)} className="btn-secondary !py-1 text-sm">Cancel</button>
                                <button type="submit" disabled={addingType} className="btn-primary !py-1 text-sm">
                                    {addingType ? 'Adding...' : 'Add Category'}
                                </button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default Expenses;
