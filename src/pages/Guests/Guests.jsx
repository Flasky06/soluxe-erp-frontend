import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User } from 'lucide-react';

const Guests = () => {
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showIdTypeModal, setShowIdTypeModal] = useState(false);
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
    const [serverErrors, setServerErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

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

    const handleCreateIdType = async (e) => {
        e.preventDefault();
        try {
            const name = e.target.name.value;
            const description = e.target.description.value;
            const res = await api.post('/id-types', { name, description });
            
            // Refresh idTypes list
            const idTypesRes = await api.get('/id-types');
            setIdTypes(idTypesRes.data);
            
            // Select the new type in formData
            setFormData(prev => ({ ...prev, idTypeId: res.data.id }));
            
            setShowIdTypeModal(false);
        } catch (err) {
            console.error('Failed to create ID Type:', err);
            alert('Failed to create ID type');
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
        setServerErrors({});
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerErrors({});
        setIsSaving(true);
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
            if (err.response && (err.response.status === 400 || err.response.status === 409)) {
                setServerErrors(err.response.data);
            } else {
                alert('Failed to save guest. Please check your inputs.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-end items-center gap-4 mb-8">
                <button 
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors" 
                    onClick={() => setShowIdTypeModal(true)}
                >
                    Manage ID Types
                </button>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Register Guest</button>
            </div>

            <div className="table-card overflow-x-auto">
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
                            <h2 className="text-xl font-bold text-text-dark leading-tight">{editingGuest ? 'Edit Guest Profile' : 'Register New Guest'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        {serverErrors.error && (
                            <div className="mx-8 mt-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                                {serverErrors.error}
                            </div>
                        )}
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
                                    {serverErrors.fullName && <p className="text-red-500 text-[10px] mt-1">{serverErrors.fullName}</p>}
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Email Address</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
                                    {serverErrors.email && <p className="text-red-500 text-[10px] mt-1">{serverErrors.email}</p>}
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Company Name</label>
                                    <input type="text" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} placeholder="Optional: Corporate Guest" />
                                </div>
                                <div className="form-group leading-tight">
                                    <label>Phone Number</label>
                                    <input type="text" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 890" />
                                    {serverErrors.phone && <p className="text-red-500 text-[10px] mt-1">{serverErrors.phone}</p>}
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
                                    <input type="text" required value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} placeholder="ID Number" />
                                    {serverErrors.idNumber && <p className="text-red-500 text-[10px] mt-1">{serverErrors.idNumber}</p>}
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
                                <button type="submit" className="btn-primary !px-10" disabled={isSaving}>
                                    {isSaving ? 'Registering...' : editingGuest ? 'Update Guest' : 'Save Guest Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ID Type Modal */}
            {showIdTypeModal && (
                <div className="modal-overlay z-[1001]">
                    <div className="modal-content premium-card !w-[90%] !max-w-[400px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">Add ID Type</h2>
                            <button className="close-modal-btn" onClick={() => setShowIdTypeModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateIdType} className="p-4">
                            <div className="form-group">
                                <label>Type Name</label>
                                <input name="name" type="text" required placeholder="e.g. Driver's License" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input name="description" type="text" placeholder="e.g. State issued license" />
                            </div>
                            <div className="modal-footer !px-0 mt-6">
                                <button type="button" onClick={() => setShowIdTypeModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create Type</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Guests;
