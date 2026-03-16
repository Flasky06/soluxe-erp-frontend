import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Search, Filter, Plus, FileText, CreditCard } from 'lucide-react';

const Folio = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [folios, setFolios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showMethodModal, setShowMethodModal] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedFolioId, setSelectedFolioId] = useState(null);
    const [receipts, setReceipts] = useState([]);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showChargeTypeModal, setShowChargeTypeModal] = useState(false);
    const [newChargeType, setNewChargeType] = useState({ name: '', description: '', active: true });
    
    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [newMethod, setNewMethod] = useState({ name: '', description: '' });
    const [chargeTypes, setChargeTypes] = useState([]);
    const [newCharge, setNewCharge] = useState({
        chargeTypeId: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxPct: 0,
        discountPct: 0
    });
    const [newPayment, setNewPayment] = useState({
        paymentMethodId: '',
        amount: 0,
        referenceNumber: ''
    });

    const handleOpenChargeModal = (id) => {
        setSelectedFolioId(id);
        setShowModal(true);
    };

    const handlePostCharge = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newCharge,
                chargeTypeId: parseInt(newCharge.chargeTypeId) > 0 ? parseInt(newCharge.chargeTypeId) : null,
                quantity: parseFloat(newCharge.quantity) || 0,
                unitPrice: parseFloat(newCharge.unitPrice) || 0,
                taxPct: parseFloat(newCharge.taxPct) || 0,
                discountPct: parseFloat(newCharge.discountPct) || 0
            };
            await api.post(`/folios/${selectedFolioId}/charges?userId=${user?.id || 1}`, payload);
            setShowModal(false);
            const response = await api.get('/folios');
            setFolios(response.data);
            setNewCharge({ chargeTypeId: chargeTypes[0]?.id || '', description: '', quantity: 1, unitPrice: 0, taxPct: 0, discountPct: 0 });
        } catch (err) {
            console.error('Failed to post charge', err);
            alert('Failed to post charge.');
        }
    };

    const handleOpenPaymentModal = (id, balance) => {
        setSelectedFolioId(id);
        setNewPayment({ ...newPayment, amount: balance });
        setShowPaymentModal(true);
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newPayment,
                amount: parseFloat(newPayment.amount) || 0,
                paymentMethodId: parseInt(newPayment.paymentMethodId)
            };
            await api.post(`/folios/${selectedFolioId}/payments?userId=${user?.id || 1}`, payload);
            setShowPaymentModal(false);
            
            // Fetch receipts for this folio to show the new one
            const receiptsRes = await api.get(`/folios/receipts/folio/${selectedFolioId}`);
            setReceipts(receiptsRes.data);
            setShowReceiptModal(true);

            const response = await api.get('/folios');
            setFolios(response.data);
            setNewPayment({ paymentMethodId: '', amount: 0, referenceNumber: '' });
        } catch (err) {
            console.error('Failed to record payment', err);
            alert('Failed to record payment.');
        }
    };

    const handleViewReceipts = async (folioId) => {
        try {
            const response = await api.get(`/folios/receipts/folio/${folioId}`);
            setReceipts(response.data);
            setSelectedFolioId(folioId);
            setShowReceiptModal(true);
        } catch (err) {
            console.error('Failed to fetch receipts', err);
            alert('Failed to fetch receipts.');
        }
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleCloseFolio = async (id) => {
        if (!window.confirm('Are you sure you want to close this folio? It cannot be reopened.')) return;
        try {
            await api.post(`/folios/${id}/close?userId=${user?.id || 1}`);
            const response = await api.get('/folios');
            setFolios(response.data);
        } catch (err) {
            console.error('Failed to close folio', err);
            alert('Failed to close folio. Ensure balance is zero.');
        }
    };

    const handleCreatePaymentMethod = async (e) => {
        e.preventDefault();
        try {
            await api.post('/folios/payment-methods', newMethod);
            const response = await api.get('/folios/payment-methods');
            setPaymentMethods(response.data);
            setNewMethod({ name: '', description: '' });
            setShowMethodModal(false);
        } catch (err) {
            console.error('Failed to create payment method', err);
            alert('Failed to create payment method.');
        }
    };

    const handleCreateChargeType = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/charge-types', newChargeType);
            const response = await api.get('/charge-types');
            setChargeTypes(response.data);
            setNewCharge(prev => ({ ...prev, chargeTypeId: res.data.id }));
            setNewChargeType({ name: '', description: '', active: true });
            setShowChargeTypeModal(false);
        } catch (err) {
            console.error('Failed to create charge type', err);
            alert('Failed to create charge type.');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [foliosRes, methodsRes, chargeTypesRes] = await Promise.all([
                    api.get('/folios'),
                    api.get('/folios/payment-methods'),
                    api.get('/charge-types')
                ]);
                setFolios(foliosRes.data);
                setPaymentMethods(methodsRes.data);
                setChargeTypes(chargeTypesRes.data);
                if (chargeTypesRes.data.length > 0) {
                    setNewCharge(prev => ({ ...prev, chargeTypeId: chargeTypesRes.data[0].id }));
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="flex flex-col">
            <div className="flex justify-end items-center gap-2 mb-4">
                <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-2" onClick={() => navigate('/charge-types')}>
                    <Plus size={14} /> Manage Charge Types
                </button>
                <button className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-2" onClick={() => setShowMethodModal(true)}>
                    <CreditCard size={14} /> Manage Payment Methods
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="premium-card px-4 py-3 mb-5 flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-maroon transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by Folio ID or Type..." 
                        className="w-full pl-11 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-maroon/10 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold whitespace-nowrap px-2">
                        <Filter size={16} /> Status:
                    </div>
                    <select 
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-maroon/10 outline-none cursor-pointer hover:border-slate-300 transition-all w-full md:w-[160px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Status</option>
                        <option value="OPEN">Open</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
            </div>

            <div className="premium-card overflow-hidden">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse text-lg">Loading folios...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Folio ID</th>
                                <th>Type</th>
                                <th>Opened At</th>
                                <th>Status</th>
                                <th>Total Balance</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {folios.filter(f => {
                                const matchesSearch = f.id.toString().includes(searchQuery) || f.folioType.toLowerCase().includes(searchQuery.toLowerCase());
                                const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
                                return matchesSearch && matchesStatus;
                            }).length > 0 ? (
                                folios
                                    .filter(f => {
                                        const matchesSearch = f.id.toString().includes(searchQuery) || f.folioType.toLowerCase().includes(searchQuery.toLowerCase());
                                        const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
                                        return matchesSearch && matchesStatus;
                                    })
                                    .map((folio) => (
                                    <tr key={folio.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="font-bold text-slate-700">#{folio.id.toString().padStart(5, '0')}</td>
                                        <td>{folio.folioType}</td>
                                        <td>{new Date(folio.openedAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                                folio.status === 'OPEN' ? 'bg-blue-50 text-blue-600' : 
                                                folio.status === 'CLOSED' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                                {folio.status}
                                            </span>
                                        </td>
                                        <td className="font-bold text-primary">$ {folio.totalAmount.toLocaleString()}</td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded text-[11px] font-bold transition-all" onClick={() => handleOpenChargeModal(folio.id)}>Post Charge</button>
                                                {folio.status === 'OPEN' && (
                                                    <button className="btn-primary-outline px-3 py-1.5 text-[11px] font-bold" onClick={() => handleOpenPaymentModal(folio.id, folio.totalAmount)}>Record Payment</button>
                                                )}
                                                <button className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded text-[11px] font-bold transition-all" onClick={() => handleViewReceipts(folio.id)}>Receipts</button>
                                                {folio.status === 'OPEN' && folio.totalAmount <= 0 && (
                                                    <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-[11px] font-bold shadow-sm transition-all" onClick={() => handleCloseFolio(folio.id)}>Settle & Close</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 text-text-slate">No active folios found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Post Charge Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[85%] !max-w-[700px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">Post Charge to #{selectedFolioId?.toString().padStart(5, '0')}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handlePostCharge}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Charge Type</label>
                                    <div className="flex gap-2">
                                        <select className="flex-1" value={newCharge.chargeTypeId} onChange={(e) => setNewCharge({...newCharge, chargeTypeId: e.target.value})}>
                                            {chargeTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                        <button 
                                            type="button"
                                            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-colors"
                                            onClick={() => setShowChargeTypeModal(true)}
                                            title="Add New Charge Type"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <input type="text" required value={newCharge.description} onChange={(e) => setNewCharge({...newCharge, description: e.target.value})} placeholder="e.g. Dinner" />
                                </div>
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input type="number" step="0.01" required value={newCharge.quantity} onChange={(e) => setNewCharge({...newCharge, quantity: parseFloat(e.target.value) || 0})} />
                                </div>
                                <div className="form-group">
                                    <label>Unit Price ($)</label>
                                    <input type="number" step="0.01" required value={newCharge.unitPrice} onChange={(e) => setNewCharge({...newCharge, unitPrice: parseFloat(e.target.value) || 0})} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-8">Cancel</button>
                                <button type="submit" className="btn-primary !px-8">Submit Charge</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {showPaymentModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[85%] !max-w-[600px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">Record Payment for #{selectedFolioId?.toString().padStart(5, '0')}</h2>
                            <button className="close-modal-btn" onClick={() => setShowPaymentModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleRecordPayment}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Payment Method</label>
                                    <div className="flex gap-2">
                                        <select className="flex-1" required value={newPayment.paymentMethodId} onChange={(e) => setNewPayment({...newPayment, paymentMethodId: e.target.value})}>
                                            <option value="">Select Method</option>
                                            {paymentMethods.map(method => (
                                                <option key={method.id} value={method.id}>{method.name}</option>
                                            ))}
                                        </select>
                                        <button 
                                            type="button"
                                            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-colors"
                                            onClick={() => setShowMethodModal(true)}
                                            title="Add New Payment Method"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Amount ($)</label>
                                    <input type="number" step="0.01" required value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value) || 0})} />
                                </div>
                                <div className="form-group">
                                    <label>Reference / Receipt No.</label>
                                    <input type="text" value={newPayment.referenceNumber} onChange={(e) => setNewPayment({...newPayment, referenceNumber: e.target.value})} placeholder="Optional" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary !px-8">Cancel</button>
                                <button type="submit" className="btn-primary !px-8">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Payment Methods Modal */}
            {showMethodModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[85%] !max-w-[700px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">Manage Payment Methods</h2>
                            <button className="close-modal-btn" onClick={() => setShowMethodModal(false)}>&times;</button>
                        </div>
                        
                        <div className="mb-8 max-h-[200px] overflow-y-auto border border-slate-200 p-5 rounded-xl bg-slate-50">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Existing Methods</h4>
                            {paymentMethods.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {paymentMethods.map(m => (
                                        <div key={m.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                                            <span className="font-bold text-slate-700">{m.name}</span>
                                            <span className="text-[12px] text-slate-500">{m.description}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-4 text-slate-400 text-sm italic">No payment methods defined yet.</p>
                            )}
                        </div>

                        <form onSubmit={handleCreatePaymentMethod} className="border-t border-slate-200 pt-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Add New Method</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Method Name</label>
                                    <input type="text" required value={newMethod.name} onChange={(e) => setNewMethod({...newMethod, name: e.target.value})} placeholder="e.g. M-Pesa, Visa" />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input type="text" value={newMethod.description} onChange={(e) => setNewMethod({...newMethod, description: e.target.value})} placeholder="Optional" />
                                </div>
                            </div>
                            <div className="modal-footer mt-6">
                                <button type="button" onClick={() => setShowMethodModal(false)} className="btn-secondary !px-8">Close</button>
                                <button type="submit" className="btn-primary !px-8">Add Method</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Receipts Modal */}
            {showReceiptModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[95%] !max-w-[700px] print:!max-w-none print:shadow-none print:p-0">
                        <div className="modal-header print:hidden">
                            <h2 className="text-xl font-bold text-primary">Receipts for #{selectedFolioId?.toString().padStart(5, '0')}</h2>
                            <button className="close-modal-btn" onClick={() => setShowReceiptModal(false)}>&times;</button>
                        </div>

                        <div className="flex flex-col gap-10 p-4 print:p-0">
                            {receipts.length > 0 ? (
                                receipts.map(receipt => (
                                    <div key={receipt.id} className="p-10 max-w-[600px] mx-auto w-full bg-white border border-dashed border-slate-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[radial-gradient(circle,theme(colors.slate.300)_1px,transparent_1px)] before:bg-[length:8px_4px] before:bg-repeat-x after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-[radial-gradient(circle,theme(colors.slate.300)_1px,transparent_1px)] after:bg-[length:8px_4px] after:bg-repeat-x shadow-md print:shadow-none print:border-none print:mx-0 print:max-w-none">
                                        <div className="text-center border-b-2 border-slate-200 pb-6 mb-6">
                                            <h2 className="text-3xl font-extrabold tracking-[4px] text-primary m-0">SOLUXE CLUB HOTEL</h2>
                                            <p className="uppercase text-[10px] text-slate-400 mt-1 font-bold tracking-widest">Official Payment Receipt</p>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-between text-slate-700">
                                                <span className="text-[13px] font-medium uppercase text-slate-400">Receipt No:</span>
                                                <span className="font-bold">#{receipt.receiptNumber}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-700">
                                                <span className="text-[13px] font-medium uppercase text-slate-400">Date:</span>
                                                <span className="font-medium">{new Date(receipt.issuedAt).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-700">
                                                <span className="text-[13px] font-medium uppercase text-slate-400">Folio ID:</span>
                                                <span className="font-medium">#{receipt.folioId.toString().padStart(5, '0')}</span>
                                            </div>
                                            <div className="py-5 border-t border-dashed border-slate-200 border-b-2 border-primary my-2 flex justify-between items-center bg-slate-50/30 px-2 rounded">
                                                <span className="text-lg font-bold text-slate-800">Amount Paid:</span>
                                                <span className="text-2xl font-extrabold text-green-600">$ {receipt.amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-center mt-8 pt-4">
                                            <p className="text-[15px] font-medium text-slate-600">Thank you for choosing Soluxe Club Hotel!</p>
                                            <div className="text-[10px] mt-4 opacity-70 font-mono text-slate-500 flex flex-col items-center">
                                                <p>Auth Code: {receipt.paymentId}</p>
                                                <p>Issued by: {receipt.issuedBy}</p>
                                            </div>
                                        </div>
                                        <div className="mt-10 print:hidden">
                                            <button className="w-full btn-primary py-3 rounded-xl shadow-sm font-bold text-base" onClick={handlePrintReceipt}>Print Official Receipt</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-text-slate border-2 border-dashed border-slate-200 rounded-xl">
                                    <p>No receipts found for this folio.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Manage Charge Types Modal */}
            {showChargeTypeModal && (
                <div className="modal-overlay z-[1100]">
                    <div className="modal-content premium-card !w-[85%] !max-w-[700px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">Manage Charge Types</h2>
                            <button className="close-modal-btn" onClick={() => setShowChargeTypeModal(false)}>&times;</button>
                        </div>
                        
                        <div className="mb-8 max-h-[200px] overflow-y-auto border border-slate-200 p-5 rounded-xl bg-slate-50">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Existing Types</h4>
                            {chargeTypes.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {chargeTypes.map(t => (
                                        <div key={t.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                                            <span className="font-bold text-slate-700">{t.name}</span>
                                            <span className="text-[12px] text-slate-500">{t.description}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-4 text-slate-400 text-sm italic">No charge types defined yet.</p>
                            )}
                        </div>

                        <form onSubmit={handleCreateChargeType} className="border-t border-slate-200 pt-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Add New Type</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Type Name</label>
                                    <input type="text" required value={newChargeType.name} onChange={(e) => setNewChargeType({...newChargeType, name: e.target.value})} placeholder="e.g. Laundry, Mini-bar" />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input type="text" value={newChargeType.description} onChange={(e) => setNewChargeType({...newChargeType, description: e.target.value})} placeholder="Optional" />
                                </div>
                            </div>
                            <div className="modal-footer mt-6">
                                <button type="button" onClick={() => setShowChargeTypeModal(false)} className="btn-secondary !px-8">Close</button>
                                <button type="submit" className="btn-primary !px-8">Add Type</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Folio;
