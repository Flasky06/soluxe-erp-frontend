import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [formData, setFormData] = useState({
        roomNumber: '',
        floor: '',
        roomTypeId: '',
        status: 'AVAILABLE'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [roomsRes, typesRes] = await Promise.all([
                api.get('/rooms'),
                api.get('/room-types')
            ]);
            setRooms(roomsRes.data);
            setRoomTypes(typesRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (room = null) => {
        if (room) {
            setEditingRoom(room);
            setFormData({
                roomNumber: room.roomNumber,
                floor: room.floor,
                roomTypeId: room.roomType?.id || '',
                status: room.status
            });
        } else {
            setEditingRoom(null);
            setFormData({ roomNumber: '', floor: '', roomTypeId: '', status: 'AVAILABLE' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                roomNumber: formData.roomNumber,
                floor: formData.floor,
                roomTypeId: parseInt(formData.roomTypeId) || 0,
                status: formData.status
            };

            if (editingRoom) {
                await api.put(`/rooms/${editingRoom.id}`, payload);
            } else {
                await api.post('/rooms', payload);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save room:', err);
            alert('Failed to save room.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this room?')) {
            try {
                await api.delete(`/rooms/${id}`);
                fetchData();
            } catch (err) {
                console.error('Failed to delete room:', err);
                alert('Failed to delete room.');
            }
        }
    };

    const getStatusClass = (status) => {
        if (!status) return 'unknown';
        return status.toLowerCase().replace('_', '-');
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-end items-center mb-8">
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add New Room</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading && rooms.length === 0 ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading rooms...</div>
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
                                        <td className="font-bold text-text-dark">Room {room.roomNumber}</td>
                                        <td>{room.roomType?.name || 'N/A'}</td>
                                        <td>Floor {room.floor}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(room.status)}`}>
                                                {room.status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 text-xs font-medium">
                                                {room.status === 'DIRTY' ? (
                                                    <span className="text-amber-600">Needs Cleaning</span>
                                                ) : (
                                                    <span className="text-green-600">Clean</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="view-btn" onClick={() => handleOpenModal(room)}>Edit</button>
                                                <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-300" onClick={() => handleDelete(room.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 text-text-slate italic">No rooms found. Add your first room to get started.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[70%] !max-w-[800px]">
                        <div className="modal-header">
                            <h2>{editingRoom ? 'Edit Room' : 'Add New Room'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Room Number</label>
                                    <input type="text" required value={formData.roomNumber} onChange={(e) => setFormData({...formData, roomNumber: e.target.value})} placeholder="e.g. 101" />
                                </div>
                                <div className="form-group">
                                    <label>Floor</label>
                                    <input type="text" required value={formData.floor} onChange={(e) => setFormData({...formData, floor: e.target.value})} placeholder="e.g. 1" />
                                </div>
                                <div className="form-group">
                                    <label>Room Category</label>
                                    <select 
                                        required 
                                        value={formData.roomTypeId} 
                                        onChange={(e) => setFormData({...formData, roomTypeId: e.target.value})}
                                    >
                                        <option value="">-- Select Type --</option>
                                        {roomTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                                        <option value="AVAILABLE">AVAILABLE</option>
                                        <option value="OCCUPIED">OCCUPIED</option>
                                        <option value="MAINTENANCE">MAINTENANCE</option>
                                        <option value="DIRTY">DIRTY</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">{editingRoom ? 'Save Changes' : 'Save Room'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rooms;
