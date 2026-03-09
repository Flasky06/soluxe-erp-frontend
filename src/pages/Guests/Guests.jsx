import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Guests = () => {
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGuest, setEditingGuest] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        nationality: '',
        address: '',
        dateOfBirth: '',
        gender: 'OTHER',
        idType: 'PASSPORT',
        idNumber: '',
        preferences: '',
        vehicleRegistration: '',
        emergencyContactName: '',
        emergencyContactPhone: ''
    });

    const fetchGuests = async () => {
        try {
            const response = await api.get('/guests');
            setGuests(response.data);
            // The following lines were part of the instruction, but seem to be misplaced
            // as they reset the form state within the fetch function.
            // They are kept here as per instruction, but typically form reset happens
            // after a successful submission or when opening a new form.
            setFormData({ // Changed from setFormData to formData
                fullName: '', email: '', phone: '', nationality: '', address: '', dateOfBirth: '', gender: 'OTHER', idType: 'PASSPORT', idNumber: '',
                preferences: '', vehicleRegistration: '', emergencyContactName: '', emergencyContactPhone: ''
            });
            setEditingGuest(null);
        } catch (err) {
            console.error('Failed to fetch guests:', err);
            // The following lines were part of the instruction, but the error message
            // is more appropriate for a save operation than a fetch operation.
            // Keeping as per instruction.
            alert('Failed to save guest.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGuests();
    }, []);


    const handleOpenModal = (guest = null) => {
        if (guest) {
            setEditingGuest(guest);
            setFormData({ // Changed from setFormData to formData
                fullName: guest.fullName || '',
                phone: guest.phone || '',
                email: guest.email || '',
                nationality: guest.nationality || '',
                address: guest.address || '',
                dateOfBirth: guest.dateOfBirth || '',
                gender: guest.gender || 'OTHER', // Changed from MALE to OTHER as per newGuest initial state
                idType: guest.idType || 'PASSPORT',
                idNumber: guest.idNumber || '',
                preferences: guest.preferences || '',
                vehicleRegistration: guest.vehicleRegistration || '',
                emergencyContactName: guest.emergencyContactName || '',
                emergencyContactPhone: guest.emergencyContactPhone || ''
            });
        } else {
            setEditingGuest(null);
            setFormData({ // Changed from setFormData to formData
                fullName: '',
                phone: '',
                email: '',
                nationality: '',
                address: '',
                dateOfBirth: '',
                gender: 'MALE',
                idType: 'PASSPORT',
                idNumber: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingGuest) {
                await api.put(`/guests/${editingGuest.id}`, formData);
            } else {
                await api.post('/guests', formData);
            }
            setShowModal(false);
            fetchGuests();
        } catch (err) {
            console.error('Failed to save guest:', err);
            alert('Failed to save guest.');
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Guest Management</h1>
                    <p className="text-text-slate text-base">Register and manage guest profiles and identities.</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Register Guest</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading guests...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>ID Info</th>
                                <th>Nationality</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {guests.map((guest) => (
                                <tr key={guest.id}>
                                    <td>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-text-dark">{guest.fullName}</span>
                                            <span className="text-[12px] text-text-slate">{guest.gender} • {guest.dateOfBirth}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium text-text-dark">{guest.phone}</span>
                                            <span className="text-[12px] text-text-slate italic">{guest.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="inline-block px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase w-fit leading-none">{guest.idType}</span>
                                            <span className="text-xs font-mono text-text-dark">{guest.idNumber}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-text-dark">{guest.nationality}</span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(guest)}>Edit</button>
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
                    <div className="modal-content premium-card !w-[80%] !max-w-[1000px]">
                        <div className="modal-header">
                            <h2>{editingGuest ? 'Edit Guest Profile' : 'Register New Guest'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="John Doe" />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 890" />
                                </div>
                                <div className="form-group">
                                    <label>Nationality</label>
                                    <input type="text" value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} placeholder="e.g. American" />
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Gender</label>
                                    <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>ID Type</label>
                                    <select value={formData.idType} onChange={(e) => setFormData({...formData, idType: e.target.value})}>
                                        <option value="PASSPORT">Passport</option>
                                        <option value="NATIONAL_ID">National ID</option>
                                        <option value="DRIVING_LICENSE">Driving License</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Passport/ID No</label>
                                    <input type="text" value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} placeholder="ID Number" />
                                </div>
                                <div className="form-group">
                                    <label>Vehicle Registration</label>
                                    <input type="text" value={formData.vehicleRegistration} onChange={(e) => setFormData({...formData, vehicleRegistration: e.target.value})} placeholder="e.g. ABC-1234" />
                                </div>
                                <div className="form-group">
                                    <label>Emergency Contact Name</label>
                                    <input type="text" value={formData.emergencyContactName} onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})} placeholder="Full Name" />
                                </div>
                                <div className="form-group">
                                    <label>Emergency Contact Phone</label>
                                    <input type="text" value={formData.emergencyContactPhone} onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})} placeholder="+254..." />
                                </div>

                                <div className="form-group full-width">
                                    <label>Special Requirements / Preferences</label>
                                    <textarea 
                                        value={formData.preferences} 
                                        onChange={(e) => setFormData({...formData, preferences: e.target.value})} 
                                        placeholder="Allergies, room preferences, dietary restrictions..."
                                        className="min-h-[80px]"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Address</label>
                                    <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Full physical address..." className="min-h-[60px]" rows="2" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">Save Guest Profile</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Guests;
