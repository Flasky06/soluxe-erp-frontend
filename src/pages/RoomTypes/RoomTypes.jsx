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
        capacity: 2,
        bedType: 'Queen'
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
            // Merge features/amenities into description for the form if they exist separately in DB
            const mergedDesc = [type.description, type.amenities].filter(Boolean).join('\nAmenities: ');
            setFormData({
                name: type.name,
                description: mergedDesc,
                defaultRate: type.defaultRate || '',
                capacity: type.capacity || 2,
                bedType: type.bedType || 'Queen'
            });
        } else {
            setEditingType(null);
            setFormData({ 
                name: '', 
                description: '', 
                defaultRate: '',
                capacity: 2,
                bedType: 'Queen'
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
                // We'll send empty or same for weekendRate to satisfy backend if required
                weekendRate: parseFloat(formData.defaultRate) || 0,
                amenities: '' // Moved into description
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
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium">Loading room directory...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th style={{ width: '25%' }}>Type Name</th>
                                <th style={{ width: '45%' }}>Description & Amenities</th>
                                <th style={{ width: '15%' }}>Setup</th>
                                <th style={{ width: '15%' }}>Rate</th>
                                <th style={{ width: '15%' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roomTypes.map((type) => (
                                <tr key={type.id}>
                                    <td><span className="font-bold text-slate-800">{type.name}</span></td>
                                    <td>
                                        <div className="flex flex-col">
                                            <p className="line-clamp-2 text-slate-600 text-sm leading-snug">{type.description || 'No details'}</p>
                                            {type.amenities && <p className="text-[11px] text-slate-400 mt-1 italic">Features: {type.amenities}</p>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{type.capacity} Pax</span>
                                            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{type.bedType}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="font-extrabold text-slate-900 tracking-tight">KSh {parseFloat(type.defaultRate || 0).toLocaleString()}</span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(type)}>Edit</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all" onClick={() => handleDelete(type.id)}>Delete</button>
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
                    <div className="modal-content premium-card !w-[85%] !max-w-[700px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">{editingType ? 'Edit Room Type' : 'Register New Type'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Room Category Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. Executive Queen Suite"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Max Occupancy</label>
                                    <input 
                                        type="number" 
                                        required 
                                        min="1"
                                        value={formData.capacity} 
                                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 1})} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bed Configuration</label>
                                    <select 
                                        value={formData.bedType} 
                                        onChange={(e) => setFormData({...formData, bedType: e.target.value})}
                                    >
                                        <option value="Single">Single Bed</option>
                                        <option value="Double">Double Bed</option>
                                        <option value="Twin">Twin Beds</option>
                                        <option value="Queen">Queen Size</option>
                                        <option value="King">King Size</option>
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label>Description & Amenities</label>
                                    <textarea 
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                        placeholder="Enter room details and amenities here..."
                                        className="min-h-[120px]"
                                        rows="4"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Room Rate (KSh per Night)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.defaultRate} 
                                        onChange={(e) => setFormData({...formData, defaultRate: e.target.value})} 
                                        placeholder="0.00"
                                        className="!text-lg !font-bold text-primary"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">Save Settings</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomTypes;
