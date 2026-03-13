import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const RoomTypes = () => {
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        defaultRate: '',
        weekendRate: '',
        capacity: 2,
        bedType: 'Queen',
        amenities: ''
    });

    const fetchRoomTypes = async () => {
        try {
            const response = await api.get('/room-types');
            setRoomTypes(response.data);
        } catch (err) {
            console.error('Failed to fetch room types:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoomTypes();
    }, []);

    const handleOpenModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name,
                description: type.description || '',
                defaultRate: type.defaultRate || '',
                weekendRate: type.weekendRate || '',
                capacity: type.capacity || 2,
                bedType: type.bedType || 'Queen',
                amenities: type.amenities || ''
            });
        } else {
            setEditingType(null);
            setFormData({ 
                name: '', 
                description: '', 
                defaultRate: '',
                weekendRate: '',
                capacity: 2,
                bedType: 'Queen',
                amenities: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                defaultRate: parseFloat(formData.defaultRate) || 0,
                weekendRate: parseFloat(formData.weekendRate) || 0
            };
            if (editingType) {
                await api.put(`/room-types/${editingType.id}`, payload);
            } else {
                await api.post('/room-types', payload);
            }
            setShowModal(false);
            fetchRoomTypes();
        } catch (err) {
            console.error('Failed to save room type:', err);
            alert('Failed to save room type.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this room type?')) {
            try {
                await api.delete(`/room-types/${id}`);
                fetchRoomTypes();
            } catch (err) {
                console.error('Failed to delete room type:', err);
                alert('Failed to delete room type.');
            }
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Room Types</h1>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Room Type</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading room types...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Details</th>
                                <th>Capacity</th>
                                <th>Default Rate</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roomTypes.map((type) => (
                                <tr key={type.id}>
                                    <td><span className="font-bold text-text-dark">{type.name}</span></td>
                                    <td className="max-w-md">
                                        <div className="flex flex-col gap-1">
                                            <p className="line-clamp-2 text-text-slate text-sm">{type.description || 'No description'}</p>
                                            {type.amenities && <p className="text-xs text-slate-500 italic line-clamp-1">Includes: {type.amenities}</p>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-700">{type.capacity} Guests</span>
                                            <span className="text-xs text-slate-500">{type.bedType}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-text-dark">KSh {parseFloat(type.defaultRate || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">Base</span></span>
                                            {type.weekendRate && (
                                                <span className="font-semibold text-slate-500 text-sm">KSh {parseFloat(type.weekendRate).toLocaleString()} <span className="text-[10px] font-normal">Wknd</span></span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(type)}>Edit</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-300" onClick={() => handleDelete(type.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[70%] !max-w-[800px]">
                        <div className="modal-header">
                            <h2>{editingType ? 'Edit Room Type' : 'Add Room Type'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. Deluxe Suite"
                                    />
                                </div>
                                <div className="form-group full-width">
                                        <label>Description</label>
                                        <textarea 
                                            value={formData.description} 
                                            onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                            placeholder="Enter details..."
                                            className="min-h-[80px]"
                                            rows="2"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Max Capacity</label>
                                        <input 
                                            type="number" 
                                            required 
                                            min="1"
                                            value={formData.capacity} 
                                            onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 1})} 
                                            placeholder="2"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Bed Type</label>
                                        <select 
                                            value={formData.bedType} 
                                            onChange={(e) => setFormData({...formData, bedType: e.target.value})}
                                        >
                                            <option value="Single">Single</option>
                                            <option value="Double">Double</option>
                                            <option value="Twin">Twin</option>
                                            <option value="Queen">Queen</option>
                                            <option value="King">King</option>
                                        </select>
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Amenities (comma separated)</label>
                                        <textarea 
                                            value={formData.amenities} 
                                            onChange={(e) => setFormData({...formData, amenities: e.target.value})} 
                                            placeholder="e.g. WiFi, AC, Mini-bar, Ocean View"
                                            className="min-h-[60px]"
                                            rows="2"
                                        />
                                    </div>
                                <div className="form-group">
                                    <label>Default Rate (KSh)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.defaultRate} 
                                        onChange={(e) => setFormData({...formData, defaultRate: e.target.value})} 
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Weekend Rate (KSh)</label>
                                    <input 
                                        type="number" 
                                        value={formData.weekendRate} 
                                        onChange={(e) => setFormData({...formData, weekendRate: e.target.value})} 
                                        placeholder="Optional..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">Save Room Type</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomTypes;
