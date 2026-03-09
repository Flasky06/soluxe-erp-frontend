import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const CheckIn = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('reservation'); // 'reservation' | 'walkin'
    const [loading, setLoading] = useState(true);

    // Reservation check-in state
    const [reservations, setReservations] = useState([]);
    const [guests, setGuests] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [showReservationModal, setShowReservationModal] = useState(false);
    const [resCheckInRoomId, setResCheckInRoomId] = useState('');

    // Walk-in state
    const [allRooms, setAllRooms] = useState([]);
    const [walkInData, setWalkInData] = useState({
        guestId: '',
        roomId: '',
        adults: 1,
        children: 0,
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
        const filtered = allRooms.filter(r => r.status === 'AVAILABLE' && (r.roomType?.id === res.roomTypeId || r.roomTypeId === res.roomTypeId));
        setAvailableRooms(filtered);
        setShowReservationModal(true);
    };

    const handleResCheckIn = async (e) => {
        e.preventDefault();
        try {
            await api.post('/stays/check-in', {
                reservationId: selectedReservation.id,
                roomId: parseInt(resCheckInRoomId),
                userId: user?.id || 1,
            });
            setShowReservationModal(false);
            fetchAllData();
        } catch (err) {
            console.error('Reservation check-in failed:', err);
            alert(err.response?.data?.message || 'Check-in failed.');
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
                userId: user?.id || 1,
            });
            setWalkInSuccess(`✅ Walk-in successful! Stay #${res.data.id} is now ACTIVE.`);
            setWalkInData({ guestId: '', roomId: '', adults: 1, children: 0 });
            fetchAllData();
        } catch (err) {
            setWalkInError(err.response?.data?.message || 'Walk-in check-in failed. Please try again.');
        } finally {
            setWalkInLoading(false);
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Check-in</h1>
                    <p className="text-text-slate text-base">Process guest arrivals — from reservations or walk-ins.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-border-gray">
                <button
                    onClick={() => setActiveTab('reservation')}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${activeTab === 'reservation' ? 'border-maroon text-maroon' : 'border-transparent text-text-slate hover:text-text-dark'}`}
                >
                    🗓️ From Reservation
                </button>
                <button
                    onClick={() => setActiveTab('walkin')}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${activeTab === 'walkin' ? 'border-maroon text-maroon' : 'border-transparent text-text-slate hover:text-text-dark'}`}
                >
                    🚶 Walk-in
                </button>
            </div>

            {/* RESERVATION TAB */}
            {activeTab === 'reservation' && (
                <div className="premium-card overflow-x-auto">
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
            )}

            {/* WALK-IN TAB */}
            {activeTab === 'walkin' && (
                <div className="premium-card !max-w-[700px]">
                    <h2 className="text-lg font-bold text-text-dark mb-1">Walk-in Check-in</h2>
                    <p className="text-text-slate text-sm mb-6">Assign a room directly to a guest without a prior reservation.</p>

                    {walkInSuccess && (
                        <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium">{walkInSuccess}</div>
                    )}
                    {walkInError && (
                        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{walkInError}</div>
                    )}

                    <form onSubmit={handleWalkIn} className="form-grid">
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
                            <span
                                className="text-xs text-maroon underline cursor-pointer mt-1 inline-block"
                                onClick={() => navigate('/guests')}
                            >
                                + Add new guest
                            </span>
                        </div>

                        <div className="form-group full-width">
                            <label>Select Available Room</label>
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

                        <div className="col-span-full mt-4">
                            <button type="submit" className="btn-primary w-full" disabled={walkInLoading}>
                                {walkInLoading ? 'Processing...' : '✅ Complete Walk-in Check-in'}
                            </button>
                        </div>
                    </form>
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
                                    <p className="text-red-500 text-sm font-medium mt-1">⚠️ No available rooms match this category.</p>
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
                                <button type="submit" className="btn-primary" disabled={!resCheckInRoomId || availableRooms.length === 0}>Complete Check-in</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckIn;
