import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Search, FileText, CheckCircle, Printer, X } from 'lucide-react';
const CheckOut = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [stays, setStays] = useState([]);
    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');

    // Invoice Modal State
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedStay, setSelectedStay] = useState(null);
    const [folio, setFolio] = useState(null);
    const [charges, setCharges] = useState([]);
    const [payments, setPayments] = useState([]);
    const [invoiceLoading, setInvoiceLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staysRes, guestsRes, roomsRes] = await Promise.all([
                api.get('/stays'),
                api.get('/guests'),
                api.get('/rooms')
            ]);
            
            // Filter only active stays
            const activeStays = staysRes.data.filter(s => s.status === 'ACTIVE');
            setStays(activeStays);
            setGuests(guestsRes.data);
            setRooms(roomsRes.data);
        } catch (err) {
            console.error('Failed to fetch check-out data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getGuestName = useCallback((guestId) => {
        const guest = guests.find(g => g.id === guestId);
        return guest ? guest.fullName : `-`;
    }, [guests]);

    const getRoomNumber = useCallback((roomId) => {
        const room = rooms.find(r => r.id === roomId);
        return room ? room.roomNumber : '-';
    }, [rooms]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const filteredStays = useMemo(() => {
        return stays.filter(stay => {
            const guestName = getGuestName(stay.guestId).toLowerCase();
            const roomNum = getRoomNumber(stay.roomId).toLowerCase();
            const search = searchTerm.toLowerCase();
            return guestName.includes(search) || roomNum.includes(search);
        });
    }, [stays, searchTerm, getGuestName, getRoomNumber]);

    const handleCheckOut = async (stayId) => {
        if (!window.confirm('Confirm check-out for this guest? Room will be set to DIRTY.')) return;
        try {
            await api.post(`/stays/${stayId}/check-out?userId=${user?.id || 1}`);
            setShowInvoiceModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to check out:', err);
            alert(err.response?.data?.message || 'Check-out failed.');
        }
    };

    const handleViewInvoice = async (stay) => {
        setSelectedStay(stay);
        setShowInvoiceModal(true);
        setInvoiceLoading(true);
        try {
            const folioRes = await api.get(`/folios/stay/${stay.id}`);
            const folioData = folioRes.data;
            setFolio(folioData);

            const [chargesRes, paymentsRes] = await Promise.all([
                api.get(`/folios/${folioData.id}/charges`),
                api.get(`/folios/${folioData.id}/payments`)
            ]);
            setCharges(chargesRes.data);
            setPayments(paymentsRes.data);
        } catch (err) {
            console.error('Failed to load invoice details:', err);
        } finally {
            setInvoiceLoading(false);
        }
    };

    const handlePrintInvoice = () => {
        window.print();
    };


    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search Guest or Room..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-card">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium">Loading active stays...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Room</th>
                                <th style={{ width: '30%' }}>Guest</th>
                                <th style={{ width: '15%' }}>Date In</th>
                                <th style={{ width: '15%' }}>Expected Out</th>
                                <th style={{ width: '15%' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStays.length > 0 ? (
                                filteredStays.map((stay) => (
                                    <tr key={stay.id}>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">Room {getRoomNumber(stay.roomId)}</span>
                                                <span className="text-[11px] text-slate-500">ID: {stay.id}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="font-semibold text-slate-800">{getGuestName(stay.guestId)}</span>
                                        </td>
                                        <td>{formatDate(stay.dateIn)}</td>
                                        <td>{formatDate(stay.dateOut)}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button 
                                                    className="bg-maroon text-white hover:bg-[#6b0f11] px-4 py-2 rounded-lg text-[12px] font-bold transition-all shadow-sm flex items-center gap-2"
                                                    onClick={() => handleViewInvoice(stay)}
                                                >
                                                    <FileText size={14} />
                                                    View Folio
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-20 text-slate-400 font-medium italic">
                                        {searchTerm ? 'No guests match your search.' : 'All guests have been checked out.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Invoice Folio Modal */}
            {showInvoiceModal && selectedStay && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[95%] !max-w-[800px] print:!max-w-[300px] print:!mx-auto print:shadow-none print:p-0 print:border-none print:bg-white text-slate-800">
                        <div className="modal-header print:hidden pb-4 mb-4 border-b border-slate-200">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Folio & Check-out</h2>
                                <p className="text-sm text-text-slate mt-0.5">Review charges and process final checkout.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowInvoiceModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        {invoiceLoading ? (
                            <div className="text-center py-20 text-slate-500 animate-pulse">Loading Folio details...</div>
                        ) : !folio ? (
                            <div className="text-center py-20 text-red-500">
                                <p>Error compiling Folio for this stay.</p>
                                <button className="mt-4 btn-primary" onClick={() => setShowInvoiceModal(false)}>Close</button>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full max-h-[70vh] print:max-h-none overflow-hidden pb-4">
                                {/* Scrollable Printable Area */}
                                <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible">
                                    <div className="p-8 print:p-0 bg-white border border-slate-200 rounded-xl print:border-none shadow-sm print:shadow-none">
                                        
                                        {/* Hotel Header - Thermal Format */}
                                        <div className="flex flex-col items-center border-b border-dashed border-slate-400 pb-4 mb-4 print:pb-2 print:mb-2 text-center">
                                            <h1 className="text-2xl print:text-xl font-extrabold tracking-widest text-slate-900 m-0">SOLUXE</h1>
                                            <p className="font-bold text-slate-800 uppercase text-[12px] print:text-[10px] tracking-widest mt-1">HOTEL</p>
                                            <p className="text-[11px] print:text-[9px] text-slate-600 mt-2 font-mono">123 Horizon Ave, Seaside<br/>info@soluxe.com<br/>+254 700 000 000</p>
                                        </div>
                                        
                                        {/* Receipt Meta */}
                                        <div className="text-center mb-6 print:mb-4 border-b border-dashed border-slate-400 pb-4 print:pb-2">
                                            <h2 className="text-lg print:text-base font-bold text-slate-800 uppercase tracking-widest m-0">GUEST FOLIO</h2>
                                            <p className="font-mono text-[11px] print:text-[9px] text-slate-600 mt-1">Folio #{folio.id.toString().padStart(5, '0')} | {new Date().toLocaleDateString()}</p>
                                        </div>

                                        {/* Guest Details - Thermal Format */}
                                        <div className="mb-6 print:mb-4 border-b border-dashed border-slate-400 pb-4 print:pb-2 font-mono text-[11px] print:text-[9px]">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold">Guest:</span>
                                                <span className="text-right">{getGuestName(selectedStay.guestId)}</span>
                                            </div>
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold">Room:</span>
                                                <span>{getRoomNumber(selectedStay.roomId)}</span>
                                            </div>
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold">Check-in:</span>
                                                <span>{new Date(selectedStay.dateIn).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-bold">Check-out:</span>
                                                <span>{new Date(selectedStay.dateOut).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* Charges Table - Thermal Format */}
                                        <div className="mb-6 print:mb-4 font-mono">
                                            <h3 className="text-[12px] font-bold text-center border-b border-slate-800 pb-1 mb-2 uppercase">Charges</h3>
                                            <table className="w-full text-left border-collapse text-[11px] print:text-[9px]">
                                                <thead>
                                                    <tr className="border-b border-slate-300">
                                                        <th className="py-1 font-bold">Item</th>
                                                        <th className="py-1 text-center w-[30px]">Qty</th>
                                                        <th className="py-1 text-right w-[60px]">Amt</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {charges.length === 0 ? (
                                                        <tr><td colSpan="3" className="py-2 text-center italic">No charges.</td></tr>
                                                    ) : (
                                                        charges.map(charge => (
                                                            <tr key={charge.id} className="align-top">
                                                                <td className="py-1">
                                                                    <div className="font-bold truncate max-w-[120px] print:max-w-[150px]">{charge.description}</div>
                                                                    <div className="text-[9px] print:text-[8px] text-slate-500">{new Date(charge.chargedAt).toLocaleDateString()}</div>
                                                                </td>
                                                                <td className="py-1 text-center">{charge.quantity}</td>
                                                                <td className="py-1 text-right font-bold">
                                                                    {parseFloat(charge.totalAmount || 0).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Payments Table - Thermal Format */}
                                        {payments.length > 0 && (
                                            <div className="mb-6 print:mb-4 font-mono">
                                                <h3 className="text-[12px] font-bold text-center border-b border-slate-800 pb-1 mb-2 uppercase">Payments</h3>
                                                <table className="w-full text-left border-collapse text-[11px] print:text-[9px]">
                                                    <tbody>
                                                        {payments.map(payment => (
                                                            <tr key={payment.id} className="align-top">
                                                                <td className="py-1 text-slate-600">
                                                                    <div>{new Date(payment.recordedAt).toLocaleDateString()}</div>
                                                                    <div className="text-[9px] print:text-[8px]">{payment.referenceNumber || 'Cash/Card'}</div>
                                                                </td>
                                                                <td className="py-1 text-right font-bold">
                                                                    -{parseFloat(payment.amount || 0).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Totals - Thermal Format */}
                                        <div className="border-t border-dashed border-slate-400 pt-2 font-mono text-[11px] print:text-[10px]">
                                            <div className="flex justify-between py-1">
                                                <span>Subtotal:</span>
                                                <span className="font-bold">{charges.reduce((sum, c) => sum + parseFloat(c.totalAmount || 0), 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between py-1">
                                                <span>Paid:</span>
                                                <span className="font-bold border-b border-slate-800 border-solid pb-1">-{payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between py-2 text-[14px] print:text-[12px] font-extrabold mt-1">
                                                <span>DUE:</span>
                                                <span>KSh {parseFloat(folio.totalAmount || 0).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Footer - Thermal Format */}
                                        <div className="text-center mt-6 print:mt-4 text-[10px] print:text-[8px] font-mono border-t border-dashed border-slate-400 pt-4 print:pt-2">
                                            Thank you for staying at<br/><span className="font-bold">Soluxe Hotel</span><br/>Have a safe journey!
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Block */}
                                <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-center print:hidden shrink-0">
                                    <button 
                                        className="btn-secondary !bg-slate-100" 
                                        onClick={handlePrintInvoice}
                                    >
                                        Print Invoice
                                    </button>
                                    
                                    {folio.totalAmount > 0 ? (
                                        <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-lg border border-red-100 flex items-center gap-3">
                                            <span className="text-sm font-bold">Balance must be KSh 0 to Check-out.</span>
                                            <button className="bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 px-3 py-1 rounded text-xs font-bold transition-all" onClick={() => {setShowInvoiceModal(false); navigate('/folios'); }}>
                                                Go to Folio Billing
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold tracking-wide shadow-sm transition-all flex items-center gap-2"
                                            onClick={() => handleCheckOut(selectedStay.id)}
                                        >
                                            Confirm Check-out
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckOut;
