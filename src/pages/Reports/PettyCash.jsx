import React, { useState, useEffect, useCallback } from 'react';
import { 
    Coins, 
    Plus, 
    Trash2, 
    Search,
    Calendar,
    Tag,
    User
} from 'lucide-react';
import api from '../../services/api';

const PettyCash = () => {
    const [pettyCashEntries, setPettyCashEntries] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        description: '',
        issuedTo: '',
        category: 'Miscellaneous'
    });

    const categories = ['Office Supplies', 'Transport', 'Tips', 'Staff Meals', 'Miscellaneous'];

    const fetchPettyCash = useCallback(async () => {
        try {
            // Note: Endpoints will be implemented in backend if not already exist
            const res = await api.get('/finance/petty-cash');
            setPettyCashEntries(res.data);
        } catch (err) {
            console.error("Error fetching petty cash:", err);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            await fetchPettyCash();
        };
        load();
    }, [fetchPettyCash]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/petty-cash', formData);
            setShowModal(false);
            setFormData({ amount: '', expenseDate: new Date().toISOString().split('T')[0], description: '', issuedTo: '', category: 'Miscellaneous' });
            fetchPettyCash();
        } catch (err) {
            console.error("Error saving petty cash:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this entry?")) return;
        try {
            await api.delete(`/finance/petty-cash/${id}`);
            fetchPettyCash();
        } catch (err) {
            console.error("Error deleting entry:", err);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-text-dark tracking-tight">Petty Cash</h1>
                    <p className="text-text-slate mt-1">Manage small daily operational expenses</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    New Voucher
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="premium-card p-6 border-l-4 border-l-primary">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Available Reserve</span>
                    <div className="text-2xl font-black text-slate-800 mt-1">$ 0.00</div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">Balance to be synced with accounts</p>
                </div>
                <div className="premium-card p-6">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Spent Today</span>
                    <div className="text-2xl font-black text-red-600 mt-1">$ {pettyCashEntries.filter(e => e.expenseDate === new Date().toISOString().split('T')[0]).reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</div>
                </div>
            </div>

<div className="premium-card overflow-x-auto">
                <table className="management-table" style={{ minWidth: '600px' }}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Issued To</th>
                            <th className="text-right">Amount ($)</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pettyCashEntries.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="text-sm text-slate-600 font-medium">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        {e.expenseDate}
                                    </div>
                                </td>
                                <td>
                                    <span className="status-badge info text-[10px]">
                                        {e.category}
                                    </span>
                                </td>
                                <td className="text-sm text-slate-700">{e.description}</td>
                                <td className="text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-slate-400" />
                                        {e.issuedTo || 'N/A'}
                                    </div>
                                </td>
                                <td className="text-right font-bold text-slate-900">
                                    {parseFloat(e.amount).toLocaleString()}
                                </td>
                                <td className="text-center">
                                    <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">New Petty Cash Voucher</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Amount ($)</label>
                                    <input 
                                        type="number"
                                        required
                                        value={formData.amount}
                                        onChange={ev => setFormData({...formData, amount: ev.target.value})}
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none font-bold text-slate-700 bg-slate-50"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                                    <input 
                                        type="date"
                                        required
                                        value={formData.expenseDate}
                                        onChange={ev => setFormData({...formData, expenseDate: ev.target.value})}
                                        className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none font-medium text-slate-700 bg-slate-50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                                <select 
                                    value={formData.category}
                                    onChange={ev => setFormData({...formData, category: ev.target.value})}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none font-medium text-slate-700 bg-slate-50"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Issued To</label>
                                <input 
                                    type="text"
                                    value={formData.issuedTo}
                                    onChange={ev => setFormData({...formData, issuedTo: ev.target.value})}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-primary outline-none font-medium text-slate-700 bg-slate-50"
                                    placeholder="Employee name..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                                <textarea 
                                    required
                                    value={formData.description}
                                    onChange={ev => setFormData({...formData, description: ev.target.value})}
                                    className="w-full p-4 rounded-xl border border-slate-200 focus:border-primary outline-none font-medium text-slate-700 bg-slate-50 min-h-[80px]"
                                    placeholder="What was this for?"
                                />
                            </div>
                            <button type="submit" className="w-full h-12 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-primary-dark transition-all mt-2">
                                Record Voucher
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PettyCash;
