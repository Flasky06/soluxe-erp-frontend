import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
    Search, Filter, Bed, Utensils, Calendar, User, 
    ChevronRight, MoreVertical, CheckCircle2, 
    LogOut, AlertCircle, Clock, Wallet, Edit, UserX, XCircle, CreditCard,
    Plus, Receipt, Loader2
} from 'lucide-react';
import GuestForm from '../../components/GuestForm/GuestForm';

const Reservations = () => {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState([]);
    const [guests, setGuests] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showQuickGuestModal, setShowQuickGuestModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [actionReservation, setActionReservation] = useState(null);
    const [activeFolio, setActiveFolio] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        paymentMethodId: '',
        reference: '',
        notes: ''
    });

    const [formData, setFormData] = useState({
        guestId: '',
        bookingType: 'ROOM',
        roomTypeId: '',
        dateIn: '',
        dateOut: '',
        adults: 1,
        children: 0,
        tableId: '',
        tableReservationTime: '',
        tablePax: 1,
        nationality: '',
        idType: 'PASSPORT',
        idNumber: '',
        eta: '14:00',
        etd: '11:00',
        specialRequests: '',
        preferences: '',
        vehicleRegistration: '',
        emergencyContactName: '',
        emergencyContactPhone: ''
    });

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [resResponse, guestsResponse, typesResponse, tablesResponse, paymentMethodsRes] = await Promise.all([
                api.get('/reservations'),
                api.get('/guests'),
                api.get('/room-types'),
                api.get('/restaurant-tables'),
                api.get('/folios/payment-methods')
            ]);
            setReservations(resResponse.data);
            setGuests(guestsResponse.data);
            setRoomTypes(typesResponse.data);
            setTables(tablesResponse.data);
            setPaymentMethods(paymentMethodsRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAllData(); }, []);

    const handleGuestChange = (guestId) => {
        const guest = guests.find(g => g.id === parseInt(guestId));
        if (guest) {
            setFormData({
                ...formData,
                guestId: parseInt(guestId),
                nationality: guest.nationality || '',
                idType: guest.idType || 'PASSPORT',
                idNumber: guest.idNumber || '',
                preferences: guest.preferences || '',
                vehicleRegistration: guest.vehicleRegistration || '',
                emergencyContactName: guest.emergencyContactName || '',
                emergencyContactPhone: guest.emergencyContactPhone || ''
            });
        }
    };

    const handleOpenBookingModal = (res = null) => {
        if (res) {
            setSelectedReservation(res);
            let bType = 'ROOM';
            if (res.roomId || res.roomTypeId) bType = 'ROOM';
            if (res.tableId) bType = bType === 'ROOM' ? 'BOTH' : 'TABLE';
            setFormData({
                guestId: res.guestId,
                bookingType: bType,
                roomTypeId: res.roomTypeId || '',
                dateIn: res.dateIn || '',
                dateOut: res.dateOut || '',
                adults: res.adults || 1,
                children: res.children || 0,
                tableId: res.tableId || '',
                tableReservationTime: res.tableReservationTime ? res.tableReservationTime.substring(0, 16) : '',
                tablePax: res.tablePax || 1,
                nationality: res.nationality || '',
                idType: res.idType || 'PASSPORT',
                idNumber: res.idNumber || '',
                eta: res.eta || '14:00',
                etd: res.etd || '11:00',
                specialRequests: res.specialRequests || '',
                preferences: res.preferences || '',
                vehicleRegistration: res.vehicleRegistration || '',
                emergencyContactName: res.emergencyContactName || '',
                emergencyContactPhone: res.emergencyContactPhone || ''
            });
        } else {
            setSelectedReservation(null);
            setFormData({
                guestId: '',
                bookingType: 'ROOM',
                roomTypeId: '',
                dateIn: '',
                dateOut: '',
                adults: 1,
                children: 0,
                tableId: '',
                tableReservationTime: '',
                tablePax: 1,
                nationality: '',
                idType: 'PASSPORT',
                idNumber: '',
                eta: '14:00',
                etd: '11:00',
                specialRequests: '',
                preferences: '',
                vehicleRegistration: '',
                emergencyContactName: '',
                emergencyContactPhone: ''
            });
        }
        setShowBookingModal(true);
    };

    const handleOpenPaymentModal = async (res) => {
        try {
            const folioRes = await api.get(`/folios/reservation/${res.id}`);
            setActiveFolio(folioRes.data);
            setSelectedReservation(res);
            setPaymentData({
                amount: '',
                paymentMethodId: paymentMethods[0]?.id || '',
                reference: '',
                notes: ''
            });
            setShowPaymentModal(true);
        } catch (err) {
            console.error('Failed to fetch folio:', err);
            alert('Could not initialize payment.');
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!activeFolio) return;
        try {
            await api.post(`/folios/${activeFolio.id}/payments?userId=${1}`, paymentData);
            setShowPaymentModal(false);
            alert('Payment recorded successfully!');
            fetchAllData();
        } catch (err) {
            console.error('Failed to record payment:', err);
            alert('Error recording payment.');
        }
    };

    const handleOpenManageModal = async (res) => {
        setActionReservation(res);
        setActiveFolio(null);
        setShowActionModal(true);
    };


    const handleSubmitBooking = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                guestId: parseInt(formData.guestId) || 0,
                roomTypeId: formData.roomTypeId ? parseInt(formData.roomTypeId) : null,
                tableId: formData.tableId ? parseInt(formData.tableId) : null,
                adults: parseInt(formData.adults) || 1,
                children: parseInt(formData.children) || 0,
                tablePax: parseInt(formData.tablePax) || 1
            };
            if (formData.bookingType === 'ROOM') {
                payload.tableId = null;
                payload.tableReservationTime = null;
            } else if (formData.bookingType === 'TABLE') {
                payload.roomTypeId = null;
                payload.dateIn = null;
                payload.dateOut = null;
            }
            if (selectedReservation) {
                await api.put(`/reservations/${selectedReservation.id}`, payload);
            } else {
                await api.post('/reservations', { ...payload, status: 'BOOKED' });
            }
            setShowBookingModal(false);
            fetchAllData();
        } catch (err) {
            console.error('Failed to save booking:', err);
        }
    };

    const handleCancelBooking = async (id) => {
        if (window.confirm('Cancel this booking?')) {
            try {
                await api.post(`/reservations/${id}/cancel`);
                fetchAllData();
            } catch (err) {
                console.error('Failed to cancel:', err);
            }
        }
    };

    const handleMarkNoShow = async (id) => {
        if (window.confirm('Mark this guest as No-Show? The room will be released.')) {
            try {
                await api.post(`/stays/reservations/${id}/no-show?userId=${1}`);
                fetchAllData();
            } catch (err) {
                console.error('Failed to mark no-show:', err);
                alert('No-show update failed.');
            }
        }
    };

    const getStatusInfo = (status) => {
        switch(status?.toUpperCase()) {
            case 'BOOKED': return { icon: null, class: 'booked', label: 'Confirmed' };
            case 'CHECKED_IN': return { icon: null, class: 'checked_in', label: 'In-House' };
            case 'DUE_CHECKOUT': return { icon: null, class: 'due_checkout', label: 'Due Checkout' };
            case 'OVERSTAY': return { icon: null, class: 'overstay', label: 'Overstay' };
            case 'CHECKED_OUT': return { icon: null, class: 'checked_out', label: 'Completed' };
            case 'CANCELLED': return { icon: null, class: 'cancelled', label: 'Cancelled' };
            default: return { icon: null, class: '', label: status || 'UNKNOWN' };
        }
    };

    const getGuest = (id) => guests.find(g => g.id === id) || { fullName: `Guest ${id}`, email: '' };
    const getRoomTypeName = (id) => roomTypes.find(t => t.id === id)?.name || '-';
    const getTableName = (id) => tables.find(t => t.id === id)?.tableName || '-';

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Filtering logic
    const filteredReservations = reservations.filter(res => {
        const guest = getGuest(res.guestId);
        const matchesSearch = guest.fullName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || res.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: reservations.length,
        booked: reservations.filter(r => r.status === 'BOOKED').length,
        inHouse: reservations.filter(r => r.status === 'CHECKED_IN').length,
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header & New Action */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-xl font-bold text-slate-800">Reservations</h1>
                <button className="btn-primary flex items-center gap-2 h-11 w-full sm:w-auto justify-center" onClick={() => handleOpenBookingModal()}>
                    <span>+ New Reservation</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="premium-card p-5 border-l-4 border-l-maroon flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bookings</p>
                        <h3 className="text-2xl font-black text-text-dark mt-1">{stats.total}</h3>
                    </div>
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                        <Calendar size={20} />
                    </div>
                </div>
                <div className="premium-card p-5 border-l-4 border-l-blue-500 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Arrivals</p>
                        <h3 className="text-2xl font-black text-text-dark mt-1">{stats.booked}</h3>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                        <Clock size={20} />
                    </div>
                </div>
                <div className="premium-card p-5 border-l-4 border-l-emerald-500 flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In-House Now</p>
                        <h3 className="text-2xl font-black text-text-dark mt-1">{stats.inHouse}</h3>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                        <User size={20} />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="premium-card px-5 py-4 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-maroon transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by guest name..." 
                        className="w-full pl-11 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-maroon/10 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold whitespace-nowrap px-2">
                        <Filter size={16} /> Filter:
                    </div>
                    <select 
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-maroon/10 outline-none cursor-pointer hover:border-slate-300 transition-all w-full md:w-[160px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Status</option>
                        <option value="BOOKED">Pending</option>
                        <option value="CHECKED_IN">In-House</option>
                        <option value="CHECKED_OUT">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Main Table */}
            <div className="premium-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100">Guest</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100">Type & Info</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100">Schedule</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-8">
                                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredReservations.length > 0 ? (
                                filteredReservations.map((res) => {
                                    const guest = getGuest(res.guestId);
                                    const sInfo = getStatusInfo(res.status);
                                    return (
                                        <tr key={res.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-maroon/10 group-hover:text-maroon transition-all">
                                                        {getInitials(guest.fullName)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-text-dark">{guest.fullName}</p>
                                                        <p className="text-[11px] text-text-slate">{guest.email || 'No email provided'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    {res.roomTypeId && (
                                                        <div className="flex items-center gap-2 text-[12px] text-text-dark font-medium leading-none">
                                                            <span className="font-bold">Room:</span>
                                                            <span>{getRoomTypeName(res.roomTypeId)} ({res.adults}A, {res.children}C)</span>
                                                        </div>
                                                    )}
                                                    {res.tableId && (
                                                        <div className="flex items-center gap-2 text-[12px] text-text-dark font-medium leading-none">
                                                            <span className="font-bold">Table:</span>
                                                            <span>{getTableName(res.tableId)} ({res.tablePax} Pax)</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {res.dateIn ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-[14px] font-bold text-slate-800 leading-none">{new Date(res.dateIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                                            <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold text-center">In</span>
                                                        </div>
                                                        <span className="text-slate-300 font-bold leading-none">-</span>
                                                        <div className="flex flex-col">
                                                            <span className="text-[14px] font-bold text-slate-800 leading-none">{new Date(res.dateOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                                            <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold text-center">Out</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-[14px] font-bold text-slate-800 leading-none">
                                                        {res.tableReservationTime ? new Date(res.tableReservationTime).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`status-badge ${sInfo.class} flex items-center justify-center min-w-[100px] h-7`}>
                                                    {sInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    {res.status === 'BOOKED' ? (
                                                        <button 
                                                            className="btn-primary !py-1.5 !px-4 flex items-center gap-2 text-xs uppercase tracking-widest font-black shadow-md shadow-maroon/20 hover:shadow-lg hover:shadow-maroon/30 transition-all" 
                                                            onClick={() => handleOpenManageModal(res)}
                                                        >
                                                            Manage
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                                                            onClick={() => handleOpenManageModal(res)}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center">
                                                <Search size={32} />
                                            </div>
                                            <div>
                                                <p className="text-md font-bold text-text-dark">No reservations found</p>
                                                <p className="text-sm text-text-slate">Try adjusting your filters or search query.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="modal-overlay">
                    <div className="modal-content !w-[95%] !max-w-[1000px] !p-0">
                        <div className="modal-header">
                            <h2>{selectedReservation ? 'Modify Reservation' : 'Create New Booking'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowBookingModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmitBooking}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="mb-0">Select Guest</label>
                                        <button 
                                            type="button" 
                                            className="text-primary text-[11px] font-bold hover:underline"
                                            onClick={() => setShowQuickGuestModal(true)}
                                        >
                                            + New Guest
                                        </button>
                                    </div>
                                    <select
                                        required
                                        value={formData.guestId}
                                        onChange={(e) => handleGuestChange(e.target.value)}
                                        disabled={!!selectedReservation}
                                    >
                                        <option value="">-- Search for a Guest --</option>
                                        {guests.map(guest => (
                                            <option key={guest.id} value={guest.id}>{guest.fullName} ({guest.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label>Booking Type</label>
                                    <div className="flex flex-wrap gap-6 md:gap-10 mt-2">
                                        <label className="flex items-center gap-2.5 cursor-pointer text-[14px] font-bold text-text-dark">
                                            <input type="radio" value="ROOM" checked={formData.bookingType === 'ROOM'} onChange={(e) => setFormData({...formData, bookingType: e.target.value})} className="w-4 h-4 accent-maroon" /> Room Only
                                        </label>
                                        <label className="flex items-center gap-2.5 cursor-pointer text-[14px] font-bold text-text-dark">
                                            <input type="radio" value="TABLE" checked={formData.bookingType === 'TABLE'} onChange={(e) => setFormData({...formData, bookingType: e.target.value})} className="w-4 h-4 accent-maroon" /> Table Only
                                        </label>
                                        <label className="flex items-center gap-2.5 cursor-pointer text-[14px] font-bold text-text-dark">
                                            <input type="radio" value="BOTH" checked={formData.bookingType === 'BOTH'} onChange={(e) => setFormData({...formData, bookingType: e.target.value})} className="w-4 h-4 accent-maroon" /> Both
                                        </label>
                                    </div>
                                </div>

                                {(formData.bookingType === 'ROOM' || formData.bookingType === 'BOTH') && (
                                    <>
                                        <div className="form-section-title">Stay Configuration</div>
                                        <div className="form-group">
                                            <label>Room Category</label>
                                            <select required={formData.bookingType !== 'TABLE'} value={formData.roomTypeId} onChange={(e) => setFormData({...formData, roomTypeId: parseInt(e.target.value)})}>
                                                <option value="">-- Select Type --</option>
                                                {roomTypes.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name} (${type.defaultRate}/night)</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Occupancy (Adults / Kids)</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="number" min="1" required value={formData.adults} onChange={(e) => setFormData({...formData, adults: e.target.value})} />
                                                <input type="number" min="0" value={formData.children} onChange={(e) => setFormData({...formData, children: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Check-in</label>
                                            <input type="date" required={formData.bookingType !== 'TABLE'} value={formData.dateIn} onChange={(e) => setFormData({...formData, dateIn: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Check-out</label>
                                            <input type="date" required={formData.bookingType !== 'TABLE'} value={formData.dateOut} onChange={(e) => setFormData({...formData, dateOut: e.target.value})} />
                                        </div>
                                    </>
                                )}

                                {(formData.bookingType === 'TABLE' || formData.bookingType === 'BOTH') && (
                                    <>
                                        <div className="form-section-title">Dining Reservation</div>
                                        <div className="form-group">
                                            <label>Table Assignment</label>
                                            <select required={formData.bookingType !== 'ROOM'} value={formData.tableId} onChange={(e) => setFormData({...formData, tableId: parseInt(e.target.value)})}>
                                                <option value="">-- Choose Table --</option>
                                                {tables.map(table => (
                                                    <option key={table.id} value={table.id}>{table.tableName} ({table.location}) - Capacity {table.capacity}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Dining Time</label>
                                            <input type="datetime-local" required={formData.bookingType !== 'ROOM'} value={formData.tableReservationTime} onChange={(e) => setFormData({...formData, tableReservationTime: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Table Pax</label>
                                            <input type="number" min="1" required={formData.bookingType !== 'ROOM'} value={formData.tablePax} onChange={(e) => setFormData({...formData, tablePax: e.target.value})} />
                                        </div>
                                    </>
                                )}

                                <div className="form-section-title">Notes & Requests</div>
                                <div className="form-group full-width">
                                    <textarea 
                                        value={formData.specialRequests} 
                                        onChange={(e) => setFormData({...formData, specialRequests: e.target.value})} 
                                        className="min-h-[100px]" 
                                        placeholder="Enter any guest requests or preferences..." 
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowBookingModal(false)} className="btn-secondary">Discard</button>
                                <button type="submit" className="btn-primary !px-12">{selectedReservation ? 'Update Booking' : 'Confirm Reservation'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Quick Guest Registration Modal */}
            {showQuickGuestModal && (
                <div className="modal-overlay z-[2000]">
                    <div className="modal-content premium-card !w-[85%] !max-w-[1000px] !p-0">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-text-dark leading-tight">Quick Register Guest</h2>
                            <button className="close-modal-btn" onClick={() => setShowQuickGuestModal(false)}>&times;</button>
                        </div>
                        <GuestForm 
                            onSuccess={(newGuest) => {
                                setGuests(prev => [...prev, newGuest]);
                                setFormData(prev => ({ ...prev, guestId: newGuest.id }));
                                setShowQuickGuestModal(false);
                            }} 
                            onCancel={() => setShowQuickGuestModal(false)} 
                        />
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="modal-overlay">
                    <div className="modal-content !w-[95%] !max-w-[450px]">
                        <div className="modal-header">
                            <h2 className="flex items-center gap-2">
                                <Wallet className="text-maroon" /> Record Payment
                            </h2>
                            <button className="close-modal-btn" onClick={() => setShowPaymentModal(false)}>&times;</button>
                        </div>
                        <div className="p-4 bg-maroon/5 rounded-xl mb-6">
                            <p className="text-[11px] font-bold text-maroon uppercase tracking-widest">Reservation For</p>
                            <p className="text-lg font-black text-text-dark">{getGuest(selectedReservation?.guestId).fullName}</p>
                            <div className="flex justify-between mt-2 pt-2 border-t border-maroon/10">
                                <span className="text-xs font-bold text-slate-500 uppercase">Current Balance</span>
                                <span className="text-sm font-black text-slate-900">$ {parseFloat(activeFolio?.totalAmount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                        <form onSubmit={handleRecordPayment}>
                            <div className="flex flex-col gap-4">
                                <div className="form-group">
                                    <label>Amount to Pay ($)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        autoFocus
                                        value={paymentData.amount} 
                                        onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select 
                                        required 
                                        value={paymentData.paymentMethodId} 
                                        onChange={(e) => setPaymentData({...paymentData, paymentMethodId: e.target.value})}
                                    >
                                        {paymentMethods.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Reference (Receipt/Transaction ID)</label>
                                    <input 
                                        type="text" 
                                        value={paymentData.reference} 
                                        onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                                        placeholder="Optional reference"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Notes</label>
                                    <textarea 
                                        value={paymentData.notes} 
                                        onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                                        className="min-h-[60px]"
                                        placeholder="Additional details..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer !mt-8">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Record Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Action Modal */}
            {showActionModal && actionReservation && (
                <div className="modal-overlay z-[2000]">
                    <div className="modal-content !w-[90%] !max-w-[400px]">
                        <div className="modal-header border-b border-slate-100 pb-4 mb-4">
                            <div>
                                <h2 className="text-lg font-black text-slate-800">Manage Booking</h2>
                                <p className="text-xs font-bold text-slate-400">Guest: {getGuest(actionReservation.guestId).fullName}</p>
                            </div>
                            <button className="close-modal-btn bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors" onClick={() => setShowActionModal(false)}>&times;</button>
                        </div>
                        <div className="flex flex-col gap-3">
                            {actionReservation.status === 'BOOKED' && (
                                <button 
                                    className="w-full flex items-center justify-between p-4 bg-maroon text-white border border-maroon hover:bg-[#6b0f11] rounded-xl transition-all shadow-md group"
                                    onClick={() => {
                                        setShowActionModal(false);
                                        navigate(`/check-in?resId=${actionReservation.id}`);
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                            <LogOut size={18} className="rotate-180" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold">Check-In Guest</span>
                                            <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">Start Stay #Today</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-white/50" />
                                </button>
                            )}
                            <button 
                                className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 hover:border-maroon/30 hover:bg-maroon/5 rounded-xl transition-all group"
                                onClick={() => {
                                    setShowActionModal(false);
                                    handleOpenPaymentModal(actionReservation);
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                        <CreditCard size={18} />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-slate-800">Receive Payment</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Add to Folio</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-maroon transition-colors" />
                            </button>

                            <button 
                                className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all group"
                                onClick={() => {
                                    setShowActionModal(false);
                                    handleOpenBookingModal(actionReservation);
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <Edit size={18} />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-slate-800">Edit Details</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Modify Booking</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </button>

                            <button 
                                className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50 rounded-xl transition-all group"
                                onClick={() => {
                                    setShowActionModal(false);
                                    handleMarkNoShow(actionReservation.id);
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                        <UserX size={18} />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-slate-800">Mark No-Show</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Release Room/Table</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                            </button>

                            <button 
                                className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 rounded-xl transition-all group"
                                onClick={() => {
                                    setShowActionModal(false);
                                    handleCancelBooking(actionReservation.id);
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                        <XCircle size={18} />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-slate-800">Cancel Booking</span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Void Reservation</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-red-500 transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Reservations;
