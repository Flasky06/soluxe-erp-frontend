import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Rooms.css';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newRoom, setNewRoom] = useState({
        roomNumber: '',
        floor: '',
        roomTypeId: '',
        status: 'AVAILABLE'
    });

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            await api.post('/rooms', {
                roomNumber: newRoom.roomNumber,
                floor: newRoom.floor,
                roomType: { id: parseInt(newRoom.roomTypeId) },
                status: newRoom.status
            });
            setShowModal(false);
            const response = await api.get('/rooms');
            setRooms(response.data);
            setNewRoom({ roomNumber: '', floor: '', roomTypeId: '', status: 'AVAILABLE' });
        } catch (err) {
            console.error('Failed to create room:', err);
            alert('Failed to create room.');
        }
    };

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await api.get('/rooms');
                setRooms(response.data);
            } catch (err) {
                console.error('Failed to fetch rooms:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, []);

    const getStatusClass = (status) => {
        if (!status) return 'unknown';
        return status.toLowerCase().replace('_', '-');
    };

    return (
        <div className="rooms-page">
            <div className="page-header">
                <div>
                    <h1>Room Management</h1>
                    <p>Manage your hotel inventory and housekeeping status.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add New Room</button>
            </div>

            <div className="premium-card table-container">
                {loading ? (
                    <div className="loading">Loading rooms...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Room Number</th>
                                <th>Type</th>
                                <th>Floor</th>
                                <th>Status</th>
                                <th>Housekeeping</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.length > 0 ? (
                                rooms.map((room) => (
                                    <tr key={room.id}>
                                        <td className="bold">Room {room.roomNumber}</td>
                                        <td>{room.roomType?.name || 'N/A'}</td>
                                        <td>Floor {room.floor}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(room.status)}`}>
                                                {room.status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="housekeeping-info">
                                                {room.status === 'DIRTY' ? '🧹 Needs Cleaning' : '✨ Clean'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="edit-btn">Edit</button>
                                                <button className="view-btn">View</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="empty-state">No rooms found. Add your first room to get started.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-md">
                        <div className="modal-header">
                            <h2>Add New Room</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateRoom}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Room Number</label>
                                    <input type="text" required value={newRoom.roomNumber} onChange={(e) => setNewRoom({...newRoom, roomNumber: e.target.value})} placeholder="e.g. 101" />
                                </div>
                                <div className="form-group">
                                    <label>Floor</label>
                                    <input type="text" required value={newRoom.floor} onChange={(e) => setNewRoom({...newRoom, floor: e.target.value})} placeholder="e.g. 1" />
                                </div>
                                <div className="form-group">
                                    <label>Room Type ID</label>
                                    <input type="number" required value={newRoom.roomTypeId} onChange={(e) => setNewRoom({...newRoom, roomTypeId: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={newRoom.status} onChange={(e) => setNewRoom({...newRoom, status: e.target.value})}>
                                        <option value="AVAILABLE">AVAILABLE</option>
                                        <option value="OCCUPIED">OCCUPIED</option>
                                        <option value="MAINTENANCE">MAINTENANCE</option>
                                        <option value="DIRTY">DIRTY</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Save Room</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rooms;
