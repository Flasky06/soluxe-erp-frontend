import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Reservations.css';

const Reservations = () => {
    const [reservations, setReservations] = useState([]);
    const [guests, setGuests] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newBooking, setNewBooking] = useState({
        guestId: '',
        roomTypeId: '',
        dateIn: '',
        dateOut: '',
        adults: 1,
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
            const [resResponse, guestsResponse, typesResponse] = await Promise.all([
                api.get('/reservations'),
                api.get('/guests'),
                api.get('/room-types')
            ]);
            setReservations(resResponse.data);
            setGuests(guestsResponse.data);
            setRoomTypes(typesResponse.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestChange = (guestId) => {
        const guest = guests.find(g => g.id === parseInt(guestId));
        if (guest) {
            setNewBooking({
                ...newBooking,
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
            setNewBooking({
                ...newBooking,
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

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reservations', {
                ...newBooking,
                status: 'BOOKED'
            });
            setShowModal(false);
            fetchAllData();
            setNewBooking({ 
                guestId: '', 
                roomTypeId: '', 
                dateIn: '', 
                dateOut: '', 
                adults: 1,
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
        } catch (err) {
            console.error('Failed to create booking:', err);
            alert('Failed to create booking.');
        }
    };

    const handleCheckIn = async (id) => {
        try {
            await api.post(`/reservations/${id}/check-in`);
            fetchAllData();
        } catch (err) {
            console.error('Failed to check in:', err);
            alert('Failed to check in.');
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

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
        return type ? type.name : `Type ${id}`;
    };

    return (
        <div className="reservations-page">
            <div className="page-header">
                <div>
                    <h1>Reservations</h1>
                    <p>Manage guest bookings and upcoming arrivals.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>+ Create New Booking</button>
            </div>

            <div className="premium-card table-container">
                {loading && reservations.length === 0 ? (
                    <div className="loading">Loading reservations...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Guest</th>
                                <th>Room Type</th>
                                <th>Check In</th>
                                <th>Check Out</th>
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
                                        <td>{getRoomTypeName(res.roomTypeId)}</td>
                                        <td>{res.dateIn ? new Date(res.dateIn).toLocaleDateString() : 'N/A'}</td>
                                        <td>{res.dateOut ? new Date(res.dateOut).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(res.status)}`}>
                                                {res.status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                {res.status !== 'CHECKED_IN' && res.status !== 'CHECKED_OUT' && (
                                                    <button className="view-btn" onClick={() => handleCheckIn(res.id)}>Check In</button>
                                                )}
                                                <button className="edit-btn">Edit</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="empty-state">No reservations found. Create your first booking today.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card reservations-modal">
                        <div className="modal-header">
                            <h2>Create New Booking</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateBooking}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Select Guest</label>
                                    <select 
                                        required 
                                        value={newBooking.guestId} 
                                        onChange={(e) => handleGuestChange(e.target.value)}
                                    >
                                        <option value="">-- Choose Guest --</option>
                                        {guests.map(guest => (
                                            <option key={guest.id} value={guest.id}>{guest.fullName} ({guest.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Nationality</label>
                                    <input type="text" value={newBooking.nationality} onChange={(e) => setNewBooking({...newBooking, nationality: e.target.value})} placeholder="e.g. American" />
                                </div>
                                <div className="form-grid" style={{gap: '12px'}}>
                                    <div className="form-group">
                                        <label>ID Type</label>
                                        <select value={newBooking.idType} onChange={(e) => setNewBooking({...newBooking, idType: e.target.value})}>
                                            <option value="PASSPORT">Passport</option>
                                            <option value="NATIONAL_ID">National ID</option>
                                            <option value="DRIVING_LICENSE">Driving License</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>ID Number</label>
                                        <input type="text" value={newBooking.idNumber} onChange={(e) => setNewBooking({...newBooking, idNumber: e.target.value})} placeholder="ID Number" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Vehicle Registration</label>
                                    <input type="text" value={newBooking.vehicleRegistration} onChange={(e) => setNewBooking({...newBooking, vehicleRegistration: e.target.value})} placeholder="e.g. ABC-1234" />
                                </div>
                                <div className="form-grid triple" style={{gridColumn: 'span 1', gap: '12px'}}>
                                    <div className="form-group" style={{gridColumn: 'span 2'}}>
                                        <label>Emergency Contact Name</label>
                                        <input type="text" value={newBooking.emergencyContactName} onChange={(e) => setNewBooking({...newBooking, emergencyContactName: e.target.value})} placeholder="Name" />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input type="text" value={newBooking.emergencyContactPhone} onChange={(e) => setNewBooking({...newBooking, emergencyContactPhone: e.target.value})} placeholder="Phone" />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Arrival Time (ETA)</label>
                                    <input type="time" value={newBooking.eta} onChange={(e) => setNewBooking({...newBooking, eta: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Departure Time (ETD)</label>
                                    <input type="time" value={newBooking.etd} onChange={(e) => setNewBooking({...newBooking, etd: e.target.value})} />
                                </div>

                                <div className="form-group">
                                    <label>Room Type</label>
                                    <select 
                                        required 
                                        value={newBooking.roomTypeId} 
                                        onChange={(e) => setNewBooking({...newBooking, roomTypeId: parseInt(e.target.value)})}
                                    >
                                        <option value="">-- Choose Room Type --</option>
                                        {roomTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name} - ${type.defaultRate}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Adults</label>
                                    <input type="number" min="1" required value={newBooking.adults} onChange={(e) => setNewBooking({...newBooking, adults: e.target.value})} />
                                </div>

                                <div className="form-group">
                                    <label>Check-in Date</label>
                                    <input type="date" required value={newBooking.dateIn} onChange={(e) => setNewBooking({...newBooking, dateIn: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Check-out Date</label>
                                    <input type="date" required value={newBooking.dateOut} onChange={(e) => setNewBooking({...newBooking, dateOut: e.target.value})} />
                                </div>

                                <div className="form-group full-width">
                                    <label>Stay-Specific Special Requests</label>
                                    <textarea value={newBooking.specialRequests} onChange={(e) => setNewBooking({...newBooking, specialRequests: e.target.value})} style={{minHeight: '80px'}} placeholder="Requests for this stay..." />
                                </div>

                                <div className="form-group full-width">
                                    <label>General Guest Preferences & Notes</label>
                                    <textarea value={newBooking.preferences} onChange={(e) => setNewBooking({...newBooking, preferences: e.target.value})} style={{minHeight: '80px'}} placeholder="Allergies, room preferences, dietary restrictions..." />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create Booking</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservations;
