import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Housekeeping = () => {
    const [dirtyRooms, setDirtyRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchDirtyRooms = async () => {
        try {
            const response = await api.get('/housekeeping/dirty-rooms');
            setDirtyRooms(response.data);
        } catch (err) {
            console.error('Failed to fetch dirty rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDirtyRooms();
    }, []);

    const handleMarkClean = async (roomId) => {
        setActionLoading(roomId);
        try {
            await api.post('/housekeeping/log-action', {
                roomId: roomId,
                action: 'CLEANED',
                notes: 'Marked as clean from dashboard'
            });
            // Refresh the list
            await fetchDirtyRooms();
        } catch (err) {
            console.error('Failed to log action:', err);
            alert('Failed to update room status.');
        } finally {
            setActionLoading(null);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredRooms = dirtyRooms.filter(room => 
        room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.roomType?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input 
                        type="text" 
                        placeholder="Search Room Number or Type..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg flex items-center gap-3">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Attention Needed</span>
                        <span className="text-xl font-black text-amber-700">{dirtyRooms.length}</span>
                    </div>
                </div>
            </div>

            <div className="table-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-24 text-text-slate animate-pulse text-lg font-medium italic">Synchronizing housekeeping records...</div>
                ) : filteredRooms.length > 0 ? (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Room Number</th>
                                <th>Category</th>
                                <th>Floor</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRooms.map((room) => (
                                <tr key={room.id}>
                                    <td className="font-bold text-text-dark">Room {room.roomNumber}</td>
                                    <td>
                                        <span className="font-semibold text-slate-700 uppercase text-[12px] tracking-wide">{room.roomType?.name || '-'}</span>
                                    </td>
                                    <td>
                                        <span className="text-slate-500 font-medium">Floor {room.floor}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${
                                            room.status === 'DIRTY' ? 'danger' : 
                                            room.status === 'CLEANING' ? 'warning' : 'success'
                                        }`}>
                                            {room.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button 
                                                className="btn-primary !py-1.5 !px-4 !text-[11px]" 
                                                onClick={() => handleMarkClean(room.id)}
                                                disabled={actionLoading === room.id}
                                            >
                                                {actionLoading === room.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Processing
                                                    </div>
                                                ) : 'Mark Clean'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-dashed border-slate-200">HQ</div>
                        <div className="max-w-md">
                            <h2 className="text-xl font-bold text-slate-800 mb-1">
                                {searchTerm ? 'No matching rooms found' : 'All rooms are clean!'}
                            </h2>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                {searchTerm ? `No rooms match your search for "${searchTerm}"` : 'No rooms currently require housekeeping attention.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Housekeeping;
