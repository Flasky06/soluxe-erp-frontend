import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './RoomTypes.css';

const RoomTypes = () => {
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        defaultRate: ''
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
                defaultRate: type.defaultRate
            });
        } else {
            setEditingType(null);
            setFormData({ name: '', description: '', defaultRate: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await api.put(`/room-types/${editingType.id}`, formData);
            } else {
                await api.post('/room-types', formData);
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
        <div className="room-types-page">
            <div className="page-header">
                <div>
                    <h1>Room Types</h1>
                    <p>Manage room categories and default pricing plans.</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add Room Type</button>
            </div>

            <div className="premium-card table-container">
                {loading ? (
                    <div className="loading">Loading room types...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Default Rate</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roomTypes.map((type) => (
                                <tr key={type.id}>
                                    <td><span className="bold">{type.name}</span></td>
                                    <td>{type.description || 'No description'}</td>
                                    <td>${type.defaultRate}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(type)}>Edit</button>
                                            <button className="edit-btn" style={{backgroundColor: '#fee2e2', color: '#dc2626'}} onClick={() => handleDelete(type.id)}>Delete</button>
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
                    <div className="modal-content modal-md">
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
                                        rows="3"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Default Rate ($)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.defaultRate} 
                                        onChange={(e) => setFormData({...formData, defaultRate: e.target.value})} 
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Save Room Type</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomTypes;
