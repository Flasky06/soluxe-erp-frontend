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
    const [showWalkInModal, setShowWalkInModal] = useState(false);
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

    // Walk-in state
    const [allRooms, setAllRooms] = useState([]);
    const [walkInData, setWalkInData] = useState({
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
    const [walkInLoading, setWalkInLoading] = useState(false);
    const [walkInSuccess, setWalkInSuccess] = useState(null);
    const [walkInError, setWalkInError] = useState(null);

    const [searchParams] = useSearchParams();
    const resIdParam = searchParams.get('resId');

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [resRes, guestsRes, typesRes, roomsRes, paymentMethodsRes] = await Promise.all([
                api.get('/reservations/arrivals'),
                api.get('/guests'),
                api.get('/room-types'),
                api.get('/rooms'),
                api.get('/folios/payment-methods')
            ]);
            // Today's arrivals only
            setReservations(resRes.data);
            setGuests(guestsRes.data);
            setRoomTypes(typesRes.data);
            setAllRooms(roomsRes.data);
            setPaymentMethods(paymentMethodsRes.data);

            // If resId in URL, auto-open modal
            if (resIdParam) {
                const res = resRes.data.find(r => r.id === parseInt(resIdParam));
                if (res) {
                    handleOpenResModal(res, roomsRes.data);
                }
            }
        } catch (err) {
            console.error('Failed to load check-in data:', err);
        } finally {
            setLoading(false);
        }
    }, [resIdParam, handleOpenResModal]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const getGuestName = (id) => {
        const g = guests.find(g => g.id === id);
        return g ? g.fullName : `Guest #${id}`;
    };

    const getRoomTypeName = (id) => {
        const t = roomTypes.find(t => t.id === id);
        return t ? t.name : `Type #${id}`;
    };

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

    // --- WALK-IN CHECK-IN ---
    const availableWalkInRooms = allRooms.filter(r => r.status === 'AVAILABLE');

    const handleWalkIn = async (e) => {
        e.preventDefault();
        setWalkInLoading(true);
        setWalkInSuccess(null);
        setWalkInError(null);
        try {
            const res = await api.post('/stays/direct', {
                guestId: parseInt(walkInData.guestId),
                roomId: parseInt(walkInData.roomId),
                adults: parseInt(walkInData.adults) || 1,
                children: parseInt(walkInData.children) || 0,
                dateOut: `${walkInData.dateOut}T11:00:00`,
                arrivingFrom: walkInData.arrivingFrom,
                nextDestination: walkInData.nextDestination,
                arrivalFlightNo: walkInData.arrivalFlightNo,
                departureFlightNo: walkInData.departureFlightNo,
                notes: walkInData.notes,
                userId: user?.id || 1,
            });
            setWalkInSuccess(`Check-in successful. Stay #${res.data.id} is now ACTIVE.`);
            setWalkInData({ 
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
                setShowWalkInModal(false);
                setWalkInSuccess(null);
            }, 2000);
            fetchAllData();
        } catch (err) {
            setWalkInError(err.response?.data?.message || 'Walk-in check-in failed. Please try again.');
        } finally {
            setWalkInLoading(false);
        }
    };

    const handleQuickGuestSuccess = (newGuest) => {
        setGuests(prev => [...prev, newGuest]);
        setWalkInData(prev => ({ ...prev, guestId: newGuest.id }));
        setShowQuickGuestModal(false);
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-end items-center mb-8">
                <button 
                    className="btn-primary flex items-center gap-2"
                    onClick={() => {
                        setWalkInSuccess(null);
                        setWalkInError(null);
                        setShowWalkInModal(true);
                    }}
                >
                    + Check-in Guest
                </button>
            </div>

            {/* RESERVATIONS LIST */}
            <div className="premium-card overflow-x-auto">
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

            {/* WALK-IN MODAL */}
            {showWalkInModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[85%] !max-w-[700px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-text-dark">Guest Check-in</h2>
                            <button className="close-modal-btn" onClick={() => setShowWalkInModal(false)}>&times;</button>
                        </div>
                        
                        {walkInSuccess && (
                            <div className="m-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium animate-pulse">{walkInSuccess}</div>
                        )}
                        {walkInError && (
                            <div className="m-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{walkInError}</div>
                        )}

                        <form onSubmit={handleWalkIn} className="p-6">
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Select Guest</label>
                                    <select
                                        required
                                        value={walkInData.guestId}
                                        onChange={e => setWalkInData({ ...walkInData, guestId: e.target.value })}
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
                                        value={walkInData.roomId}
                                        onChange={e => setWalkInData({ ...walkInData, roomId: e.target.value })}
                                    >
                                        <option value="">-- Choose Room --</option>
                                        {availableWalkInRooms.map(room => (
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
                                        value={walkInData.adults}
                                        onChange={e => setWalkInData({ ...walkInData, adults: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Children</label>
                                    <input
                                        type="number" min="0" required
                                        value={walkInData.children}
                                        onChange={e => setWalkInData({ ...walkInData, children: e.target.value })}
                                    />
                                </div>
                                
                                <div className="form-group full-width">
                                    <label>Expected Checkout Date</label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={walkInData.dateOut}
                                        onChange={e => setWalkInData({ ...walkInData, dateOut: e.target.value })}
                                    />
                                    <p className="text-[10px] text-text-slate mt-1 italic leading-tight">
                                        The total room charge will be calculated and posted to the folio automatically based on this date.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label>Arriving From</label>
                                    <input type="text" value={walkInData.arrivingFrom} onChange={e => setWalkInData({ ...walkInData, arrivingFrom: e.target.value })} placeholder="City or Country" />
                                </div>
                                <div className="form-group">
                                    <label>Next Destination</label>
                                    <input type="text" value={walkInData.nextDestination} onChange={e => setWalkInData({ ...walkInData, nextDestination: e.target.value })} placeholder="Target Destination" />
                                </div>
                                <div className="form-group">
                                    <label>Arrival Flight #</label>
                                    <input type="text" value={walkInData.arrivalFlightNo} onChange={e => setWalkInData({ ...walkInData, arrivalFlightNo: e.target.value })} placeholder="e.g. KQ101" />
                                </div>
                                <div className="form-group">
                                    <label>Departure Flight #</label>
                                    <input type="text" value={walkInData.departureFlightNo} onChange={e => setWalkInData({ ...walkInData, departureFlightNo: e.target.value })} placeholder="e.g. KQ102" />
                                </div>
                                <div className="form-group full-width">
                                    <label>Stay Notes</label>
                                    <textarea 
                                        className="w-full min-h-[60px]" 
                                        value={walkInData.notes} 
                                        onChange={e => setWalkInData({ ...walkInData, notes: e.target.value })} 
                                        placeholder="Special requests, billing instructions, etc."
                                    />
                                </div>
                            </div>

                            <div className="modal-footer !px-0 mt-8">
                                <button type="button" onClick={() => setShowWalkInModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10" disabled={walkInLoading}>
                                    {walkInLoading ? 'Loading...' : 'Complete Check-in'}
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
                                <span className="text-sm font-black text-slate-900">KSh {parseFloat(activeFolio?.totalAmount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                        <form onSubmit={handleRecordPayment}>
                            <div className="flex flex-col gap-4">
                                <div className="form-group">
                                    <label>Amount (KSh)</label>
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
