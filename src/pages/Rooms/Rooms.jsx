import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [formData, setFormData] = useState({
        roomNumber: '',
        floor: '',
        roomTypeId: '',
        status: 'AVAILABLE'
    });

    const [typeFormData, setTypeFormData] = useState({
        name: '',
        amenities: '',
        basePrice: ''
    });

    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredRooms = rooms.filter(room => {
        const roomNum = room.roomNumber.toLowerCase();
        const typeName = (room.roomType?.name || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return roomNum.includes(search) || typeName.includes(search);
    });

    const fetchRoomTypes = async () => {
        try {
            const res = await api.get('/room-types');
            setRoomTypes(res.data);
        } catch (err) {
            console.error('Failed to fetch room types:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateType = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...typeFormData,
                basePrice: parseFloat(typeFormData.basePrice) || 0
            };
            await api.post('/room-types', payload);
            setShowTypeModal(false);
            setTypeFormData({ name: '', amenities: '', basePrice: '' });
            fetchRoomTypes();
        } catch (err) {
            console.error('Failed to create room type', err);
            alert('Failed to create room type.');
        }
    };

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
            <div className="table-tools">
                <div className="table-search">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input 
                        type="text" 
                        placeholder="Search Room Number or Type..." 
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors" onClick={() => setShowTypeModal(true)}>
                        Configure Types
                    </button>
                    <button className="btn-primary" onClick={() => handleOpenModal()}>Add New Room</button>
                </div>
            </div>

            <div className="table-card">
                {loading && rooms.length === 0 ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium">Loading rooms...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th style={{ width: '20%' }}>Room Number</th>
                                <th style={{ width: '20%' }}>Type</th>
                                <th style={{ width: '15%' }}>Floor</th>
                                <th style={{ width: '15%' }}>Status</th>
                                <th style={{ width: '15%' }}>Housekeeping</th>
                                <th style={{ width: '15%' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRooms.length > 0 ? (
                                filteredRooms.map((room) => (
                                    <tr key={room.id}>
                                        <td className="font-bold text-slate-900">Room {room.roomNumber}</td>
                                        <td>
                                            <span className="font-semibold text-slate-700">{room.roomType?.name || '-'}</span>
                                        </td>
                                        <td>Floor {room.floor}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusClass(room.status)}`}>
                                                {room.status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                                                {room.status === 'DIRTY' ? (
                                                    <span className="text-amber-600">Needs Cleaning</span>
                                                ) : (
                                                    <span className="text-emerald-600">Clean</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="view-btn" onClick={() => handleOpenModal(room)}>Edit</button>
                                                <button className="delete-btn" onClick={() => handleDelete(room.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 text-slate-400 font-medium italic">
                                        {searchTerm ? 'No rooms match your search.' : 'No rooms found.'}
                                    </td>
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
                            <h2 className="text-xl font-bold text-primary">{editingRoom ? 'Edit Room' : 'Add New Room'}</h2>
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
            {showTypeModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[90%] !max-w-[500px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">Add Room Category</h2>
                            <button className="close-modal-btn" onClick={() => setShowTypeModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleCreateType} className="form-grid">
                            <div className="form-group full-width">
                                <label>Category Name</label>
                                <input type="text" required value={typeFormData.name} onChange={e => setTypeFormData({...typeFormData, name: e.target.value})} placeholder="e.g. Deluxe Suite" />
                            </div>
                            <div className="form-group full-width">
                                <label>Base Price (KSh)</label>
                                <input type="number" required value={typeFormData.basePrice} onChange={e => setTypeFormData({...typeFormData, basePrice: e.target.value})} placeholder="5000" />
                            </div>
                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea required value={typeFormData.description} onChange={e => setTypeFormData({...typeFormData, description: e.target.value})} placeholder="Features and amenities..." />
                            </div>
                            <div className="modal-footer col-span-full">
                                <button type="button" onClick={() => setShowTypeModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create Category</button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Rooms;
