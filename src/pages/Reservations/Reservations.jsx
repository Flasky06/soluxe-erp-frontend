import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import './Reservations.css';

const Reservations = () => {
    const { user } = useAuthStore();
    const [reservations, setReservations] = useState([]);
    const [guests, setGuests] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [tables, setTables] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    
    const [formData, setFormData] = useState({
        guestId: '',
        bookingType: 'ROOM', // 'ROOM', 'TABLE', 'BOTH'
        roomTypeId: '',
        dateIn: '',
        dateOut: '',
        adults: 1,
        children: 0,
        
        // Table specific
        tableId: '',
        tableReservationTime: '',
        tablePax: 1,

        // Guest details sync
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

    const [checkInData, setCheckInData] = useState({
        roomId: ''
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

    useEffect(() => {
        fetchAllData();
    }, []);

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
            const payload = { ...formData };
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
                await api.post('/reservations', {
                    ...payload,
                    status: 'BOOKED'
                });
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

    const handleOpenCheckIn = async (res) => {
        setSelectedReservation(res);
        try {
            const response = await api.get('/rooms');
            const filtered = response.data.filter(r => 
                r.status === 'AVAILABLE' && r.roomType?.id === res.roomTypeId
            );
            setAvailableRooms(filtered);
            setCheckInData({ roomId: '' });
            setShowCheckInModal(true);
        } catch (err) {
            console.error('Failed to fetch rooms:', err);
            alert('Could not fetch available rooms.');
        }
    };

    const handleSubmitCheckIn = async (e) => {
        e.preventDefault();
        try {
            await api.post('/stays/check-in', { 
                reservationId: selectedReservation.id, 
                roomId: checkInData.roomId,
                userId: user?.id || 1
            });
            setShowCheckInModal(false);
            fetchAllData();
        } catch (err) {
            console.error('Failed to check in:', err);
            alert('Check-in failed.');
        }
    };

    const handleCheckOut = async (id) => {
        if (!window.confirm('Confirm check-out for this guest? Room will be set to DIRTY.')) return;
        try {
            await api.post(`/stays/checkout-by-reservation/${id}?userId=${user?.id || 1}`);
            fetchAllData();
        } catch (err) {
            console.error('Failed to check out:', err);
            alert(err.response?.data?.message || 'Check-out failed.');
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
        <div className="reservations-page">
            <div className="page-header">
                <div>
                    <h1>Reservations & Bookings</h1>
                    <p>Manage room stays and restaurant table reservations.</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenBookingModal()}>+ New Reservation</button>
            </div>

            <div className="premium-card table-container">
                {loading && reservations.length === 0 ? (
                    <div className="loading">Loading reservations...</div>
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
                                            <div className="guest-info">
                                                <span className="bold">{getGuestName(res.guestId)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="booking-details">
                                                {res.roomTypeId && (
                                                    <div className="detail-item">🛏️ {getRoomTypeName(res.roomTypeId)}</div>
                                                )}
                                                {res.tableId && (
                                                    <div className="detail-item">🍽️ {getTableName(res.tableId)}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {res.dateIn ? (
                                                <div className="stay-dates">
                                                    {new Date(res.dateIn).toLocaleDateString()} - {new Date(res.dateOut).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                <div className="table-time">
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
                                                        {res.roomTypeId && (
                                                            <button className="view-btn" onClick={() => handleOpenCheckIn(res)}>Check In</button>
                                                        )}
                                                        <button className="edit-btn" onClick={() => handleOpenBookingModal(res)}>Edit</button>
                                                        <button className="edit-btn" style={{backgroundColor: '#fee2e2', color: '#dc2626'}} onClick={() => handleCancelBooking(res.id)}>Cancel</button>
                                                    </>
                                                )}
                                                {res.status === 'CHECKED_IN' && (
                                                    <button className="view-btn" onClick={() => handleCheckOut(res.id)} style={{backgroundColor: '#f59e0b', color: 'white', border: 'none'}}>Check Out</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="empty-state">No reservations found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showBookingModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card reservations-modal">
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
                                    <div className="radio-group" style={{display: 'flex', gap: '20px', marginTop: '8px'}}>
                                        <label><input type="radio" value="ROOM" checked={formData.bookingType === 'ROOM'} onChange={(e) => setFormData({...formData, bookingType: e.target.value})} /> Room Only</label>
                                        <label><input type="radio" value="TABLE" checked={formData.bookingType === 'TABLE'} onChange={(e) => setFormData({...formData, bookingType: e.target.value})} /> Table Only</label>
                                        <label><input type="radio" value="BOTH" checked={formData.bookingType === 'BOTH'} onChange={(e) => setFormData({...formData, bookingType: e.target.value})} /> Room + Table</label>
                                    </div>
                                </div>

                                {(formData.bookingType === 'ROOM' || formData.bookingType === 'BOTH') && (
                                    <>
                                        <div className="form-section-title full-width" style={{marginTop: '10px', fontWeight: 'bold', color: '#1e40af', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px'}}>Room Details</div>
                                        <div className="form-group">
                                            <label>Room Type</label>
                                            <select 
                                                required={formData.bookingType !== 'TABLE'}
                                                value={formData.roomTypeId} 
                                                onChange={(e) => setFormData({...formData, roomTypeId: parseInt(e.target.value)})}
                                            >
                                                <option value="">-- Choose Room Type --</option>
                                                {roomTypes.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name} - ${type.defaultRate}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Adults / Children</label>
                                            <div style={{display: 'flex', gap: '8px'}}>
                                                <input type="number" min="1" required value={formData.adults} onChange={(e) => setFormData({...formData, adults: e.target.value})} />
                                                <input type="number" min="0" value={formData.children} onChange={(e) => setFormData({...formData, children: e.target.value})} />
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
                                        <div className="form-section-title full-width" style={{marginTop: '10px', fontWeight: 'bold', color: '#1e40af', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px'}}>Restaurant Details</div>
                                        <div className="form-group">
                                            <label>Select Table</label>
                                            <select 
                                                required={formData.bookingType !== 'ROOM'}
                                                value={formData.tableId} 
                                                onChange={(e) => setFormData({...formData, tableId: parseInt(e.target.value)})}
                                            >
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

                                <div className="form-section-title full-width" style={{marginTop: '10px', fontWeight: 'bold', color: '#1e40af', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px'}}>Additional Information</div>
                                <div className="form-group">
                                    <label>Nationality / ID Info</label>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                        <input type="text" value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} placeholder="Nationality" style={{flex: 1}} />
                                        <select value={formData.idType} onChange={(e) => setFormData({...formData, idType: e.target.value})} style={{flex: 1}}>
                                            <option value="PASSPORT">Passport</option>
                                            <option value="NATIONAL_ID">National ID</option>
                                        </select>
                                        <input type="text" value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} placeholder="ID Number" style={{flex: 1.5}} />
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Vehicle / Emergency Contact</label>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                        <input type="text" value={formData.vehicleRegistration} onChange={(e) => setFormData({...formData, vehicleRegistration: e.target.value})} placeholder="Vehicle Reg" style={{flex: 1}} />
                                        <input type="text" value={formData.emergencyContactName} onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})} placeholder="Contact Name" style={{flex: 1}} />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Special Requests & Preferences</label>
                                    <textarea value={formData.specialRequests} onChange={(e) => setFormData({...formData, specialRequests: e.target.value})} style={{minHeight: '60px'}} placeholder="Requests..." />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowBookingModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{selectedReservation ? 'Save Changes' : 'Create Booking'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Check-in Modal */}
            {showCheckInModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card modal-md">
                        <div className="modal-header">
                            <h2>Check-in: Select Room</h2>
                            <button className="close-modal-btn" onClick={() => setShowCheckInModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmitCheckIn}>
                            <div className="check-in-info">
                                <p><strong>Guest:</strong> {getGuestName(selectedReservation.guestId)}</p>
                                <p><strong>Category:</strong> {getRoomTypeName(selectedReservation.roomTypeId)}</p>
                            </div>
                            <div className="form-group full-width">
                                <label>Available Rooms</label>
                                <select 
                                    required 
                                    value={checkInData.roomId} 
                                    onChange={(e) => setCheckInData({ roomId: e.target.value })}
                                >
                                    <option value="">-- Select Room Number --</option>
                                    {availableRooms.map(room => (
                                        <option key={room.id} value={room.id}>Room {room.roomNumber} - Floor {room.floor}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowCheckInModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary" disabled={!checkInData.roomId}>Complete Check-in</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservations;
