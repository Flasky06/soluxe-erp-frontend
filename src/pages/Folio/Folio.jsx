import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const Folio = () => {
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
    const [newMethod, setNewMethod] = useState({ name: '', description: '' });
    const [newCharge, setNewCharge] = useState({
        chargeType: 'ROOM_SERVICE',
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
            await api.post(`/folios/${selectedFolioId}/charges?userId=${user?.id || 1}`, newCharge);
            setShowModal(false);
            const response = await api.get('/folios');
            setFolios(response.data);
            setNewCharge({ chargeType: 'ROOM_SERVICE', description: '', quantity: 1, unitPrice: 0, taxPct: 0, discountPct: 0 });
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
            await api.post(`/folios/${selectedFolioId}/payments?userId=${user?.id || 1}`, newPayment);
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

    useEffect(() => {
        const fetchFolios = async () => {
            try {
                const [foliosRes, methodsRes] = await Promise.all([
                    api.get('/folios'),
                    api.get('/folios/payment-methods')
                ]);
                setFolios(foliosRes.data);
                setPaymentMethods(methodsRes.data);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFolios();
    }, []);

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Folio & Billing</h1>
                    <p className="text-text-slate text-base">Track guest spending and manage financial accounts.</p>
                </div>
                <button className="btn-secondary" onClick={() => setShowMethodModal(true)}>Manage Payment Methods</button>
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
                            {folios.length > 0 ? (
                                folios.map((folio) => (
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
                                        <td className="font-bold text-primary">KSh {folio.totalAmount.toLocaleString()}</td>
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
                            <div>
                                <h2 className="text-xl font-bold text-primary">Post Charge to #{selectedFolioId?.toString().padStart(5, '0')}</h2>
                                <p className="text-sm text-text-slate mt-0.5">Record a new expense against this folio.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handlePostCharge}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Charge Type</label>
                                    <select value={newCharge.chargeType} onChange={(e) => setNewCharge({...newCharge, chargeType: e.target.value})}>
                                        <option value="ROOM_SERVICE">ROOM_SERVICE</option>
                                        <option value="RESTAURANT">RESTAURANT</option>
                                        <option value="BAR">BAR</option>
                                        <option value="MINIBAR">MINIBAR</option>
                                        <option value="SPA">SPA</option>
                                        <option value="LAUNDRY">LAUNDRY</option>
                                        <option value="OTHER">OTHER</option>
                                    </select>
                                </div>
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <input type="text" required value={newCharge.description} onChange={(e) => setNewCharge({...newCharge, description: e.target.value})} placeholder="e.g. Dinner" />
                                </div>
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input type="number" step="0.01" required value={newCharge.quantity} onChange={(e) => setNewCharge({...newCharge, quantity: parseFloat(e.target.value)})} />
                                </div>
                                <div className="form-group">
                                    <label>Unit Price (KSh)</label>
                                    <input type="number" step="0.01" required value={newCharge.unitPrice} onChange={(e) => setNewCharge({...newCharge, unitPrice: parseFloat(e.target.value)})} />
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
                            <div>
                                <h2 className="text-xl font-bold text-primary">Record Payment for #{selectedFolioId?.toString().padStart(5, '0')}</h2>
                                <p className="text-sm text-text-slate mt-0.5">Settle the outstanding balance for this guest.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowPaymentModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleRecordPayment}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Payment Method</label>
                                    <select required value={newPayment.paymentMethodId} onChange={(e) => setNewPayment({...newPayment, paymentMethodId: e.target.value})}>
                                        <option value="">Select Method</option>
                                        {paymentMethods.map(method => (
                                            <option key={method.id} value={method.id}>{method.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Amount (KSh)</label>
                                    <input type="number" step="0.01" required value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})} />
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
                            <div>
                                <h2 className="text-xl font-bold text-primary">Manage Payment Methods</h2>
                                <p className="text-sm text-text-slate mt-0.5">Configure available payment gateways.</p>
                            </div>
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
                            <div>
                                <h2 className="text-xl font-bold text-primary">Receipts for #{selectedFolioId?.toString().padStart(5, '0')}</h2>
                                <p className="text-sm text-text-slate mt-0.5">Official payment records and transaction proofs.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowReceiptModal(false)}>&times;</button>
                        </div>

                        <div className="flex flex-col gap-10 p-4 print:p-0">
                            {receipts.length > 0 ? (
                                receipts.map(receipt => (
                                    <div key={receipt.id} className="p-10 max-w-[600px] mx-auto w-full bg-white border border-dashed border-slate-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[radial-gradient(circle,theme(colors.slate.300)_1px,transparent_1px)] before:bg-[length:8px_4px] before:bg-repeat-x after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-[radial-gradient(circle,theme(colors.slate.300)_1px,transparent_1px)] after:bg-[length:8px_4px] after:bg-repeat-x shadow-lg print:shadow-none print:border-none print:mx-0 print:max-w-none">
                                        <div className="text-center border-b-2 border-slate-200 pb-6 mb-6">
                                            <h2 className="text-3xl font-extrabold tracking-[4px] text-primary m-0">SOLUXE HOTEL</h2>
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
                                                <span className="text-2xl font-extrabold text-green-600">KSh {receipt.amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-center mt-8 pt-4">
                                            <p className="text-[15px] font-medium text-slate-600">Thank you for choosing Soluxe Hotel!</p>
                                            <div className="text-[10px] mt-4 opacity-70 font-mono text-slate-500 flex flex-col items-center">
                                                <p>Auth Code: {receipt.paymentId}</p>
                                                <p>Issued by: {receipt.issuedBy}</p>
                                            </div>
                                        </div>
                                        <div className="mt-10 print:hidden">
                                            <button className="w-full btn-primary py-3 rounded-xl shadow-md font-bold text-base" onClick={handlePrintReceipt}>Print Official Receipt</button>
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
        </div>
    );
};

export default Folio;
