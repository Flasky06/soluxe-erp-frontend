import React, { useState, useEffect, useCallback } from 'react';
import { 
    Wallet, 
    ArrowUpRight, 
    ArrowDownRight, 
    TrendingUp,
    Plus,
    Trash2,
    Calendar,
    DollarSign
} from 'lucide-react';
import api from '../../services/api';

const CashMovements = () => {
    const [movements, setMovements] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        type: 'DRAWING',
        movementDate: new Date().toISOString().split('T')[0],
        description: ''
    });

    const fetchMovements = useCallback(async () => {
        try {
            const res = await api.get('/finance/cash-movements');
            setMovements(res.data);
        } catch (err) {
            console.error("Error fetching movements:", err);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            await fetchMovements();
        };
        load();
    }, [fetchMovements]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/cash-movements', formData);
            setShowModal(false);
            setFormData({ amount: '', type: 'DRAWING', movementDate: new Date().toISOString().split('T')[0], description: '' });
            fetchMovements();
        } catch (err) {
            console.error("Error saving movement:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this movement?")) return;
        try {
            await api.delete(`/finance/cash-movements/${id}`);
            fetchMovements();
        } catch (err) {
            console.error("Error deleting movement:", err);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-text-dark tracking-tight">Equity & Cash Movements</h1>
                    <p className="text-text-slate mt-1">Track capital injections, drawings, and savings</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    Record Movement
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <EquityCard 
                    label="Total Drawings" 
                    value={movements.filter(m => m.type === 'DRAWING').reduce((acc, curr) => acc + curr.amount, 0)}
                    icon={ArrowDownRight}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <EquityCard 
                    label="Total Savings" 
                    value={movements.filter(m => m.type === 'SAVING').reduce((acc, curr) => acc + curr.amount, 0)}
                    icon={TrendingUp}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <EquityCard 
                    label="Capital Injected" 
                    value={movements.filter(m => m.type === 'CAPITAL_INJECTION').reduce((acc, curr) => acc + curr.amount, 0)}
                    icon={ArrowUpRight}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
            </div>

            <div className="premium-card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4 text-right">Amount (KSh)</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {movements.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-600">{m.movementDate}</td>
                                <td className="px-6 py-4">
                                    <span className={`status-badge ${
                                        m.type === 'DRAWING' ? 'warning' : m.type === 'SAVING' ? 'success' : 'info'
                                    }`}>
                                        {m.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-700 font-medium">{m.description}</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-900">
                                    {parseFloat(m.amount).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-600 transition-colors">
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Record Movement</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Movement Type</label>
                                <select 
                                    value={formData.type}
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-medium text-slate-700 bg-slate-50"
                                >
                                    <option value="DRAWING">Owner Drawing</option>
                                    <option value="SAVING">Savings / Reserves</option>
                                    <option value="CAPITAL_INJECTION">Capital Injection</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Amount (KSh)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">KSh</span>
                                    <input 
                                        type="number"
                                        required
                                        value={formData.amount}
                                        onChange={e => setFormData({...formData, amount: e.target.value})}
                                        className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-bold text-slate-700 bg-slate-50"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                                <input 
                                    type="date"
                                    required
                                    value={formData.movementDate}
                                    onChange={e => setFormData({...formData, movementDate: e.target.value})}
                                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-medium text-slate-700 bg-slate-50"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                                <textarea 
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full p-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none font-medium text-slate-700 bg-slate-50 min-h-[100px]"
                                    placeholder="Enter details..."
                                />
                            </div>
                            <button type="submit" className="w-full h-12 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 mt-2">
                                Save Movement
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const EquityCard = ({ label, value, icon: _Icon, color, bg }) => {
    const Icon = _Icon;
    return (
        <div className="premium-card p-6 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <div className={`text-2xl font-black mt-1 ${color}`}>KSh {value.toLocaleString()}</div>
            </div>
        </div>
    );
};

export default CashMovements;
