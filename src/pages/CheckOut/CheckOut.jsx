import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Search, FileText, CheckCircle, Printer, X, Wallet, Plus } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';
import { formatDate } from '../../services/formatters';

const CheckOut = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'ROLE_HOTEL_ADMIN' || user?.role === 'HOTEL_ADMIN';
    const { t } = useLanguage();
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

    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        paymentMethodId: '',
        reference: '',
        notes: ''
    });

    // Extension Modal State
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [extensionDate, setExtensionDate] = useState('');
    const [extensionLoading, setExtensionLoading] = useState(false);

    // Override State
    const [overrideNote, setOverrideNote] = useState('');
    const [isManagerOverride, setIsManagerOverride] = useState(false);

    // Post Charge State
    const [chargeTypes, setChargeTypes] = useState([]);
    const [showPostChargeModal, setShowPostChargeModal] = useState(false);
    const [newCharge, setNewCharge] = useState({
        chargeTypeId: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxPct: 0,
        discountPct: 0
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staysRes, guestsRes, roomsRes, paymentMethodsRes, chargeTypesRes] = await Promise.all([
                api.get('/stays/active'),
                api.get('/guests'),
                api.get('/rooms'),
                api.get('/folios/payment-methods'),
                api.get('/charge-types')
            ]);
            
            setStays(staysRes.data);
            setGuests(guestsRes.data);
            setRooms(roomsRes.data);
            setPaymentMethods(paymentMethodsRes.data);
            setChargeTypes(chargeTypesRes.data);
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

    // Using imported formatDate

    const filteredStays = useMemo(() => {
        return stays.filter(stay => {
            const guestName = getGuestName(stay.guestId).toLowerCase();
            const roomNum = getRoomNumber(stay.roomId).toLowerCase();
            const search = searchTerm.toLowerCase();
            return guestName.includes(search) || roomNum.includes(search);
        });
    }, [stays, searchTerm, getGuestName, getRoomNumber]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredStays.length / PAGE_SIZE);
    const paginatedStays = filteredStays.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handleCheckOut = async (stayId, approveAdjustment = false) => {
        if (!approveAdjustment && !window.confirm('Confirm check-out for this guest? Room will be set to DIRTY.')) return;
        try {
            const url = `/stays/${stayId}/check-out?userId=${user?.id || 1}&approveAdjustment=${approveAdjustment}`;
            await api.post(url);
            setShowInvoiceModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to check out:', err);
            const errorMsg = err.response?.data?.message || 'Check-out failed.';
            
            if (errorMsg.includes('Outstanding folio balance') && user?.role === 'ROLE_MANAGER') {
                setIsManagerOverride(true);
            } else {
                alert(errorMsg);
            }
        }
    };

    const handleExtendStay = async (e) => {
        e.preventDefault();
        setExtensionLoading(true);
        try {
            await api.post(`/stays/${selectedStay.id}/extend`, null, {
                params: {
                    newDateOut: extensionDate,
                    userId: user?.id || 1
                }
            });
            setShowExtensionModal(false);
            handleViewInvoice(selectedStay);
            fetchData();
        } catch (err) {
            console.error('Failed to extend stay:', err);
            alert(err.response?.data?.message || 'Extension failed.');
        } finally {
            setExtensionLoading(false);
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
            // Filter out voided charges so they don't inflate the balance
            setCharges(chargesRes.data.filter(c => !c.voided));
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

    const finalBalanceDue = useMemo(() => {
        if (!selectedStay) return 0;
        const totalCharges = charges.reduce((sum, c) => sum + parseFloat(c.totalAmount || 0), 0);
        const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        let adjustment = 0;

        if (new Date(selectedStay.dateOut) > new Date()) {
            const getDays = (d1, d2) => {
                const start = new Date(d1);
                const end = new Date(d2);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                return Math.round((end - start) / (1000 * 60 * 60 * 24));
            };

            let plannedNights = getDays(selectedStay.dateIn, selectedStay.dateOut);
            if (plannedNights < 1) plannedNights = 1;

            let actualNights = getDays(selectedStay.dateIn, new Date());
            if (actualNights < 1) actualNights = 1;

            if (actualNights < plannedNights) {
                const diff = plannedNights - actualNights;
                const roomCharge = charges.find(c => c.description?.includes('Room Charge'));
                const rate = roomCharge ? parseFloat(roomCharge.unitPrice || 0) : 0;
                adjustment = diff * rate;
            }
        }
        return totalCharges - totalPayments - adjustment;
    }, [selectedStay, charges, payments]);

    const handleOpenPaymentModal = () => {
        setPaymentData({
            amount: finalBalanceDue,
            paymentMethodId: paymentMethods[0]?.id || '',
            reference: '',
            notes: ''
        });
        setShowPaymentModal(true);
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                amount: parseFloat(paymentData.amount),
                paymentMethodId: parseInt(paymentData.paymentMethodId, 10),
                referenceNumber: paymentData.reference || null,
            };
            await api.post(`/folios/${folio.id}/payments?userId=${user?.id || 1}`, payload);
            setShowPaymentModal(false);
            // Refresh invoice data
            handleViewInvoice(selectedStay);
        } catch (err) {
            console.error('Failed to record payment:', err);
            alert(err.response?.data?.message || 'Error recording payment.');
        }
    };

    const handleOpenPostCharge = () => {
        setNewCharge({
            chargeTypeId: chargeTypes[0]?.id || '',
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxPct: 0,
            discountPct: 0
        });
        setShowPostChargeModal(true);
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
            await api.post(`/folios/${folio.id}/charges?userId=${user?.id || 1}`, payload);
            setShowPostChargeModal(false);
            // Refresh invoice data
            handleViewInvoice(selectedStay);
        } catch (err) {
            console.error('Failed to post charge:', err);
            alert(err.response?.data?.message || err.response?.data?.error || 'Failed to post charge.');
        }
    };

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder={t('Search by guest name...')} 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-card overflow-hidden">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium">{t('Loading...')}</div>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="management-table" style={{ minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">{t('Room & Guest')}</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">{t('Stay Dates')}</th>
                                    {isAdmin && <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">{t('Audit')}</th>}
                                    <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">{t('Actions')}</th>
                                </tr>
                            </thead>
                        <tbody>
                            {paginatedStays.length > 0 ? (
                                paginatedStays.map((stay) => (
                                    <tr key={stay.id}>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-900 text-sm">{getGuestName(stay.guestId)}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{t('Room')} {getRoomNumber(stay.roomId)}</span>
                                                    <span className="text-[10px] text-slate-400">ID: {stay.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-medium text-slate-700">{formatDate(stay.dateIn)} → <span className={stay.status === 'OVERSTAY' ? 'text-red-600 font-bold' : stay.status === 'DUE_CHECKOUT' ? 'text-amber-600 font-bold' : ''}>{formatDate(stay.dateOut)}</span></span>
                                                {stay.status === 'OVERSTAY' && (
                                                    <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded w-fit uppercase tracking-wider">
                                                        {t('Overdue')}
                                                    </span>
                                                )}
                                                {stay.status === 'DUE_CHECKOUT' && (
                                                    <span className="bg-amber-100 text-amber-600 text-[9px] font-bold px-1.5 py-0.5 rounded w-fit uppercase tracking-wider">
                                                        {t('Due Today')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {isAdmin && (
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-text-slate font-medium">{t('Created')}: <span className="font-bold text-text-dark">{stay.createdBy || '-'}</span></span>
                                                    <span className="text-[10px] text-text-slate font-medium">{t('Modified')}: <span className="font-bold text-text-dark">{stay.modifiedBy || '-'}</span></span>
                                                </div>
                                            </td>
                                        )}
                                        <td>
                                            <div className="table-actions">
                                                <button 
                                                    className="bg-maroon text-white hover:bg-[#6b0f11] px-4 py-2 rounded-lg text-[12px] font-bold transition-all shadow-sm flex items-center gap-2"
                                                    onClick={() => handleViewInvoice(stay)}
                                                >
                                                    <FileText size={14} />
                                                    {t('Folio')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-20 text-slate-400 font-medium italic">
                                        {searchTerm ? t('No reservations found') : t('No guests due for check-out.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                )}
                {!loading && filteredStays.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-white">
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={filteredStays.length}
                            pageSize={PAGE_SIZE}
                        />
                    </div>
                )}
            </div>

            {/* Invoice Folio Modal */}
            <Modal
                isOpen={showInvoiceModal && !!selectedStay}
                onClose={() => setShowInvoiceModal(false)}
                size="none"
                customClasses="!w-[95%] !max-w-[800px] print:!max-w-[100%] print:!mx-auto print:shadow-none print:p-0 print:border-none print:bg-white text-slate-800"
            >
                {selectedStay && (
                    <>
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
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <FileText size={32} className="opacity-20" />
                                </div>
                                <p className="font-semibold">Error compiling Folio for this stay.</p>
                                <button className="mt-6 btn-secondary" onClick={() => setShowInvoiceModal(false)}>Close</button>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full max-h-[70vh] print:max-h-none overflow-hidden pb-4">
                                {/* Scrollable Printable Area */}
                                <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible">
                                    <div className="p-10 print:p-4 bg-white border border-slate-200 rounded-2xl print:border-none shadow-sm print:shadow-none font-['Inter',_sans-serif] text-[11px]">
                                        
                                        {/* Hotel Header */}
                                        <div className="flex flex-col items-center border-b border-slate-100 pb-6 mb-6 print:pb-4 print:mb-4 text-center">
                                            <div className="bg-maroon text-white w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl mb-3 print:mb-2">S</div>
                                            <h1 className="text-2xl print:text-xl font-black tracking-tight text-slate-900 m-0 uppercase">Soluxe Club Hotel</h1>
                                            <p className="text-[10px] print:text-[8px] text-slate-400 mt-2 font-medium max-w-[200px] leading-relaxed">
                                                123 Horizon Avenue, Seaside Plaza<br/>
                                                Tel: +254 700 000 000 | info@soluxe.com
                                            </p>
                                        </div>
                                        
                                        {/* Receipt Meta */}
                                        <div className="flex justify-between items-end mb-8 print:mb-6">
                                            <div>
                                                <h2 className="text-xl font-black text-slate-900 m-0 leading-none">INVOICE</h2>
                                                <p className="text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-widest">#{folio.id.toString().padStart(6, '0')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Date Issued</p>
                                                <p className="font-black text-slate-900 text-[12px] mt-1">{formatDate(new Date())}</p>
                                            </div>
                                        </div>

                                        {/* Guest & Stay Info */}
                                        <div className="grid grid-cols-2 gap-8 mb-8 print:mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex flex-col gap-2">
                                                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Billed To</p>
                                                <p className="font-bold text-[13px] text-slate-900">{getGuestName(selectedStay.guestId)}</p>
                                                <p className="text-slate-500 font-medium">Room {getRoomNumber(selectedStay.roomId)}</p>
                                            </div>
                                            <div className="flex flex-col gap-2 text-right">
                                                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Stay Period</p>
                                                <p className="font-bold text-slate-800">
                                                    {formatDate(selectedStay.dateIn)} — {
                                                        new Date(selectedStay.dateOut) > new Date() 
                                                        ? formatDate(new Date()) + ' (Early)' 
                                                        : formatDate(selectedStay.dateOut)
                                                    }
                                                </p>
                                                <p className="text-slate-500 font-medium">
                                                    Duration: {(() => {
                                                        const getDays = (d1, d2) => {
                                                            const start = new Date(d1);
                                                            const end = new Date(d2);
                                                            start.setHours(0, 0, 0, 0);
                                                            end.setHours(0, 0, 0, 0);
                                                            return Math.round((end - start) / (1000 * 60 * 60 * 24));
                                                        };
                                                        
                                                        const isEarly = new Date(selectedStay.dateOut) > new Date();
                                                        let nights = isEarly 
                                                            ? getDays(selectedStay.dateIn, new Date())
                                                            : getDays(selectedStay.dateIn, selectedStay.dateOut);
                                                        
                                                        // Industry standard: Check-in always bills at least 1 night
                                                        if (nights < 1) nights = 1;
                                                        return nights;
                                                    })()} Night(s)
                                                    {new Date(selectedStay.dateOut) > new Date() && (
                                                        <span className="ml-1 text-[9px] text-amber-600 font-bold uppercase tracking-tighter">(Adjusted)</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Charges Table */}
                                        <div className="mb-8 print:mb-6">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b-2 border-slate-900">
                                                        <th className="py-3 font-black text-slate-900 uppercase tracking-widest text-[10px]">Description</th>
                                                        <th className="py-3 font-black text-slate-900 uppercase tracking-widest text-[10px] text-center w-20">Qty</th>
                                                        <th className="py-3 font-black text-slate-900 uppercase tracking-widest text-[10px] text-right w-32">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {charges.length === 0 ? (
                                                        <tr><td colSpan="3" className="py-2 text-center italic">No charges.</td></tr>
                                                    ) : (
                                                        charges.map(charge => (
                                                            <tr key={charge.id} className="align-top">
                                                                <td className="py-1">
                                                                    <div className="font-bold truncate max-w-[120px] print:max-w-[150px]">{charge.description}</div>
                                                                    <div className="text-[9px] print:text-[8px] text-slate-500">{formatDate(charge.chargedAt)}</div>
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

                                        {/* Payments Table */}
                                        {payments.length > 0 && (
                                            <div className="mb-8 print:mb-6 pt-4">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Payments Received</h3>
                                                <table className="w-full text-left border-collapse">
                                                    <tbody>
                                                        {payments.map(payment => (
                                                            <tr key={payment.id} className="group">
                                                                <td className="py-3 border-b border-slate-50">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 font-bold text-[10px]">
                                                                            {payment.paymentMethodName?.charAt(0) || 'P'}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-slate-800">{payment.paymentMethodName || 'Payment'}</p>
                                                                            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{formatDate(payment.recordedAt)} • {payment.referenceNumber || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 border-b border-slate-50 text-right font-black text-slate-900">
                                                                    -{parseFloat(payment.amount || 0).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Summary Totals */}
                                        <div className="bg-slate-900 text-white rounded-2xl p-6 print:p-4 mt-4">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex justify-between items-center opacity-60 text-[10px] font-bold uppercase tracking-widest">
                                                    <span>Original Charges</span>
                                                    <span>$ {charges.reduce((sum, c) => sum + parseFloat(c.totalAmount || 0), 0).toLocaleString()}</span>
                                                </div>
                                                
                                                {new Date(selectedStay.dateOut) > new Date() && (
                                                    <div className="flex justify-between items-center text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                                                        <span>Early Checkout Project. Credit</span>
                                                        <span>
                                                            -$ {(() => {
                                                                const getDays = (d1, d2) => {
                                                                    const start = new Date(d1);
                                                                    const end = new Date(d2);
                                                                    start.setHours(0, 0, 0, 0);
                                                                    end.setHours(0, 0, 0, 0);
                                                                    return Math.round((end - start) / (1000 * 60 * 60 * 24));
                                                                };

                                                                let plannedNights = getDays(selectedStay.dateIn, selectedStay.dateOut);
                                                                if (plannedNights < 1) plannedNights = 1;

                                                                let actualNights = getDays(selectedStay.dateIn, new Date());
                                                                if (actualNights < 1) actualNights = 1;

                                                                if (actualNights < plannedNights) {
                                                                    const diff = plannedNights - actualNights;
                                                                    const roomCharge = charges.find(c => c.description?.includes('Room Charge'));
                                                                    const rate = roomCharge ? parseFloat(roomCharge.unitPrice || 0) : 0;
                                                                    return (diff * rate).toLocaleString();
                                                                }
                                                                return "0";
                                                            })()}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center opacity-60 text-[10px] font-bold uppercase tracking-widest">
                                                    <span>Total Credits / Payments</span>
                                                    <span>$ {payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toLocaleString()}</span>
                                                </div>
                                                <div className="h-px bg-white/10 my-1"></div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-maroon-light">Final Balance Due</span>
                                                    <span className="text-xl font-black">
                                                        {finalBalanceDue < 0 ? `-$ ${Math.abs(finalBalanceDue).toLocaleString()}` : `$ ${finalBalanceDue.toLocaleString()}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="text-center mt-10 print:mt-8">
                                            <p className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.3em]">Soluxe Signature Service</p>
                                            <div className="flex justify-center gap-4 mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Privacy Policy</span>
                                                <span>•</span>
                                                <span>Terms of Stay</span>
                                                <span>•</span>
                                                <span>Support</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Block */}
                                <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-center print:hidden shrink-0">
                                    <div className="flex gap-2">
                                        <button 
                                            className="btn-secondary !bg-slate-100" 
                                            onClick={handlePrintInvoice}
                                        >
                                            {t('Export')}
                                        </button>
                                        <button 
                                            className="bg-slate-100 text-maroon hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                                            onClick={handleOpenPostCharge}
                                        >
                                            <Plus size={16} /> {t('Post Charge')}
                                        </button>
                                    </div>
                                    
                                    {finalBalanceDue !== 0 ? (
                                        <div className="flex flex-col gap-2 w-full max-w-[400px]">
                                            <div className={`px-4 py-2.5 rounded-lg border flex items-center justify-between gap-3 ${finalBalanceDue > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">Balance must be $ 0 to Check-out.</span>
                                                    {finalBalanceDue < 0 && <span className="text-[10px] font-medium opacity-80">Guest has a credit balance. Issue refund.</span>}
                                                </div>
                                                <button className="bg-maroon text-white hover:bg-maroon/90 px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap" onClick={handleOpenPaymentModal}>
                                                    <Wallet size={12} /> {finalBalanceDue < 0 ? 'Record Refund' : 'Record Payment'}
                                                </button>
                                            </div>
                                            
                                            {isManagerOverride && (
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Manager Override Required</p>
                                                    <textarea 
                                                        className="text-xs w-full p-2 border border-slate-200 rounded"
                                                        placeholder="Reason for checking out with balance..."
                                                        value={overrideNote}
                                                        onChange={e => setOverrideNote(e.target.value)}
                                                    />
                                                    <button 
                                                        className="mt-2 w-full bg-slate-800 text-white py-1.5 rounded text-xs font-bold"
                                                        onClick={() => {
                                                            alert('Override logic implementation would go here (requires backend support for notes)');
                                                            // For now we'll just show the UI
                                                        }}
                                                    >
                                                        Confirm Manager Checkout
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <button 
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold tracking-wide shadow-sm transition-all flex items-center gap-2"
                                                onClick={() => handleCheckOut(selectedStay.id)}
                                            >
                                                {t('Process Check-Out')}
                                            </button>
                                        </div>
                                    )}
                                    
                                    <button 
                                        className="bg-slate-50 text-maroon hover:bg-maroon hover:text-white px-4 py-3 rounded-xl font-bold text-[13px] transition-all flex items-center gap-2 border border-slate-200"
                                        onClick={() => {
                                            setExtensionDate(selectedStay.dateOut.split('T')[0]);
                                            setShowExtensionModal(true);
                                        }}
                                    >
                                        Extend Stay
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Modal>

            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                size="none"
                customClasses="!max-w-[650px] !p-0 overflow-hidden"
                overlayClasses="z-[1100]"
            >
                {selectedStay && (
                    <>
                        <div className="modal-header !p-6 border-b border-slate-100">
                            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-800 m-0">
                                <div className="bg-maroon/10 p-2 rounded-lg">
                                    <Wallet className="text-maroon" size={20} />
                                </div>
                                {paymentData.amount < 0 ? 'Record Refund' : 'Record Folio Payment'}
                            </h2>
                            <button className="close-modal-btn !top-6 !right-6" onClick={() => setShowPaymentModal(false)}>&times;</button>
                        </div>
                        
                        <div className="p-8">
                            {/* Summary Card */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 flex items-center justify-between shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-maroon/20 blur-[60px] rounded-full -mr-10 -mt-10"></div>
                                <div className="flex flex-col relative z-10">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Guest Portfolio</p>
                                    <p className="text-2xl font-black text-white leading-none">{getGuestName(selectedStay?.guestId)}</p>
                                    <p className="text-[11px] text-white/60 font-medium mt-2 flex items-center gap-2">
                                        <span className="bg-white/10 px-2 py-0.5 rounded">Room {getRoomNumber(selectedStay?.roomId)}</span>
                                        <span className="opacity-40">•</span>
                                        <span>Folio #{folio?.id.toString().padStart(5, '0')}</span>
                                    </p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md px-8 py-5 rounded-2xl border border-white/10 text-right relative z-10">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block mb-1">Outstanding Balance</span>
                                    <span className="text-3xl font-black text-white">$ {parseFloat(folio?.totalAmount || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            <form onSubmit={handleRecordPayment} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-group">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block text-left">
                                            {paymentData.amount < 0 ? 'Refund Amount ($)' : 'Payment Amount ($)'}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                            <input 
                                                type="number" step="0.01" required autoFocus
                                                className="w-full !pl-8 !py-3 !rounded-xl !border-slate-200 !text-lg font-black text-slate-900"
                                                value={paymentData.amount} 
                                                onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group text-left">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payment Method</label>
                                        <select 
                                            required 
                                            className="w-full !py-3 !px-4 !rounded-xl !border-slate-200 font-bold text-slate-700 h-[50px] bg-slate-50"
                                            value={paymentData.paymentMethodId} 
                                            onChange={e => setPaymentData({...paymentData, paymentMethodId: e.target.value})}
                                        >
                                            {paymentMethods.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="form-group text-left">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Reference / Receipt Number</label>
                                    <input 
                                        type="text" 
                                        className="w-full !py-3 !px-4 !rounded-xl !border-slate-200 font-semibold"
                                        value={paymentData.reference} 
                                        onChange={e => setPaymentData({...paymentData, reference: e.target.value})} 
                                        placeholder="e.g. M-PESA Code, Receipt ID..." 
                                    />
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPaymentModal(false)} 
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-[2] bg-maroon hover:bg-[#6b0f11] text-white font-black text-lg py-4 rounded-xl shadow-lg shadow-maroon/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Wallet size={18} /> {paymentData.amount < 0 ? 'Process Refund' : 'Record Payment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </Modal>

            {/* Extension Modal */}
            <Modal
                isOpen={showExtensionModal}
                onClose={() => setShowExtensionModal(false)}
                size="none"
                customClasses="!max-w-[600px]"
                overlayClasses="z-[1100]"
            >
                {selectedStay && (
                    <>
                        <div className="modal-header">
                            <h2 className="flex items-center gap-2">
                                <FileText className="text-maroon" /> Extend Stay
                            </h2>
                            <button className="close-modal-btn" onClick={() => setShowExtensionModal(false)}>&times;</button>
                        </div>
                        <div className="p-8">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 flex items-center justify-between shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-maroon/20 blur-[60px] rounded-full -mr-10 -mt-10"></div>
                                <div className="flex flex-col relative z-10">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Current Check-out</p>
                                    <p className="text-3xl font-black text-white leading-none">{formatDate(selectedStay.dateOut)}</p>
                                    <p className="text-[11px] text-white/60 font-medium mt-3">Room {getRoomNumber(selectedStay.roomId)} • {getGuestName(selectedStay.guestId)}</p>
                                </div>
                                <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center relative z-10">
                                    <FileText className="text-maroon-light" size={28} />
                                </div>
                            </div>

                            <form onSubmit={handleExtendStay} className="space-y-8">
                                <div className="form-group">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] mb-3 block">New Departure Date</label>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            required
                                            min={selectedStay.dateOut.split('T')[0]}
                                            className="w-full !py-4 !px-6 !rounded-2xl !border-slate-200 !text-lg font-black text-slate-900 focus:!border-maroon transition-all shadow-sm"
                                            value={extensionDate}
                                            onChange={e => setExtensionDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-start gap-3 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="w-5 h-5 bg-maroon/10 rounded-full flex items-center justify-center text-maroon shrink-0 mt-0.5">
                                            <span className="font-bold text-[10px]">i</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                                            Extending the stay will automatically post room charges for the added nights based on the current nightly rate.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowExtensionModal(false)} 
                                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-[2] bg-maroon hover:bg-[#6b0f11] text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-maroon/20 transition-all flex items-center justify-center gap-2"
                                        disabled={extensionLoading}
                                    >
                                        {extensionLoading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Processing...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <CheckCircle size={20} /> Confirm Extension
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </Modal>
            {/* Post Charge Modal */}
            <Modal
                isOpen={showPostChargeModal}
                onClose={() => setShowPostChargeModal(false)}
                title={<span className="flex items-center gap-2"><Plus className="text-maroon" /> Post Charge to #{folio?.id?.toString().padStart(5, '0')}</span>}
                size="md"
                customClasses="!w-[85%] !max-w-[700px]"
            >
                <form onSubmit={handlePostCharge}>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>{t('Charge Type')}</label>
                            <select required value={newCharge.chargeTypeId} onChange={(e) => setNewCharge({...newCharge, chargeTypeId: e.target.value})}>
                                <option value="">{t('Select Charge Type')}</option>
                                {chargeTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group full-width">
                            <label>{t('Description')}</label>
                            <input type="text" required value={newCharge.description} onChange={(e) => setNewCharge({...newCharge, description: e.target.value})} placeholder="e.g. Minibar, Restaurant" />
                        </div>
                        <div className="form-group">
                            <label>{t('Quantity')}</label>
                            <input type="number" step="0.01" required value={newCharge.quantity} onChange={(e) => setNewCharge({...newCharge, quantity: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="form-group">
                            <label>{t('Unit Price ($)')}</label>
                            <input type="number" step="0.01" required value={newCharge.unitPrice} onChange={(e) => setNewCharge({...newCharge, unitPrice: parseFloat(e.target.value) || 0})} />
                        </div>
                    </div>
                    <div className="modal-footer mt-6">
                        <button type="button" onClick={() => setShowPostChargeModal(false)} className="btn-secondary !px-8">{t('Cancel')}</button>
                        <button type="submit" className="btn-primary !px-8">{t('Submit Charge')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CheckOut;
