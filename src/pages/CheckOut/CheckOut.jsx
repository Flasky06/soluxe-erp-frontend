import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const CheckOut = () => {
    const { user } = useAuthStore();
    const [stays, setStays] = useState([]);
    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staysRes, guestsRes, roomsRes] = await Promise.all([
                api.get('/stays'),
                api.get('/guests'),
                api.get('/rooms')
            ]);
            
            // Filter only active stays
            const activeStays = staysRes.data.filter(s => s.status === 'ACTIVE');
            setStays(activeStays);
            setGuests(guestsRes.data);
            setRooms(roomsRes.data);
        } catch (err) {
            console.error('Failed to fetch check-out data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCheckOut = async (stayId) => {
        if (!window.confirm('Confirm check-out for this guest? Room will be set to DIRTY.')) return;
        try {
            await api.post(`/stays/${stayId}/check-out?userId=${user?.id || 1}`);
            fetchData();
        } catch (err) {
            console.error('Failed to check out:', err);
            alert(err.response?.data?.message || 'Check-out failed.');
        }
    };

    const getGuestName = (guestId) => {
        const guest = guests.find(g => g.id === guestId);
        return guest ? guest.fullName : `Guest ${guestId}`;
    };

    const getRoomNumber = (roomId) => {
        const room = rooms.find(r => r.id === roomId);
        return room ? room.roomNumber : 'N/A';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Guest Check-out</h1>
                    <p className="text-text-slate text-base">Manage departures and finalize guest stays.</p>
                </div>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading active stays...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Room</th>
                                <th>Guest</th>
                                <th>Date In</th>
                                <th>Expected Out</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stays.length > 0 ? (
                                stays.map((stay) => (
                                    <tr key={stay.id}>
                                        <td><span className="font-bold text-text-dark">Room {getRoomNumber(stay.roomId)}</span></td>
                                        <td>{getGuestName(stay.guestId)}</td>
                                        <td>{formatDate(stay.dateIn)}</td>
                                        <td>{formatDate(stay.dateOut)}</td>
                                        <td>
                                            <span className="status-badge active">Checked In</span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button 
                                                    className="bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white px-4 py-1.5 rounded-md text-[12px] font-bold transition-all duration-300 shadow-sm"
                                                    onClick={() => handleCheckOut(stay.id)}
                                                >
                                                    Process Check-out
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 text-text-slate italic">No active stays found. All guests have been checked out.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CheckOut;
