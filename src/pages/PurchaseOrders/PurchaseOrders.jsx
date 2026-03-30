import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShoppingCart, Plus, Calendar, User, Search, Filter, CheckCircle, Clock, Truck, MoreVertical } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';

const PurchaseOrders = () => {
    const { t } = useLanguage();
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        supplierId: '',
        expectedDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
        notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [poRes, supRes] = await Promise.all([
                api.get('/purchase-orders'),
                api.get('/suppliers')
            ]);
            setOrders(poRes.data);
            setSuppliers(supRes.data);
            if (supRes.data.length > 0) {
                setFormData(prev => ({ ...prev, supplierId: supRes.data[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch PO data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/purchase-orders', {
                ...formData,
                orderDate: new Date().toISOString().split('T')[0],
                status: 'PENDING'
            });
            setShowModal(false);
            fetchData();
            alert('Purchase order created successfully!');
        } catch (err) {
            console.error('Failed to create PO:', err);
            alert('Creation failed.');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const order = orders.find(o => o.id === id);
            await api.put(`/purchase-orders/${id}`, {
                ...order,
                status
            });
            fetchData();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const getSupplierName = (id) => suppliers.find(s => s.id === id)?.name || `Supplier #${id}`;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING': return <Clock size={14} className="text-slate-400" />;
            case 'SENT': return <Truck size={14} className="text-blue-500" />;
            case 'RECEIVED': return <CheckCircle size={14} className="text-green-500" />;
            default: return null;
        }
    };

    const filteredOrders = orders.filter(o => 
        getSupplierName(o.supplierId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-maroon/10 text-maroon rounded-2xl">
                        <ShoppingCart size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-text-dark tracking-tight">Procurement</h2>
                        <p className="text-text-slate text-sm font-medium">Create and track inventory purchase orders.</p>
                    </div>
                </div>
                <button className="btn-primary flex items-center gap-2 shadow-lg shadow-maroon/20" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Create Order
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-maroon transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search orders by supplier or notes..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-maroon/10 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"><Filter size={18} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="premium-card h-48 animate-pulse"></div>
                        ))
                    ) : filteredOrders.length > 0 ? (
                        filteredOrders.map(order => (
                            <div key={order.id} className="premium-card p-6 flex flex-col gap-4 border-t-4 border-t-maroon hover:shadow-xl transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PO #{order.id}</span>
                                        <h4 className="text-lg font-black text-text-dark group-hover:text-maroon transition-colors">{getSupplierName(order.supplierId)}</h4>
                                    </div>
                                    <span className={`status-badge ${order.status === 'RECEIVED' ? 'success' : order.status === 'SENT' ? 'info' : 'warning'} flex items-center gap-1.5`}>
                                        {getStatusIcon(order.status)}
                                        {order.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Ordered</span>
                                        <span className="text-sm font-bold text-slate-700">{order.orderDate}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Expected</span>
                                        <span className="text-sm font-bold text-maroon">{order.expectedDate || 'TBD'}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-text-slate line-clamp-2 italic">
                                    {order.notes || "No additional instructions provided for this order."}
                                </p>

                                <div className="flex gap-2 mt-auto">
                                    {order.status === 'PENDING' && (
                                        <button className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold hover:bg-slate-200 transition-colors" onClick={() => handleStatusUpdate(order.id, 'SENT')}>Mark as Sent</button>
                                    )}
                                    {order.status === 'SENT' && (
                                        <button className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg text-[11px] font-bold hover:bg-green-100 transition-colors" onClick={() => handleStatusUpdate(order.id, 'RECEIVED')}>Receive Order</button>
                                    )}
                                    <button className="p-2 text-slate-400 hover:text-maroon transition-colors"><MoreVertical size={16} /></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-text-slate italic border-2 border-dashed border-slate-200 rounded-3xl">
                            No purchase orders found. Click "Create Order" to start procurement.
                        </div>
                    )}
                </div>
            </div>

            {/* Application Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="New Purchase Order"
                size="sm"
                customClasses="!w-[90%] !max-w-[500px]"
            >
                <form onSubmit={handleSubmit} className="p-4">
                            <div className="flex flex-col gap-6">
                                <div className="form-group">
                                    <label>{t('Preferred Supplier')}</label>
                                    <select 
                                        required 
                                        value={formData.supplierId} 
                                        onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                                    >
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('Expected Delivery Date')}</label>
                                    <input type="date" required value={formData.expectedDate} onChange={(e) => setFormData({...formData, expectedDate: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>{t('PO Instructions / Notes')}</label>
                                    <textarea 
                                        className="min-h-[100px]" 
                                        value={formData.notes} 
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                                        placeholder="Add any specific delivery instructions or item details..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer !px-0 mt-8">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-8">Cancel</button>
                                <button type="submit" className="btn-primary !px-12">Submit Order</button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default PurchaseOrders;
