import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Housekeeping.css';

const Housekeeping = () => {
    const [dirtyRooms, setDirtyRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchDirtyRooms = async () => {
        try {
            const response = await api.get('/housekeeping/dirty-rooms');
            setDirtyRooms(response.data);
        } catch (err) {
            console.error('Failed to fetch dirty rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDirtyRooms();
    }, []);

    const handleMarkClean = async (roomId) => {
        setActionLoading(roomId);
        try {
            await api.post('/housekeeping/log-action', {
                roomId: roomId,
                action: 'CLEANED',
                notes: 'Marked as clean from dashboard'
            });
            // Refresh the list
            await fetchDirtyRooms();
        } catch (err) {
            console.error('Failed to log action:', err);
            alert('Failed to update room status.');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="housekeeping-page">
            <div className="page-header">
                <div>
                    <h1>Housekeeping Dashboard</h1>
                    <p>Track and manage room cleaning and maintenance.</p>
                </div>
                <div className="stats-mini">
                    <div className="mini-card">
                        <span className="label">Attention Needed</span>
                        <span className="value">{dirtyRooms.length}</span>
                    </div>
                </div>
            </div>

            <div className="housekeeping-grid">
                {loading ? (
                    <div className="loading">Loading dirty rooms...</div>
                ) : dirtyRooms.length > 0 ? (
                    dirtyRooms.map((room) => (
                        <div key={room.id} className="room-action-card premium-card">
                            <div className="card-header">
                                <span className="room-num">Room {room.roomNumber}</span>
                                <span className={`status-tag ${room.status.toLowerCase().replace('_', '-')}`}>
                                    {room.status}
                                </span>
                            </div>
                            <div className="card-body">
                                <p className="room-type">{room.roomType?.name}</p>
                                <p className="floor-info">Floor {room.floor}</p>
                            </div>
                            <div className="card-actions">
                                <button 
                                    className="btn-primary clean-btn" 
                                    onClick={() => handleMarkClean(room.id)}
                                    disabled={actionLoading === room.id}
                                >
                                    {actionLoading === room.id ? 'Updating...' : '✨ Mark as Clean'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <span className="success-icon">✨</span>
                        <h2>All rooms are clean!</h2>
                        <p>No rooms currently require housekeeping attention.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Housekeeping;
