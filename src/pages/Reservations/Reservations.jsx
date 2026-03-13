import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    Search, Filter, Bed, Utensils, Calendar, User, 
    ChevronRight, MoreVertical, CheckCircle2, 
    LogOut, AlertCircle, Clock
} from 'lucide-react';

const Reservations = () => {
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
    const [selectedReservation, setSelectedReservation] = useState(null);

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
            const [resResponse, guestsResponse, typesResponse, tablesResponse] = await Promise.all([
                api.get('/reservations'),
                api.get('/guests'),
                api.get('/room-types'),
                api.get('/restaurant-tables')
            ]);
            setReservations(resResponse.data);
            setGuests(guestsResponse.data);
            setRoomTypes(typesResponse.data);
            setTables(tablesResponse.data);
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

    const getStatusInfo = (status) => {
        switch(status?.toUpperCase()) {
            case 'BOOKED': return { icon: <Clock className="w-3.5 h-3.5" />, class: 'booked', label: 'Confirmed' };
            case 'CHECKED_IN': return { icon: <CheckCircle2 className="w-3.5 h-3.5" />, class: 'checked_in', label: 'In-House' };
            case 'CHECKED_OUT': return { icon: <LogOut className="w-3.5 h-3.5" />, class: 'checked_out', label: 'Completed' };
            case 'CANCELLED': return { icon: <AlertCircle className="w-3.5 h-3.5" />, class: 'cancelled', label: 'Cancelled' };
            default: return { icon: null, class: '', label: status || 'UNKNOWN' };
        }
    };

    const getGuest = (id) => guests.find(g => g.id === id) || { fullName: `Guest ${id}`, email: '' };
    const getRoomTypeName = (id) => roomTypes.find(t => t.id === id)?.name || 'N/A';
    const getTableName = (id) => tables.find(t => t.id === id)?.tableName || 'N/A';

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
            <div className="flex justify-end items-center">
                <button className="btn-primary flex items-center gap-2 h-11" onClick={() => handleOpenBookingModal()}>
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
                    <table className="w-full text-left border-collapse">
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
                                                        <div className="flex items-center gap-2 text-[12px] text-text-dark font-medium">
                                                            <div className="w-5 h-5 bg-blue-50 text-blue-500 rounded flex items-center justify-center"><Bed size={12} /></div>
                                                            <span>Room: {getRoomTypeName(res.roomTypeId)} ({res.adults}A, {res.children}C)</span>
                                                        </div>
                                                    )}
                                                    {res.tableId && (
                                                        <div className="flex items-center gap-2 text-[12px] text-text-dark font-medium">
                                                            <div className="w-5 h-5 bg-amber-50 text-amber-500 rounded flex items-center justify-center"><Utensils size={12} /></div>
                                                            <span>Table: {getTableName(res.tableId)} ({res.tablePax} Pax)</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {res.dateIn ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-bold text-text-dark leading-none">{new Date(res.dateIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                                            <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold text-center">In</span>
                                                        </div>
                                                        <ChevronRight size={14} className="text-slate-300" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-bold text-text-dark leading-none">{new Date(res.dateOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                                            <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold text-center">Out</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-[13px] font-bold text-text-dark leading-none">
                                                        <Clock size={14} className="text-slate-400" />
                                                        {res.tableReservationTime ? new Date(res.tableReservationTime).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`status-badge ${sInfo.class} flex items-center gap-1.5 w-fit`}>
                                                    {sInfo.icon}
                                                    {sInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    {res.status === 'BOOKED' ? (
                                                        <div className="table-actions">
                                                            <button className="edit-btn" onClick={() => handleOpenBookingModal(res)}>Edit</button>
                                                            <button className="delete-btn" onClick={() => handleCancelBooking(res.id)}>Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
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
                    <div className="modal-content !w-[90%] !max-w-[1000px]">
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
                                    <div className="flex gap-10 mt-2">
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
                    <div className="modal-content premium-card !w-[90%] !max-w-[800px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">Quick Register Guest</h2>
                            <button className="close-modal-btn" onClick={() => setShowQuickGuestModal(false)}>&times;</button>
                        </div>
                        <QuickGuestSmallForm 
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
        </div>
    );
};

const QuickGuestSmallForm = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', idTypeId: 1, idNumber: '' });
    const [idTypes, setIdTypes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/id-types').then(res => {
            setIdTypes(res.data);
            if (res.data.length > 0) setFormData(f => ({ ...f, idTypeId: res.data[0].id }));
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/guests', formData);
            onSuccess(res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to register guest');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="form-grid">
                <div className="form-group full-width">
                    <label>Full Name</label>
                    <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="form-group">
                    <label>Phone</label>
                    <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                    <label>ID Type</label>
                    <select value={formData.idTypeId} onChange={e => setFormData({...formData, idTypeId: e.target.value})}>
                        {idTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>ID Number</label>
                    <input type="text" required value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} />
                </div>
            </div>
            <div className="modal-footer !px-0 mt-6">
                <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Registering...' : 'Complete Registration'}</button>
            </div>
        </form>
    );
};

export default Reservations;
