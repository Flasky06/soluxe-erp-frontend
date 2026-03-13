import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User } from 'lucide-react';

const Guests = () => {
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGuest, setEditingGuest] = useState(null);
    const [idTypes, setIdTypes] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        nationality: '',
        companyName: '',
        address: '',
        dateOfBirth: '',
        gender: 'OTHER',
        idTypeId: '',
        idNumber: '',
        preferences: '',
        vehicleRegistration: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        imageUrl: ''
    });

    const refreshData = async () => {
        try {
            const [guestsRes, idTypesRes] = await Promise.all([
                api.get('/guests'),
                api.get('/id-types')
            ]);
            setGuests(guestsRes.data);
            setIdTypes(idTypesRes.data);
            
            setFormData({
                fullName: '', email: '', phone: '', nationality: '', companyName: '', address: '', dateOfBirth: '', gender: 'OTHER', idTypeId: idTypesRes.data[0]?.id || '', idNumber: '',
                preferences: '', vehicleRegistration: '', emergencyContactName: '', emergencyContactPhone: '', imageUrl: ''
            });
            setEditingGuest(null);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            alert('Failed to load guest data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('upload_preset', 'soluxe'); 
        uploadData.append('cloud_name', 'Root');

        try {
            const response = await fetch('https://api.cloudinary.com/v1_1/Root/image/upload', {
                method: 'POST',
                body: uploadData,
            });
            const data = await response.json();
            if (data.secure_url) {
                setFormData({ ...formData, imageUrl: data.secure_url });
            } else {
                console.error('Upload failed:', data);
                alert('Image upload failed. Please ensure you have an unsigned upload preset named "ml_default" on your Cloudinary account.');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image.');
        } finally {
            setUploading(false);
        }
    };

    const handleOpenModal = (guest = null) => {
        if (guest) {
            setEditingGuest(guest);
            setFormData({
                fullName: guest.fullName || '',
                phone: guest.phone || '',
                email: guest.email || '',
                nationality: guest.nationality || '',
                companyName: guest.companyName || '',
                address: guest.address || '',
                dateOfBirth: guest.dateOfBirth || '',
                gender: guest.gender || 'OTHER',
                idTypeId: guest.idTypeId || '',
                idNumber: guest.idNumber || '',
                preferences: guest.preferences || '',
                vehicleRegistration: guest.vehicleRegistration || '',
                emergencyContactName: guest.emergencyContactName || '',
                emergencyContactPhone: guest.emergencyContactPhone || '',
                imageUrl: guest.imageUrl || ''
            });
        } else {
            setEditingGuest(null);
            setFormData({
                fullName: '',
                phone: '',
                email: '',
                nationality: '',
                companyName: '',
                address: '',
                dateOfBirth: '',
                gender: 'MALE',
                idTypeId: idTypes.length > 0 ? idTypes[0].id : '',
                idNumber: '',
                imageUrl: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                idTypeId: parseInt(formData.idTypeId) || 0
            };
            if (editingGuest) {
                await api.put(`/guests/${editingGuest.id}`, payload);
            } else {
                await api.post('/guests', payload);
            }
            setShowModal(false);
            refreshData();
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
                                <th>Guest</th>
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
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                                                {guest.imageUrl ? (
                                                    <img src={guest.imageUrl} alt={guest.fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                                                        {guest.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-text-dark">{guest.fullName}</span>
                                                {guest.companyName && <span className="text-[12px] text-primary font-medium">{guest.companyName}</span>}
                                                <span className="text-[12px] text-text-slate font-medium uppercase tracking-tight">{guest.gender} • {guest.dateOfBirth}</span>
                                            </div>
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
                                            <span className="inline-block px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase w-fit leading-none">{guest.idTypeName}</span>
                                            <span className="text-xs font-mono text-text-dark tracking-wider">{guest.idNumber}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-text-dark font-medium">{guest.nationality}</span>
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
                            <div>
                                <h2 className="text-xl font-bold text-text-dark leading-tight">{editingGuest ? 'Edit Guest Profile' : 'Register New Guest'}</h2>
                                <p className="text-sm text-text-slate mt-0.5">Please fill in all identity information accurately.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                {/* Profile Image Upload Row */}
                                <div className="col-span-full border-b border-slate-100 pb-6 mb-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Profile Picture</label>
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                                            {formData.imageUrl ? (
                                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-slate-300 text-3xl"><User size={48} /></div>
                                            )}
                                            {uploading && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="btn-secondary !py-2 !px-4 text-xs cursor-pointer inline-block w-fit">
                                                {formData.imageUrl ? 'Change Photo' : 'Upload Photo'}
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                            </label>
                                            <p className="text-[11px] text-text-slate leading-relaxed max-w-[200px]">JPG, PNG or GIF. Max 5MB recommended.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group leading-tight">
                                    <label>Full Name</label>
                                    <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="John Doe" />
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Email Address</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Company Name</label>
                                    <input type="text" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} placeholder="Optional: Corporate Guest" />
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Phone Number</label>
                                    <input type="text" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 890" />
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Nationality</label>
                                    <input type="text" value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} placeholder="e.g. American" />
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Date of Birth</label>
                                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} />
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Gender</label>
                                    <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="form-group leading-tight">
                                    <label>ID Type</label>
                                    <select required value={formData.idTypeId} onChange={(e) => setFormData({...formData, idTypeId: e.target.value})}>
                                        {idTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Passport/ID No</label>
                                    <input type="text" value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} placeholder="ID Number" />
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Vehicle Registration</label>
                                    <input type="text" value={formData.vehicleRegistration} onChange={(e) => setFormData({...formData, vehicleRegistration: e.target.value})} placeholder="e.g. ABC-1234" />
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Emergency Contact Name</label>
                                    <input type="text" value={formData.emergencyContactName} onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})} placeholder="Full Name" />
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Emergency Contact Phone</label>
                                    <input type="text" value={formData.emergencyContactPhone} onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})} placeholder="+254..." />
                                </div>

                                <div className="form-group full-width leading-tight">
                                    <label>Special Requirements / Preferences</label>
                                    <textarea 
                                        value={formData.preferences} 
                                        onChange={(e) => setFormData({...formData, preferences: e.target.value})} 
                                        placeholder="Allergies, room preferences, dietary restrictions..."
                                        className="min-h-[80px]"
                                    />
                                </div>
                                <div className="form-group full-width leading-tight">
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
