import React, { useState, useEffect } from 'react';
import api from '../../services/api';

// ─────────────────────────────────────────
//  Calendar Helper Utilities
// ─────────────────────────────────────────
const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};
const fmtDate = (d) => d.toISOString().split('T')[0];
const fmtDisplay = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });

const STATUS_COLORS = {
    BOOKED: { bg: '#3B82F6', text: '#fff', label: 'BOOKED' },
    CHECKED_IN: { bg: '#22C55E', text: '#fff', label: 'IN' },
    CHECKED_OUT: { bg: '#94A3B8', text: '#fff', label: 'OUT' },
    CANCELLED: { bg: '#EF4444', text: '#fff', label: 'CANCELLED' },
};

// ─────────────────────────────────────────
//  Reservation Calendar Component
// ─────────────────────────────────────────
const ReservationCalendar = ({ reservations, roomTypes, guests }) => {
    const [weekStart, setWeekStart] = useState(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });
    const DAYS = 14; // show 2 weeks

    const days = Array.from({ length: DAYS }, (_, i) => addDays(weekStart, i));

    const getGuestName = (id) => {
        const g = guests.find(g => g.id === id);
        return g ? g.fullName : `Guest ${id}`;
    };
    const getRtName = (id) => {
        const t = roomTypes.find(t => t.id === id);
        return t ? t.name : `Type ${id}`;
    };

    // Group reservations by roomTypeId for display
    const roomOnly = reservations.filter(r => r.roomTypeId);
    const rtIds = [...new Set(roomOnly.map(r => r.roomTypeId))];

    // eslint-disable-next-line no-unused-vars
    const getBarStyle = (res) => {
        const start = new Date(res.dateIn);
        const end = new Date(res.dateOut);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        const wEnd = days[DAYS - 1];

        const clampedStart = start < weekStart ? weekStart : start;
        const clampedEnd = end > wEnd ? wEnd : end;

        const startCol = Math.round((clampedStart - weekStart) / 86400000);
        const span = Math.max(1, Math.round((clampedEnd - clampedStart) / 86400000));
        return { startCol, span };
    };

    return (
        <div className="premium-card p-6 overflow-x-auto">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
                <button
                    className="btn-secondary !py-1.5 !px-4 text-sm"
                    onClick={() => setWeekStart(d => addDays(d, -7))}
                >← Prev Week</button>
                <div className="flex items-center gap-4">
                    <span className="text-base font-bold text-slate-700">
                        {fmtDisplay(weekStart)} — {fmtDisplay(days[DAYS - 1])}
                    </span>
                    <button className="text-xs font-semibold text-primary hover:underline" onClick={() => { const t = new Date(); t.setHours(0,0,0,0); setWeekStart(t); }}>Today</button>
                </div>
                <button
                    className="btn-secondary !py-1.5 !px-4 text-sm"
                    onClick={() => setWeekStart(d => addDays(d, 7))}
                >Next Week →</button>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mb-5 flex-wrap">
                {Object.entries(STATUS_COLORS).map(([s, c]) => (
                    <div key={s} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <span className="w-3 h-3 rounded-sm inline-block" style={{ background: c.bg }}></span>{s}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="min-w-[900px]">
                {/* Header row */}
                <div className="grid gap-0 mb-1" style={{ gridTemplateColumns: `160px repeat(${DAYS}, 1fr)` }}>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Room Type</div>
                    {days.map((d, i) => {
                        const isToday = fmtDate(d) === fmtDate(new Date());
                        return (
                            <div key={i} className={`text-center text-[11px] font-semibold py-1 px-0.5 rounded-md ${isToday ? 'bg-primary/10 text-primary font-bold' : 'text-slate-400'}`}>
                                <div>{d.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                                <div className={`text-[13px] font-extrabold ${isToday ? 'text-primary' : 'text-slate-600'}`}>{d.getDate()}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Rows */}
                {rtIds.length === 0 && (
                    <div className="py-20 text-center text-slate-400 italic text-sm">No room reservations to display for this period.</div>
                )}
                {rtIds.map(rtId => {
                    const rtRes = roomOnly.filter(r => r.roomTypeId === rtId && r.status !== 'CANCELLED');
                    const cancelledRes = roomOnly.filter(r => r.roomTypeId === rtId && r.status === 'CANCELLED');
                    const allRes = [...rtRes, ...cancelledRes];

                    return (
                        <div key={rtId} className="border-t border-slate-100 grid gap-0 relative items-start py-2" style={{ gridTemplateColumns: `160px repeat(${DAYS}, 1fr)` }}>
                            {/* Room type label */}
                            <div className="flex items-center pr-3">
                                <span className="text-sm font-bold text-slate-700 truncate">{getRtName(rtId)}</span>
                            </div>

                            {/* Day columns background */}
                            {days.map((d, i) => (
                                <div key={i} className={`h-full min-h-[48px] border-l border-slate-100 ${fmtDate(d) === fmtDate(new Date()) ? 'bg-primary/5' : ''}`}></div>
                            ))}

                            {/* Overlay: reservation bars */}
                            <div className="absolute inset-0 pointer-events-none" style={{ paddingLeft: 160 }}>
                                <div className="relative w-full h-full" style={{ display: 'grid', gridTemplateColumns: `repeat(${DAYS}, 1fr)` }}>
                                    {allRes.map(res => {
                                        const start = new Date(res.dateIn);
                                        const end = new Date(res.dateOut);
                                        start.setHours(0, 0, 0, 0);
                                        end.setHours(0, 0, 0, 0);
                                        const wEnd = days[DAYS - 1];
                                        if (end <= weekStart || start > wEnd) return null;

                                        const clampedStart = start < weekStart ? weekStart : start;
                                        const clampedEnd = end > addDays(wEnd, 1) ? addDays(wEnd, 1) : end;

                                        const startCol = Math.round((clampedStart - weekStart) / 86400000) + 1;
                                        const span = Math.max(1, Math.round((clampedEnd - clampedStart) / 86400000));
                                        const colors = STATUS_COLORS[res.status] || STATUS_COLORS.BOOKED;

                                        return (
                                            <div
                                                key={res.id}
                                                title={`${getGuestName(res.guestId)} | ${res.dateIn} → ${res.dateOut} | ${res.status}`}
                                                className="absolute top-1.5 h-8 rounded-md flex items-center px-2 text-[11px] font-bold truncate pointer-events-auto cursor-pointer shadow-sm hover:brightness-90 transition-all"
                                                style={{
                                                    left: `calc(${(startCol - 1) * (100 / DAYS)}%)`,
                                                    width: `calc(${span * (100 / DAYS)}% - 4px)`,
                                                    background: colors.bg,
                                                    color: colors.text,
                                                }}
                                            >
                                                {getGuestName(res.guestId)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────
//  Main Reservations Page
// ─────────────────────────────────────────
const Reservations = () => {
    const [reservations, setReservations] = useState([]);
    const [guests, setGuests] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' | 'calendar'

    const [showBookingModal, setShowBookingModal] = useState(false);
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
        } else {
            setFormData({
                ...formData,
                guestId: '',
                nationality: '',
                idType: 'PASSPORT',
                idNumber: '',
                preferences: '',
                vehicleRegistration: '',
                emergencyContactName: '',
                emergencyContactPhone: ''
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
            alert('Failed to save booking.');
        }
    };

    const handleCancelBooking = async (id) => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            try {
                await api.post(`/reservations/${id}/cancel`);
                fetchAllData();
            } catch (err) {
                console.error('Failed to cancel:', err);
                alert('Failed to cancel booking.');
            }
        }
    };

    const getStatusClass = (status) => {
        if (!status) return 'unknown';
        return status.toLowerCase();
    };

    const getGuestName = (id) => {
        const guest = guests.find(g => g.id === id);
        return guest ? guest.fullName : `Guest ${id}`;
    };

    const getRoomTypeName = (id) => {
        const type = roomTypes.find(t => t.id === id);
        return type ? type.name : null;
    };

    const getTableName = (id) => {
        const table = tables.find(t => t.id === id);
        return table ? table.tableName : null;
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Reservations & Bookings</h1>
                    <p className="text-text-slate text-base">Manage room stays and restaurant table reservations.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View toggle */}
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                        <button
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${view === 'list' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                            onClick={() => setView('list')}
                        >List</button>
                        <button
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${view === 'calendar' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                            onClick={() => setView('calendar')}
                        >Calendar</button>
                    </div>
                    <button className="btn-primary" onClick={() => handleOpenBookingModal()}>New Reservation</button>
                </div>
            </div>

            {view === 'calendar' ? (
                <ReservationCalendar reservations={reservations} roomTypes={roomTypes} guests={guests} />
            ) : (
                <div className="premium-card overflow-x-auto">
                    {loading && reservations.length === 0 ? (
                        <div className="text-center py-20 text-text-slate animate-pulse">Loading reservations...</div>
                    ) : (
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th>Guest</th>
                                    <th>Booking Info</th>
                                    <th>Dates / Time</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservations.length > 0 ? (
                                    reservations.map((res) => (
                                        <tr key={res.id}>
                                            <td>
                                                <span className="font-bold text-text-dark">{getGuestName(res.guestId)}</span>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    {res.roomTypeId && (
                                                        <div className="text-xs text-text-slate flex items-center gap-1.5">🛏️ {getRoomTypeName(res.roomTypeId)}</div>
                                                    )}
                                                    {res.tableId && (
                                                        <div className="text-xs text-text-slate flex items-center gap-1.5">🍽️ {getTableName(res.tableId)}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {res.dateIn ? (
                                                    <div className="text-sm text-text-dark font-medium leading-tight">
                                                        <div>{new Date(res.dateIn).toLocaleDateString()}</div>
                                                        <div className="text-[10px] text-text-slate font-normal uppercase">to</div>
                                                        <div>{new Date(res.dateOut).toLocaleDateString()}</div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-text-dark font-medium">
                                                        {res.tableReservationTime ? new Date(res.tableReservationTime).toLocaleString() : 'N/A'}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(res.status)}`}>
                                                    {res.status || 'UNKNOWN'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    {res.status === 'BOOKED' && (
                                                        <>
                                                            <button className="edit-btn" onClick={() => handleOpenBookingModal(res)}>Edit</button>
                                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-300" onClick={() => handleCancelBooking(res.id)}>Cancel</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-20 text-text-slate italic">No reservations found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {showBookingModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[90%] !max-w-[1200px]">
                        <div className="modal-header">
                            <h2>{selectedReservation ? 'Edit Reservation' : 'New Reservation'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowBookingModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmitBooking}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Select Guest</label>
                                    <select
                                        required
                                        value={formData.guestId}
                                        onChange={(e) => handleGuestChange(e.target.value)}
                                        disabled={!!selectedReservation}
                                    >
                                        <option value="">-- Choose Guest --</option>
                                        {guests.map(guest => (
                                            <option key={guest.id} value={guest.id}>{guest.fullName} ({guest.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label>Booking Type</label>
                                    <div className="flex gap-8 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer text-text-dark font-medium"><input type="radio" className="accent-maroon" value="ROOM" checked={formData.bookingType === 'ROOM'} onChange={(e) => setFormData({...formData, bookingType: e.target.value})} /> Room Only</label>
                                        <label className="flex items-center gap-2 cursor-pointer text-text-dark font-medium"><input type="radio" className="accent-maroon" value="TABLE" checked={formData.bookingType === 'TABLE'} onChange={(e) => setFormData({...formData, bookingType: e.target.value})} /> Table Only</label>
                                        <label className="flex items-center gap-2 cursor-pointer text-text-dark font-medium"><input type="radio" className="accent-maroon" value="BOTH" checked={formData.bookingType === 'BOTH'} onChange={(e) => setFormData({...formData, bookingType: e.target.value})} /> Room + Table</label>
                                    </div>
                                </div>

                                {(formData.bookingType === 'ROOM' || formData.bookingType === 'BOTH') && (
                                    <>
                                        <div className="font-bold text-maroon border-b border-border-gray pb-1 mb-1 mt-4 col-span-full text-base tracking-tight uppercase">Room Details</div>
                                        <div className="form-group">
                                            <label>Room Type</label>
                                            <select required={formData.bookingType !== 'TABLE'} value={formData.roomTypeId} onChange={(e) => setFormData({...formData, roomTypeId: parseInt(e.target.value)})}>
                                                <option value="">-- Choose Room Type --</option>
                                                {roomTypes.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name} - ${type.defaultRate}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Adults / Children</label>
                                            <div className="flex gap-2">
                                                <input type="number" min="1" required className="flex-1" value={formData.adults} onChange={(e) => setFormData({...formData, adults: e.target.value})} />
                                                <input type="number" min="0" className="flex-1" value={formData.children} onChange={(e) => setFormData({...formData, children: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Check-in Date</label>
                                            <input type="date" required={formData.bookingType !== 'TABLE'} value={formData.dateIn} onChange={(e) => setFormData({...formData, dateIn: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Check-out Date</label>
                                            <input type="date" required={formData.bookingType !== 'TABLE'} value={formData.dateOut} onChange={(e) => setFormData({...formData, dateOut: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>ETA (Time)</label>
                                            <input type="time" value={formData.eta} onChange={(e) => setFormData({...formData, eta: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>ETD (Time)</label>
                                            <input type="time" value={formData.etd} onChange={(e) => setFormData({...formData, etd: e.target.value})} />
                                        </div>
                                    </>
                                )}

                                {(formData.bookingType === 'TABLE' || formData.bookingType === 'BOTH') && (
                                    <>
                                        <div className="font-bold text-maroon border-b border-border-gray pb-1 mb-1 mt-4 col-span-full text-base tracking-tight uppercase">Restaurant Details</div>
                                        <div className="form-group">
                                            <label>Select Table</label>
                                            <select required={formData.bookingType !== 'ROOM'} value={formData.tableId} onChange={(e) => setFormData({...formData, tableId: parseInt(e.target.value)})}>
                                                <option value="">-- Choose Table --</option>
                                                {tables.map(table => (
                                                    <option key={table.id} value={table.id}>{table.tableName} ({table.location}) - Capacity {table.capacity}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Reservation Time</label>
                                            <input type="datetime-local" required={formData.bookingType !== 'ROOM'} value={formData.tableReservationTime} onChange={(e) => setFormData({...formData, tableReservationTime: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Table Pax</label>
                                            <input type="number" min="1" required={formData.bookingType !== 'ROOM'} value={formData.tablePax} onChange={(e) => setFormData({...formData, tablePax: e.target.value})} />
                                        </div>
                                    </>
                                )}

                                <div className="font-bold text-maroon border-b border-border-gray pb-1 mb-1 mt-4 col-span-full text-base tracking-tight uppercase">Additional Information</div>
                                <div className="form-group full-width">
                                    <label>Nationality / ID Info</label>
                                    <div className="flex flex-wrap md:flex-nowrap gap-3">
                                        <input type="text" value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} placeholder="Nationality" className="flex-1" />
                                        <select value={formData.idType} onChange={(e) => setFormData({...formData, idType: e.target.value})} className="flex-1">
                                            <option value="PASSPORT">Passport</option>
                                            <option value="NATIONAL_ID">National ID</option>
                                        </select>
                                        <input type="text" value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} placeholder="ID Number" className="flex-[1.5]" />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Vehicle / Emergency Contact</label>
                                    <div className="flex flex-wrap md:flex-nowrap gap-3">
                                        <input type="text" value={formData.vehicleRegistration} onChange={(e) => setFormData({...formData, vehicleRegistration: e.target.value})} placeholder="Vehicle Reg" className="flex-1" />
                                        <input type="text" value={formData.emergencyContactName} onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})} placeholder="Contact Name" className="flex-1" />
                                        <input type="text" value={formData.emergencyContactPhone} onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})} placeholder="Contact Phone" className="flex-1" />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Special Requests & Preferences</label>
                                    <textarea value={formData.specialRequests} onChange={(e) => setFormData({...formData, specialRequests: e.target.value})} className="min-h-[80px]" placeholder="Anything else we should know?" />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowBookingModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">{selectedReservation ? 'Save Changes' : 'Create Booking'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservations;
