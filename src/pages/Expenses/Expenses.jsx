import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Search, Plus } from 'lucide-react';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        expenseType: { id: '' },
        paymentMethod: 'CASH',
        referenceNumber: ''
    });

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

            <div className="table-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium italic">Synchronizing financial records...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Payment Info</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length > 0 ? filteredExpenses.map((exp) => (
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
                                        <span className="font-bold text-maroon">KSh {Number(exp.amount).toLocaleString()}</span>
                                    </td>
                                    <td>
                                        <div className="flex flex-col text-[11px]">
                                            <span className="font-bold text-slate-700">{exp.paymentMethod || 'CASH'}</span>
                                            <span className="text-slate-400">{exp.referenceNumber || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(exp)}>Edit</button>
                                            <button className="delete-btn" onClick={() => handleDelete(exp.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-slate-400 font-medium italic">
                                        No financial records found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[80%] !max-w-[800px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">{editingExpense ? 'Update Expense Record' : 'Record New Hotel Expense'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Description / Item Name</label>
                                    <input type="text" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="e.g. Electricity Bill October 2023" />
                                </div>
                                <div className="form-group">
                                    <label>Amount (KSh)</label>
                                    <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
                                </div>
                                <div className="form-group">
                                    <label>Expense Date</label>
                                    <input type="date" required value={formData.expenseDate} onChange={(e) => setFormData({...formData, expenseDate: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Expenditure Category</label>
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
                                    <label>Payment Method</label>
                                    <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
                                        {paymentMethods.map(pm => (
                                            <option key={pm} value={pm}>{pm.replace(/_/g, ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group full-width">
                                    <label>Reference # / Receipt No.</label>
                                    <input type="text" value={formData.referenceNumber} onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})} placeholder="e.g. Transaction ID or Invoice Number" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">{editingExpense ? 'Save Updates' : 'Record Expense'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
