import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, CreditCard } from 'lucide-react';

const PaymentMethods = () => {
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMethod, setEditingMethod] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        active: true
    });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchMethods = async () => {
        try {
            const response = await api.get('/folios/payment-methods');
            setMethods(response.data);
        } catch (err) {
            console.error('Failed to fetch payment methods:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMethods();
    }, []);

    const handleOpenModal = (method = null) => {
        if (method) {
            setEditingMethod(method);
            setFormData({
                name: method.name,
                active: method.active ?? true
            });
        } else {
            setEditingMethod(null);
            setFormData({ 
                name: '', 
                active: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingMethod) {
                await api.put(`/folios/payment-methods/${editingMethod.id}`, formData);
            } else {
                await api.post('/folios/payment-methods', formData);
            }
            setShowModal(false);
            fetchMethods();
        } catch (err) {
            console.error('Failed to save payment method:', err);
            alert('Failed to save payment method.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this payment method?')) {
            try {
                await api.delete(`/folios/payment-methods/${id}`);
                fetchMethods();
            } catch (err) {
                console.error('Failed to delete payment method:', err);
                alert('Failed to delete payment method. It might be in use.');
            }
        }
    };

    const filteredMethods = methods.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search payment methods..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Payment Method</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium">Syncing payment methods...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th style={{ width: '75%' }}>Method Name</th>
                                <th style={{ width: '10%' }}>Status</th>
                                <th style={{ width: '15%' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMethods.length > 0 ? filteredMethods.map((m) => (
                                <tr key={m.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-800">{m.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${m.active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {m.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(m)}>Edit</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all" onClick={() => handleDelete(m.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" className="text-center py-20 text-slate-400 italic">
                                        {searchTerm ? 'No methods match your search.' : 'No payment methods registered yet.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[85%] !max-w-[400px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">{editingMethod ? 'Edit Payment Method' : 'Register New Method'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-6 p-7">
                                <div className="form-group">
                                    <label>Method Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. M-Pesa, Cash, Bank Transfer"
                                    />
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <input 
                                        type="checkbox" 
                                        id="activeStatus"
                                        checked={formData.active} 
                                        onChange={(e) => setFormData({...formData, active: e.target.checked})} 
                                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="activeStatus" className="mb-0 cursor-pointer font-bold text-slate-700">Method is Active (Visible at Checkout)</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">Save Payment Method</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentMethods;
