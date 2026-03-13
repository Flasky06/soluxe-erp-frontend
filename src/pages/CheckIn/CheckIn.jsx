import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import GuestForm from '../../components/GuestForm/GuestForm';

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

    // Walk-in state
    const [allRooms, setAllRooms] = useState([]);
    const [walkInData, setWalkInData] = useState({
        guestId: '',
        roomId: '',
        adults: 1,
        children: 0,
        dateOut: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
    });
    const [walkInLoading, setWalkInLoading] = useState(false);
    const [walkInSuccess, setWalkInSuccess] = useState(null);
    const [walkInError, setWalkInError] = useState(null);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [resRes, guestsRes, typesRes, roomsRes] = await Promise.all([
                api.get('/reservations'),
                api.get('/guests'),
                api.get('/room-types'),
                api.get('/rooms'),
            ]);
            // Only BOOKED room reservations can be checked in
            setReservations(resRes.data.filter(r => r.status === 'BOOKED' && r.roomTypeId));
            setGuests(guestsRes.data);
            setRoomTypes(typesRes.data);
            setAllRooms(roomsRes.data);
        } catch (err) {
            console.error('Failed to load check-in data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAllData(); }, []);

    const getGuestName = (id) => {
        const g = guests.find(g => g.id === id);
        return g ? g.fullName : `Guest #${id}`;
    };

    const getRoomTypeName = (id) => {
        const t = roomTypes.find(t => t.id === id);
        return t ? t.name : `Type #${id}`;
    };

    // --- RESERVATION CHECK-IN ---
    const handleOpenResModal = async (res) => {
        setSelectedReservation(res);
        setResCheckInRoomId('');
        const availableAll = allRooms.filter(r => r.status === 'AVAILABLE');
        const filtered = availableAll.filter(r => {
            const rTypeId = r.roomType?.id ?? r.roomTypeId;
            return Number(rTypeId) === Number(res.roomTypeId);
        });
        
        if (filtered.length === 0 && res.roomTypeId) {
            console.warn(`No rooms found for RoomType ID: ${res.roomTypeId}. Falling back to all available rooms.`);
        }
        setAvailableRooms(filtered.length > 0 ? filtered : availableAll);
        setShowReservationModal(true);
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

    // --- WALK-IN CHECK-IN ---
    const availableWalkInRooms = allRooms.filter(r => r.status === 'AVAILABLE');

    const handleWalkIn = async (e) => {
        e.preventDefault();
        setWalkInLoading(true);
        setWalkInSuccess(null);
        setWalkInError(null);
        try {
            const res = await api.post('/stays/walk-in', {
                guestId: parseInt(walkInData.guestId),
                roomId: parseInt(walkInData.roomId),
                adults: parseInt(walkInData.adults) || 1,
                children: parseInt(walkInData.children) || 0,
                dateOut: `${walkInData.dateOut}T11:00:00`,
                userId: user?.id || 1,
            });
            setWalkInSuccess(`Walk-in successful. Stay #${res.data.id} is now ACTIVE.`);
            setWalkInData({ 
                guestId: '', 
                roomId: '', 
                adults: 1, 
                children: 0,
                dateOut: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
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
                    + Walk-in Check-in
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
                            <h2 className="text-xl font-bold text-text-dark">Walk-in Check-in</h2>
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
        </div>
    );
};

export default CheckIn;
