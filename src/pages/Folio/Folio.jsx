import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Folio.css';

const Folio = () => {
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
            await api.post(`/folios/${selectedFolioId}/charges?userId=1`, newCharge);
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
            await api.post(`/folios/${selectedFolioId}/payments?userId=1`, newPayment);
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
            await api.post(`/folios/${id}/close?userId=1`);
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
        <div className="folio-page">
            <div className="page-header">
                <div>
                    <h1>Folio & Billing</h1>
                    <p>Track guest spending and manage financial accounts.</p>
                </div>
                <button className="btn-secondary" onClick={() => setShowMethodModal(true)}>Manage Payment Methods</button>
            </div>

            <div className="premium-card table-container">
                {loading ? (
                    <div className="loading">Loading folios...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Folio ID</th>
                                <th>Type</th>
                                <th>Opened At</th>
                                <th>Status</th>
                                <th>Total Balance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {folios.length > 0 ? (
                                folios.map((folio) => (
                                    <tr key={folio.id}>
                                        <td className="bold">#{folio.id.toString().padStart(5, '0')}</td>
                                        <td>{folio.folioType}</td>
                                        <td>{new Date(folio.openedAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge ${folio.status.toLowerCase()}`}>
                                                {folio.status}
                                            </span>
                                        </td>
                                        <td className="amount">KES {folio.totalAmount.toLocaleString()}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="view-btn" onClick={() => handleOpenChargeModal(folio.id)}>Post Charge</button>
                                                {folio.status === 'OPEN' && (
                                                    <button className="edit-btn" onClick={() => handleOpenPaymentModal(folio.id, folio.totalAmount)}>Record Payment</button>
                                                )}
                                                <button className="btn-secondary" onClick={() => handleViewReceipts(folio.id)} style={{padding: '4px 8px', fontSize: '0.8rem'}}>Receipts</button>
                                                {folio.status === 'OPEN' && folio.totalAmount <= 0 && (
                                                    <button className="status-badge check-in" onClick={() => handleCloseFolio(folio.id)} style={{background: '#28a745', border: 'none', color: 'white', cursor: 'pointer'}}>Settle & Close</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="empty-state">No active folios found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card modal-md">
                        <div className="modal-header">
                            <h2>Post Charge to #{selectedFolioId?.toString().padStart(5, '0')}</h2>
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
                                    <label>Unit Price (KES)</label>
                                    <input type="number" step="0.01" required value={newCharge.unitPrice} onChange={(e) => setNewCharge({...newCharge, unitPrice: parseFloat(e.target.value)})} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Submit Charge</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPaymentModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card modal-md">
                        <div className="modal-header">
                            <h2>Record Payment for #{selectedFolioId?.toString().padStart(5, '0')}</h2>
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
                                    <label>Amount (KES)</label>
                                    <input type="number" step="0.01" required value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})} />
                                </div>
                                <div className="form-group">
                                    <label>Reference / Receipt No.</label>
                                    <input type="text" value={newPayment.referenceNumber} onChange={(e) => setNewPayment({...newPayment, referenceNumber: e.target.value})} placeholder="Optional" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showMethodModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card modal-md">
                        <div className="modal-header">
                            <h2>Manage Payment Methods</h2>
                            <button className="close-modal-btn" onClick={() => setShowMethodModal(false)}>&times;</button>
                        </div>
                        
                        <div className="payment-methods-list">
                            <h4>Existing Methods:</h4>
                            {paymentMethods.length > 0 ? (
                                paymentMethods.map(m => (
                                    <div key={m.id} className="method-item">
                                        <span><strong>{m.name}</strong></span>
                                        <span className="sub-text">{m.description}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-sub-state">No payment methods defined yet.</p>
                            )}
                        </div>

                        <form onSubmit={handleCreatePaymentMethod} className="add-method-form">
                            <h4>Add New Method:</h4>
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
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowMethodModal(false)} className="btn-secondary">Close</button>
                                <button type="submit" className="btn-primary">Add Method</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showReceiptModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card modal-lg">
                        <div className="modal-header">
                            <h2>Receipts for #{selectedFolioId?.toString().padStart(5, '0')}</h2>
                            <button className="close-modal-btn" onClick={() => setShowReceiptModal(false)}>&times;</button>
                        </div>

                        <div className="receipts-container">
                            {receipts.length > 0 ? (
                                receipts.map(receipt => (
                                    <div key={receipt.id} className="receipt-card premium-card">
                                        <div className="receipt-header">
                                            <h2 className="hotel-name">SOLUXE HOTEL</h2>
                                            <p className="receipt-type">Official Payment Receipt</p>
                                        </div>
                                        <div className="receipt-details">
                                            <div className="detail-row">
                                                <span>Receipt No:</span>
                                                <span className="bold">#{receipt.receiptNumber}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span>Date:</span>
                                                <span>{new Date(receipt.issuedAt).toLocaleString()}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span>Folio ID:</span>
                                                <span>#{receipt.folioId.toString().padStart(5, '0')}</span>
                                            </div>
                                            <div className="receipt-total detail-row">
                                                <span className="bold">Amount Paid:</span>
                                                <span className="bold total-amount">KES {receipt.amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="receipt-footer">
                                            <p>Thank you for choosing Soluxe Hotel!</p>
                                            <p className="auth-info">Auth Code: {receipt.paymentId} | Issued by: {receipt.issuedBy}</p>
                                        </div>
                                        <div className="receipt-actions">
                                            <button className="btn-primary print-btn" onClick={handlePrintReceipt}>Print Official Receipt</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-sub-state">
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
