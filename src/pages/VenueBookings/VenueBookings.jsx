import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Check, X } from 'lucide-react';
import Modal from '../../components/Modal/Modal';

const EVENT_TYPES = ['CONFERENCE', 'WEDDING', 'BIRTHDAY', 'GALA', 'SEMINAR', 'WORKSHOP', 'CORPORATE', 'OTHER'];
const SETUP_TYPES = ['THEATER', 'CLASSROOM', 'BOARDROOM', 'BANQUET', 'COCKTAIL', 'U_SHAPE', 'HOLLOW_SQUARE', 'OPEN'];
const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

const statusColors = {
    PENDING: 'warning',
    CONFIRMED: 'checked-in',
    CANCELLED: 'cancelled',
    COMPLETED: 'checked-out',
};

const emptyForm = {
    venueId: '',
    clientName: '',
    clientPhone: '',
    clientCompany: '',
    eventType: 'CONFERENCE',
    setupType: 'THEATER',
    dateIn: '',
    dateOut: '',
    startTime: '',
    endTime: '',
    expectedGuests: '',
    deposit: '',
    totalAmount: '',
    depositPaid: false,
    status: 'PENDING',
    notes: '',
};

const VenueBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [search, setSearch] = useState('');

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [bRes, vRes] = await Promise.all([
                api.get('/venue-bookings'),
                api.get('/venues'),
            ]);
            setBookings(bRes.data);
            setVenues(vRes.data);
        } catch (err) {
            console.error('Failed to fetch venue bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const openModal = (booking = null) => {
        if (booking) {
            setEditing(booking);
            setFormData({
                venueId: booking.venueId || '',
                clientName: booking.clientName || '',
                clientPhone: booking.clientPhone || '',
                clientCompany: booking.clientCompany || '',
                eventType: booking.eventType || 'CONFERENCE',
                setupType: booking.setupType || 'THEATER',
                dateIn: booking.dateIn || '',
                dateOut: booking.dateOut || '',
                startTime: booking.startTime || '',
                endTime: booking.endTime || '',
                expectedGuests: booking.expectedGuests || '',
                deposit: booking.deposit || '',
                totalAmount: booking.totalAmount || '',
                depositPaid: booking.depositPaid || false,
                status: booking.status || 'PENDING',
                notes: booking.notes || '',
            });
        } else {
            setEditing(null);
            setFormData(emptyForm);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                venueId: parseInt(formData.venueId) || null,
                expectedGuests: parseInt(formData.expectedGuests) || null,
                deposit: parseFloat(formData.deposit) || null,
                totalAmount: parseFloat(formData.totalAmount) || null,
            };
            if (editing) {
                await api.put(`/venue-bookings/${editing.id}`, payload);
            } else {
                await api.post('/venue-bookings', payload);
            }
            setShowModal(false);
            fetchAll();
        } catch (err) {
            console.error('Failed to save booking:', err);
            alert('Failed to save venue booking.');
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await api.patch(`/venue-bookings/${id}/status`, { status });
            fetchAll();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this booking? This cannot be undone.')) return;
        try {
            await api.delete(`/venue-bookings/${id}`);
            fetchAll();
        } catch {
            alert('Failed to delete booking.');
        }
    };

    const filtered = bookings.filter(b =>
        (b.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.venueName || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.clientCompany || '').toLowerCase().includes(search.toLowerCase())
    );

    const set = (field, value) => setFormData(p => ({ ...p, [field]: value }));

    return (
        <div className="flex flex-col">
            <div className="flex justify-end items-center mb-8">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        placeholder="Search client, venue..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm w-56"
                    />
                    <button 
                        className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm" 
                        onClick={() => window.location.href = '/venues'}
                    >
                        Manage Venues
                    </button>
                    <button className="btn-primary" onClick={() => openModal()}>+ New Booking</button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {STATUSES.map(s => {
                    const count = bookings.filter(b => b.status === s).length;
                    return (
                        <div key={s} className="premium-card p-4 flex items-center gap-3">
                            <span className={`status-badge ${statusColors[s]} text-xs`}>{s}</span>
                            <span className="text-2xl font-extrabold text-primary">{count}</span>
                        </div>
                    );
                })}
            </div>

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading bookings...</div>
                ) : (
                    <table className="management-table" style={{ minWidth: '1000px' }}>
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Venue</th>
                                <th>Event</th>
                                <th>Dates</th>
                                <th>Guests</th>
                                <th>Total ($)</th>
                                <th>Deposit</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length > 0 ? filtered.map(b => (
                                <tr key={b.id}>
                                    <td>
                                        <div className="font-bold text-text-dark">{b.clientName}</div>
                                        {b.clientCompany && <div className="text-xs text-text-slate">{b.clientCompany}</div>}
                                        {b.clientPhone && <div className="text-xs text-text-slate">{b.clientPhone}</div>}
                                    </td>
                                    <td>
                                        <span className="status-badge info text-xs">{b.venueName || `Venue #${b.venueId}`}</span>
                                    </td>
                                    <td>
                                        <div className="text-sm font-semibold text-slate-700">{b.eventType?.replace(/_/g,' ')}</div>
                                        <div className="text-xs text-slate-400">{b.setupType?.replace(/_/g,' ')}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm font-medium text-text-dark">{b.dateIn}</div>
                                        {b.dateOut && b.dateOut !== b.dateIn && <div className="text-xs text-text-slate">to {b.dateOut}</div>}
                                        {b.startTime && <div className="text-xs text-slate-400">{b.startTime} – {b.endTime}</div>}
                                    </td>
                                    <td className="text-center font-bold text-slate-700">{b.expectedGuests || '—'}</td>
                                    <td className="font-semibold text-slate-700">{b.totalAmount ? parseFloat(b.totalAmount).toLocaleString() : '—'}</td>
                                    <td>
                                        {b.deposit ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-semibold">{parseFloat(b.deposit).toLocaleString()}</span>
                                                <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${b.depositPaid ? 'text-green-600' : 'text-red-500'}`}>
                                                    {b.depositPaid ? <><Check size={10} /> Paid</> : <><X size={10} /> Unpaid</>}
                                                </span>
                                            </div>
                                        ) : '—'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${statusColors[b.status] || ''}`}>{b.status}</span>
                                    </td>
                                    <td>
                                        <div className="table-actions flex-wrap gap-1">
                                            <button className="view-btn" onClick={() => openModal(b)}>Edit</button>
                                            {b.status === 'PENDING' && (
                                                <button className="bg-white text-green-700 border border-green-200 hover:bg-green-50 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors duration-150" onClick={() => handleStatusChange(b.id, 'CONFIRMED')}>Confirm</button>
                                            )}
                                            {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                                                <button className="bg-white text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors duration-150" onClick={() => handleStatusChange(b.id, 'CANCELLED')}>Cancel</button>
                                            )}
                                            {b.status === 'CONFIRMED' && (
                                                <button className="bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors duration-150" onClick={() => handleStatusChange(b.id, 'COMPLETED')}>Complete</button>
                                            )}
                                            <button className="delete-btn" onClick={() => handleDelete(b.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="9" className="text-center py-20 text-text-slate italic">No venue bookings found. Click '+ New Booking' to get started.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editing ? 'Edit Venue Booking' : 'New Venue Booking'}
                size="xl"
                customClasses="!w-[90%] !max-w-[1100px]"
            >
                <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                {/* Client Info */}
                                <div className="font-bold text-maroon border-b border-border-gray pb-1 mb-1 col-span-full text-base tracking-tight uppercase">Client Information</div>
                                <div className="form-group">
                                    <label>Client Name *</label>
                                    <input type="text" required value={formData.clientName} onChange={e => set('clientName', e.target.value)} placeholder="Full name" />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" value={formData.clientPhone} onChange={e => set('clientPhone', e.target.value)} placeholder="+254..." />
                                </div>
                                <div className="form-group">
                                    <label>Company / Organization</label>
                                    <input type="text" value={formData.clientCompany} onChange={e => set('clientCompany', e.target.value)} placeholder="Optional" />
                                </div>

                                {/* Event Details */}
                                <div className="font-bold text-maroon border-b border-border-gray pb-1 mb-1 mt-2 col-span-full text-base tracking-tight uppercase">Event Details</div>
                                <div className="form-group">
                                    <label>Venue *</label>
                                    <select required value={formData.venueId} onChange={e => set('venueId', e.target.value)}>
                                        <option value="">-- Select Venue --</option>
                                        {venues.map(v => <option key={v.id} value={v.id}>{v.name} ({v.type}) – {v.capacity} pax</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Event Type *</label>
                                    <select value={formData.eventType} onChange={e => set('eventType', e.target.value)}>
                                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Room Setup</label>
                                    <select value={formData.setupType} onChange={e => set('setupType', e.target.value)}>
                                        {SETUP_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Expected Guests</label>
                                    <input type="number" min="1" value={formData.expectedGuests} onChange={e => set('expectedGuests', e.target.value)} placeholder="e.g. 100" />
                                </div>

                                {/* Dates & Times */}
                                <div className="font-bold text-maroon border-b border-border-gray pb-1 mb-1 mt-2 col-span-full text-base tracking-tight uppercase">Dates & Times</div>
                                <div className="form-group">
                                    <label>Date In *</label>
                                    <input type="date" required value={formData.dateIn} onChange={e => set('dateIn', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Date Out</label>
                                    <input type="date" value={formData.dateOut} onChange={e => set('dateOut', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Start Time</label>
                                    <input type="time" value={formData.startTime} onChange={e => set('startTime', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>End Time</label>
                                    <input type="time" value={formData.endTime} onChange={e => set('endTime', e.target.value)} />
                                </div>

                                {/* Financials */}
                                <div className="font-bold text-maroon border-b border-border-gray pb-1 mb-1 mt-2 col-span-full text-base tracking-tight uppercase">Financials & Status</div>
                                <div className="form-group">
                                    <label>Total Amount ($)</label>
                                    <input type="number" min="0" value={formData.totalAmount} onChange={e => set('totalAmount', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Deposit ($)</label>
                                    <input type="number" min="0" value={formData.deposit} onChange={e => set('deposit', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={e => set('status', e.target.value)}>
                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group flex items-center gap-3 pt-6">
                                    <input type="checkbox" id="depositPaid" checked={formData.depositPaid} onChange={e => set('depositPaid', e.target.checked)} className="w-4 h-4 accent-maroon cursor-pointer" />
                                    <label htmlFor="depositPaid" className="cursor-pointer font-semibold text-slate-700">Deposit Paid</label>
                                </div>

                                <div className="form-group full-width">
                                    <label>Notes</label>
                                    <textarea rows="3" value={formData.notes} onChange={e => set('notes', e.target.value)} placeholder="Special requirements, setup notes..." className="min-h-[80px]" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">{editing ? 'Save Changes' : 'Create Booking'}</button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default VenueBookings;
