import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import GuestForm from '../../components/GuestForm/GuestForm';
import { Wallet } from 'lucide-react';

const CheckIn = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showDirectCheckInModal, setShowDirectCheckInModal] = useState(false);
    const [showReservationModal, setShowReservationModal] = useState(false);
    const [showQuickGuestModal, setShowQuickGuestModal] = useState(false);

    // Reservation check-in state
    const [reservations, setReservations] = useState([]);
    const [guests, setGuests] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [resCheckInRoomId, setResCheckInRoomId] = useState('');
    const [resCheckInLoading, setResCheckInLoading] = useState(false);

    // Active Stays state
    const [activeStays, setActiveStays] = useState([]);

    // Payment states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [activeFolio, setActiveFolio] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        paymentMethodId: '',
        referenceNumber: '',
        notes: ''
    });

    // Direct Check-in state
    const [allRooms, setAllRooms] = useState([]);
    const [directCheckInData, setDirectCheckInData] = useState({
        guestId: '',
        roomId: '',
        adults: 1,
        children: 0,
        dateOut: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
        arrivingFrom: '',
        nextDestination: '',
        arrivalFlightNo: '',
        departureFlightNo: '',
        notes: ''
    });
    const [directCheckInLoading, setDirectCheckInLoading] = useState(false);
    const [directCheckInSuccess, setDirectCheckInSuccess] = useState(null);
    const [directCheckInError, setDirectCheckInError] = useState(null);

    const [searchParams] = useSearchParams();
    const resIdParam = searchParams.get('resId');
    const guestIdParam = searchParams.get('guestId');

    // --- RESERVATION CHECK-IN ---
    const handleOpenResModal = useCallback(async (res, roomsList = null) => {
        setSelectedReservation(res);
        setResCheckInRoomId('');
        const sourceRooms = roomsList || allRooms;
        const availableAll = sourceRooms.filter(r => r.status === 'AVAILABLE');
        const filtered = availableAll.filter(r => {
            const rTypeId = r.roomType?.id ?? r.roomTypeId;
            return Number(rTypeId) === Number(res.roomTypeId);
        });
        
        if (filtered.length === 0 && res.roomTypeId) {
            console.warn(`No rooms found for RoomType ID: ${res.roomTypeId}. Falling back to all available rooms.`);
        }
        setAvailableRooms(filtered.length > 0 ? filtered : availableAll);
        setShowReservationModal(true);
    }, [allRooms]);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [resRes, guestsRes, typesRes, roomsRes, paymentMethodsRes, activeStaysRes] = await Promise.all([
                api.get('/reservations/arrivals'),
                api.get('/guests'),
                api.get('/room-types'),
                api.get('/rooms'),
                api.get('/folios/payment-methods'),
                api.get('/stays/active')
            ]);
            // Today's arrivals only
            setReservations(resRes.data);
            setGuests(guestsRes.data);
            setRoomTypes(typesRes.data);
            setAllRooms(roomsRes.data);
            setPaymentMethods(paymentMethodsRes.data);
            setActiveStays(activeStaysRes.data);

            // If resId in URL, auto-open modal
            if (resIdParam) {
                const res = resRes.data.find(r => r.id === parseInt(resIdParam));
                if (res) {
                    setSelectedReservation(res);
                    setResCheckInRoomId('');
                    const availableAll = roomsRes.data.filter(r => r.status === 'AVAILABLE');
                    const filtered = availableAll.filter(r => {
                        const rTypeId = r.roomType?.id ?? r.roomTypeId;
                        return Number(rTypeId) === Number(res.roomTypeId);
                    });
                    setAvailableRooms(filtered.length > 0 ? filtered : availableAll);
                    setShowReservationModal(true);
                }
            }

            // If guestId in URL, auto-open walk-in modal
            if (guestIdParam) {
                const guest = guestsRes.data.find(g => g.id === parseInt(guestIdParam));
                if (guest) {
                    setDirectCheckInData(prev => ({ ...prev, guestId: guest.id }));
                    setShowDirectCheckInModal(true);
                }
            }
        } catch (err) {
            console.error('Failed to load check-in data:', err);
        } finally {
            setLoading(false);
        }
    }, [resIdParam, guestIdParam]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const getGuestName = (id) => {
        const g = guests.find(g => g.id === id);
        return g ? g.fullName : `Guest #${id}`;
    };

    const getRoomTypeName = (id) => {
        const t = roomTypes.find(t => t.id === id);
        return t ? t.name : `Type #${id}`;
    };


    const handleResCheckIn = async (e) => {
        e.preventDefault();
        setResCheckInLoading(true);
        try {
            const payload = {
                reservationId: selectedReservation.id,
                roomId: parseInt(resCheckInRoomId),
                userId: user?.id || 1,
            };
            await api.post('/stays/check-in', payload);
            setShowReservationModal(false);
            alert('Check-in successful. Stay is now active.');
            fetchAllData();
        } catch (err) {
            console.error('Reservation check-in failed:', err);
            alert(err.response?.data?.message || 'Check-in failed. Please ensure the room is available.');
        } finally {
            setResCheckInLoading(false);
        }
    };

    const handleOpenPaymentModal = async (res) => {
        try {
            const folioRes = await api.get(`/folios/reservation/${res.id}`);
            setActiveFolio(folioRes.data);
            setSelectedReservation(res);
            setPaymentData({
                amount: '',
                paymentMethodId: paymentMethods[0]?.id || '',
                referenceNumber: '',
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
            const payload = {
                ...paymentData,
                amount: parseFloat(paymentData.amount),
                paymentMethodId: parseInt(paymentData.paymentMethodId)
            };
            await api.post(`/folios/${activeFolio.id}/payments?userId=${user?.id || 1}`, payload);
            setShowPaymentModal(false);
            alert('Payment recorded successfully!');
            fetchAllData();
        } catch (err) {
            console.error('Failed to record payment:', err);
            alert(err.response?.data?.message || 'Error recording payment.');
        }
    };

    // --- DIRECT CHECK-IN ---
    const availableDirectCheckInRooms = allRooms.filter(r => r.status === 'AVAILABLE');

    const handleDirectCheckIn = async (e) => {
        e.preventDefault();
        setDirectCheckInLoading(true);
        setDirectCheckInSuccess(null);
        setDirectCheckInError(null);
        try {
            const res = await api.post('/stays/direct', {
                guestId: parseInt(directCheckInData.guestId),
                roomId: parseInt(directCheckInData.roomId),
                adults: parseInt(directCheckInData.adults) || 1,
                children: parseInt(directCheckInData.children) || 0,
                dateOut: directCheckInData.dateOut,
                arrivingFrom: directCheckInData.arrivingFrom,
                nextDestination: directCheckInData.nextDestination,
                arrivalFlightNo: directCheckInData.arrivalFlightNo,
                departureFlightNo: directCheckInData.departureFlightNo,
                notes: directCheckInData.notes,
                userId: user?.id || 1,
            });
            setDirectCheckInSuccess(`Check-in successful. Stay #${res.data.id} is now ACTIVE.`);
            setDirectCheckInData({ 
                guestId: '', 
                roomId: '', 
                adults: 1, 
                children: 0,
                dateOut: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
                arrivingFrom: '',
                nextDestination: '',
                arrivalFlightNo: '',
                departureFlightNo: '',
                notes: ''
            });
            setTimeout(() => {
                setShowDirectCheckInModal(false);
                setDirectCheckInSuccess(null);
            }, 2000);
            fetchAllData();
        } catch (err) {
            setDirectCheckInError(err.response?.data?.message || 'Check-in failed. Please try again.');
        } finally {
            setDirectCheckInLoading(false);
        }
    };

    const handleVoidStay = async (stayId) => {
        if (!window.confirm('Are you sure you want to VOID this stay? The room will be set back to AVAILABLE and any linked reservation will be restored to BOOKED.')) return;
        try {
            await api.post(`/stays/${stayId}/void?userId=${user?.id || 1}`);
            alert('Stay voided successfully.');
            fetchAllData();
        } catch (err) {
            console.error('Failed to void stay:', err);
            alert(err.response?.data?.message || 'Failed to void stay.');
        }
    };

    const handleQuickGuestSuccess = (newGuest) => {
        setGuests(prev => [...prev, newGuest]);
        setDirectCheckInData(prev => ({ ...prev, guestId: newGuest.id }));
        setShowQuickGuestModal(false);
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-end items-center mb-8">
                <button 
                    className="btn-primary flex items-center gap-2"
                    onClick={() => {
                        setDirectCheckInSuccess(null);
                        setDirectCheckInError(null);
                        setShowDirectCheckInModal(true);
                    }}
                >
                    + Check-in Guest
                </button>
            </div>

            {/* ACTIVE STAYS LIST */}
            <div className="premium-card overflow-x-auto">
                <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center bg-green-50/30">
                    <h2 className="text-lg font-bold text-text-dark">Active Stays</h2>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Currently in House
                    </span>
                </div>
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading active stays...</div>
                ) : activeStays.length === 0 ? (
                    <div className="text-center py-20 text-text-slate italic">No active stays currently.</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Guest</th>
                                <th>Room</th>
                                <th>Check-in Date</th>
                                <th>Exp. Checkout</th>
                                <th>Occupancy</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeStays.map(stay => (
                                <tr key={stay.id}>
                                    <td><span className="font-bold text-text-dark">{getGuestName(stay.guestId)}</span></td>
                                    <td><span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold">Room {stay.roomId}</span></td>
                                    <td className="text-xs">{stay.dateIn ? new Date(stay.dateIn).toLocaleDateString() : '—'}</td>
                                    <td className="text-xs">{stay.dateOut ? new Date(stay.dateOut).toLocaleDateString() : '—'}</td>
                                    <td className="text-xs">{stay.adults} Adults, {stay.children || 0} Children</td>
                                    <td>
                                        <span className={`status-badge ${stay.status === 'OVERSTAY' ? 'status-cancelled' : 'status-booked'}`}>
                                            {stay.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-secondary !py-1 !px-3 text-[10px] !bg-slate-50 !text-slate-500 !border-slate-200 hover:!bg-slate-100"
                                            onClick={() => handleVoidStay(stay.id)}
                                        >
                                            Void
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* RESERVATIONS LIST */}
            <div className="premium-card overflow-x-auto mt-12">
                <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center">
                    <h2 className="text-lg font-bold text-text-dark">Pending Arrivals</h2>
                    <span className="bg-maroon/10 text-maroon text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        From Reservations
                    </span>
                </div>
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading arrivals...</div>
                ) : reservations.length === 0 ? (
                    <div className="text-center py-20 text-text-slate italic">No pending arrivals to check in.</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Guest</th>
                                <th>Room Category</th>
                                <th>Check-in Date</th>
                                <th>Check-out Date</th>
                                <th>Occupancy</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map(res => (
                                <tr key={res.id}>
                                    <td><span className="font-bold text-text-dark">{getGuestName(res.guestId)}</span></td>
                                    <td>{getRoomTypeName(res.roomTypeId)}</td>
                                    <td>{res.dateIn ? new Date(res.dateIn).toLocaleDateString() : '—'}</td>
                                    <td>{res.dateOut ? new Date(res.dateOut).toLocaleDateString() : '—'}</td>
                                    <td>{res.adults} Adults, {res.children || 0} Children</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="btn-secondary !py-1 !px-3 flex items-center gap-1.5" onClick={() => handleOpenPaymentModal(res)}>
                                                <Wallet size={12} /> Pay
                                            </button>
                                            <button className="view-btn" onClick={() => handleOpenResModal(res)}>
                                                Check In
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* GUEST CHECK-IN MODAL */}
            {showDirectCheckInModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[85%] !max-w-[700px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-text-dark">Guest Check-in</h2>
                            <button className="close-modal-btn" onClick={() => setShowDirectCheckInModal(false)}>&times;</button>
                        </div>
                        
                        {directCheckInSuccess && (
                            <div className="m-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium animate-pulse">{directCheckInSuccess}</div>
                        )}
                        {directCheckInError && (
                            <div className="m-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{directCheckInError}</div>
                        )}

                        <form onSubmit={handleDirectCheckIn} className="p-6">
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Select Guest</label>
                                    <select
                                        required
                                        value={directCheckInData.guestId}
                                        onChange={e => setDirectCheckInData({ ...directCheckInData, guestId: e.target.value })}
                                    >
                                        <option value="">-- Choose Guest --</option>
                                        {guests.map(g => (
                                            <option key={g.id} value={g.id}>{g.fullName} {g.email ? `(${g.email})` : ''}</option>
                                        ))}
                                    </select>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-text-slate italic">Not in the list?</span>
                                        <button
                                            type="button"
                                            className="text-maroon hover:underline text-[11px] font-bold"
                                            onClick={() => setShowQuickGuestModal(true)}
                                        >
                                            + REGISTER NEW GUEST
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Assign Available Room</label>
                                    <select
                                        required
                                        value={directCheckInData.roomId}
                                        onChange={e => setDirectCheckInData({ ...directCheckInData, roomId: e.target.value })}
                                    >
                                        <option value="">-- Choose Room --</option>
                                        {availableDirectCheckInRooms.map(room => (
                                            <option key={room.id} value={room.id}>
                                                Room {room.roomNumber} — Floor {room.floor} {room.roomType?.name ? `(${room.roomType.name})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Adults</label>
                                    <input
                                        type="number" min="1" required
                                        value={directCheckInData.adults}
                                        onChange={e => setDirectCheckInData({ ...directCheckInData, adults: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Children</label>
                                    <input
                                        type="number" min="0" required
                                        value={directCheckInData.children}
                                        onChange={e => setDirectCheckInData({ ...directCheckInData, children: e.target.value })}
                                    />
                                </div>
                                
                                <div className="form-group full-width">
                                    <label>Expected Checkout Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={directCheckInData.dateOut}
                                        onChange={e => setDirectCheckInData({ ...directCheckInData, dateOut: e.target.value })}
                                    />
                                    <p className="text-[10px] text-text-slate mt-1 italic leading-tight">
                                        The total room charge will be calculated and posted to the folio automatically based on this date.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label>Arriving From</label>
                                    <input type="text" value={directCheckInData.arrivingFrom} onChange={e => setDirectCheckInData({ ...directCheckInData, arrivingFrom: e.target.value })} placeholder="City or Country" />
                                </div>
                                <div className="form-group">
                                    <label>Next Destination</label>
                                    <input type="text" value={directCheckInData.nextDestination} onChange={e => setDirectCheckInData({ ...directCheckInData, nextDestination: e.target.value })} placeholder="Target Destination" />
                                </div>
                                <div className="form-group">
                                    <label>Arrival Flight #</label>
                                    <input type="text" value={directCheckInData.arrivalFlightNo} onChange={e => setDirectCheckInData({ ...directCheckInData, arrivalFlightNo: e.target.value })} placeholder="e.g. KQ101" />
                                </div>
                                <div className="form-group">
                                    <label>Departure Flight #</label>
                                    <input type="text" value={directCheckInData.departureFlightNo} onChange={e => setDirectCheckInData({ ...directCheckInData, departureFlightNo: e.target.value })} placeholder="e.g. KQ102" />
                                </div>
                                <div className="form-group full-width">
                                    <label>Stay Notes</label>
                                    <textarea 
                                        className="w-full min-h-[60px]" 
                                        value={directCheckInData.notes} 
                                        onChange={e => setDirectCheckInData({ ...directCheckInData, notes: e.target.value })} 
                                        placeholder="Special requests, billing instructions, etc."
                                    />
                                </div>
                            </div>

                            <div className="modal-footer !px-0 mt-8">
                                <button type="button" onClick={() => setShowDirectCheckInModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10" disabled={directCheckInLoading}>
                                    {directCheckInLoading ? 'Loading...' : 'Complete Check-in'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reservation Check-in Room Selection Modal */}
            {showReservationModal && selectedReservation && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[80%] !max-w-[600px]">
                        <div className="modal-header">
                            <h2>Assign Room — Check-in</h2>
                            <button className="close-modal-btn" onClick={() => setShowReservationModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleResCheckIn}>
                            <div className="bg-slate-50 p-5 rounded-xl border border-border-gray mb-6 flex flex-col gap-2">
                                <p className="text-text-dark"><strong>Guest:</strong> {getGuestName(selectedReservation.guestId)}</p>
                                <p className="text-text-dark"><strong>Category:</strong> {getRoomTypeName(selectedReservation.roomTypeId)}</p>
                                <p className="text-text-dark"><strong>Dates:</strong> {new Date(selectedReservation.dateIn).toLocaleDateString()} → {new Date(selectedReservation.dateOut).toLocaleDateString()}</p>
                            </div>
                            <div className="form-group full-width">
                                <label>Available Rooms</label>
                                {availableRooms.length === 0 ? (
                                    <p className="text-red-500 text-sm font-medium mt-1">No available rooms match this category.</p>
                                ) : (
                                    <select
                                        required
                                        value={resCheckInRoomId}
                                        onChange={e => setResCheckInRoomId(e.target.value)}
                                    >
                                        <option value="">-- Select Room Number --</option>
                                        {availableRooms.map(room => (
                                            <option key={room.id} value={room.id}>Room {room.roomNumber} — Floor {room.floor}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowReservationModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary" disabled={!resCheckInRoomId || availableRooms.length === 0 || resCheckInLoading}>
                                    {resCheckInLoading ? 'Checking In...' : 'Complete Check-in'}
                                </button>
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
                        <GuestForm 
                            onSuccess={handleQuickGuestSuccess} 
                            onCancel={() => setShowQuickGuestModal(false)} 
                        />
                    </div>
                </div>
            )}
            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="modal-overlay">
                    <div className="modal-content !max-w-[450px]">
                        <div className="modal-header">
                            <h2 className="flex items-center gap-2">
                                <Wallet className="text-maroon" /> Record Payment
                            </h2>
                            <button className="close-modal-btn" onClick={() => setShowPaymentModal(false)}>&times;</button>
                        </div>
                        <div className="p-4 bg-maroon/5 rounded-xl mb-6">
                            <p className="text-[11px] font-bold text-maroon uppercase tracking-widest">Guest</p>
                            <p className="text-lg font-black text-text-dark">{getGuestName(selectedReservation?.guestId)}</p>
                            <div className="flex justify-between mt-2 pt-2 border-t border-maroon/10">
                                <span className="text-xs font-bold text-slate-500 uppercase">Balance</span>
                                <span className="text-sm font-black text-slate-900">$ {parseFloat(activeFolio?.totalAmount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                        <form onSubmit={handleRecordPayment}>
                            <div className="flex flex-col gap-4">
                                <div className="form-group">
                                    <label>Amount ($)</label>
                                    <input 
                                        type="number" step="0.01" required autoFocus
                                        value={paymentData.amount} 
                                        onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select required value={paymentData.paymentMethodId} onChange={e => setPaymentData({...paymentData, paymentMethodId: e.target.value})}>
                                        {paymentMethods.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Reference</label>
                                    <input type="text" value={paymentData.referenceNumber} onChange={e => setPaymentData({...paymentData, referenceNumber: e.target.value})} placeholder="Receipt #" />
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
        </div>
    );
};

export default CheckIn;
