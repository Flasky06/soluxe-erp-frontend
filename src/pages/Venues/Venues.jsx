import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Venues = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVenue, setEditingVenue] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        capacity: '',
        ratePerHour: '',
        ratePerDay: '',
        description: ''
    });

    const fetchVenues = async () => {
        try {
            const response = await api.get('/venues');
            setVenues(response.data);
        } catch (err) {
            console.error('Failed to fetch venues:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVenues();
    }, []);

    const handleOpenModal = (venue = null) => {
        if (venue) {
            setEditingVenue(venue);
            setFormData({
                name: venue.name,
                type: venue.type,
                capacity: venue.capacity,
                ratePerHour: venue.ratePerHour,
                ratePerDay: venue.ratePerDay,
                description: venue.description || ''
            });
        } else {
            setEditingVenue(null);
            setFormData({
                name: '',
                type: '',
                capacity: '',
                ratePerHour: '',
                ratePerDay: '',
                description: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingVenue) {
                await api.post(`/venues`, { ...formData, id: editingVenue.id }); // Using POST for create/update pattern if backend supports it or change to PUT
            } else {
                await api.post('/venues', formData);
            }
            setShowModal(false);
            fetchVenues();
        } catch (err) {
            console.error('Failed to save venue:', err);
            alert('Failed to save venue details.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this venue?')) return;
        try {
            await api.delete(`/venues/${id}`);
            fetchVenues();
        } catch (err) {
            console.error('Failed to delete venue:', err);
            alert('Failed to delete venue.');
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Venue Management</h1>
                    <p className="text-text-slate text-base">Manage conference halls, gardens, ballrooms and other event spaces.</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add New Venue</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading venues...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Venue Name</th>
                                <th>Type</th>
                                <th>Capacity</th>
                                <th>Hourly Rate</th>
                                <th>Daily Rate</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {venues.length > 0 ? (
                                venues.map((venue) => (
                                    <tr key={venue.id}>
                                        <td><span className="font-bold text-text-dark">{venue.name}</span></td>
                                        <td>
                                            <span className="status-badge info">{venue.type}</span>
                                        </td>
                                        <td className="text-text-slate font-medium">{venue.capacity} pax</td>
                                        <td>
                                            <span className="font-semibold text-slate-700">KES {parseFloat(venue.ratePerHour).toLocaleString()}</span>
                                        </td>
                                        <td>
                                            <span className="font-semibold text-slate-700">KES {parseFloat(venue.ratePerDay).toLocaleString()}</span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="view-btn" onClick={() => handleOpenModal(venue)}>Edit</button>
                                                <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-300 ml-2" onClick={() => handleDelete(venue.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 text-text-slate italic">No venues found. Click 'Add New Venue' to get started.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[85%] !max-w-[1000px]">
                        <div className="modal-header">
                            <h2>{editingVenue ? 'Edit Venue' : 'Add New Venue'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Venue Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                        placeholder="e.g. Grand Ballroom"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Venue Type</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.type} 
                                        onChange={(e) => setFormData({...formData, type: e.target.value})} 
                                        placeholder="e.g. Hall, Garden, Ballroom"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Capacity (Pax)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.capacity} 
                                        onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Hourly Rate (KES)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.ratePerHour} 
                                        onChange={(e) => setFormData({...formData, ratePerHour: e.target.value})} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Daily Rate (KES)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.ratePerDay} 
                                        onChange={(e) => setFormData({...formData, ratePerDay: e.target.value})} 
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea 
                                        rows="3" 
                                        value={formData.description} 
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Brief details about the venue..."
                                        className="min-h-[100px]"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">{editingVenue ? 'Update Venue' : 'Create Venue'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Venues;
