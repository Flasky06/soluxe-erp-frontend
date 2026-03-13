import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, Search } from 'lucide-react';
import GuestForm from '../../components/GuestForm/GuestForm';

const Guests = () => {
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingGuest, setEditingGuest] = useState(null);

    const refreshData = async () => {
        try {
            const res = await api.get('/guests');
            setGuests(res.data);
            setEditingGuest(null);
        } catch (err) {
            console.error('Failed to fetch guests:', err);
            alert('Failed to load guest data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleOpenModal = (guest = null) => {
        setEditingGuest(guest);
        setShowModal(true);
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredGuests = guests.filter(g => 
        g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.idNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search guests by name, phone, email or ID..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button className="btn-primary" onClick={() => handleOpenModal()}>Register Guest</button>
                </div>
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
                            {filteredGuests.length > 0 ? filteredGuests.map((guest) => (
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
                                                <span className="font-bold text-text-dark">{guest.fullName || '-'}</span>
                                                {guest.companyName && <span className="text-[12px] text-primary font-medium">{guest.companyName}</span>}
                                                <span className="text-[12px] text-text-slate font-medium uppercase tracking-tight">
                                                    {guest.gender || '-'} • {guest.dateOfBirth || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium text-text-dark">{guest.phone || '-'}</span>
                                            <span className="text-[12px] text-text-slate italic">{guest.email || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="inline-block px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase w-fit leading-none">
                                                {guest.idType ? guest.idType.replace('_', ' ') : '-'}
                                            </span>
                                            <span className="text-xs font-mono text-text-dark tracking-wider">{guest.idNumber || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-text-dark font-medium">{guest.nationality || '-'}</span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(guest)}>Edit</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-slate-400 font-medium italic">
                                        No guests found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[80%] !max-w-[1000px] !p-0">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-text-dark leading-tight">{editingGuest ? 'Edit Guest Profile' : 'Register New Guest'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <GuestForm 
                            initialData={editingGuest} 
                            onSuccess={() => {
                                setShowModal(false);
                                refreshData();
                            }}
                            onCancel={() => setShowModal(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
        
export default Guests;
