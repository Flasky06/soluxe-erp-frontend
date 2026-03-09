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

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Housekeeping Dashboard</h1>
                    <p className="text-text-slate text-base">Track and manage room cleaning and maintenance.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-amber-50 border border-amber-200 px-6 py-3 rounded-2xl flex flex-col shadow-sm">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Attention Needed</span>
                        <span className="text-2xl font-black text-amber-700">{dirtyRooms.length}</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-40 text-text-slate animate-pulse text-xl font-medium italic">Loading dirty rooms...</div>
            ) : dirtyRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {dirtyRooms.map((room) => (
                        <div key={room.id} className="premium-card p-6 flex flex-col gap-4 group hover:border-primary/30 transition-all border-transparent border-2">
                            <div className="flex justify-between items-start">
                                <span className="text-xl font-extrabold text-slate-800">Room {room.roomNumber}</span>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                    room.status === 'DIRTY' ? 'bg-red-50 text-red-600' : 
                                    room.status === 'CLEANING' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                                }`}>
                                    {room.status}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 border-y border-slate-100 py-3">
                                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">{room.roomType?.name}</p>
                                <p className="text-[12px] text-slate-400 font-medium">Floor {room.floor}</p>
                            </div>
                            <div className="mt-2">
                                <button 
                                    className="w-full btn-primary py-2.5 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2" 
                                    onClick={() => handleMarkClean(room.id)}
                                    disabled={actionLoading === room.id}
                                >
                                    {actionLoading === room.id ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Updating...
                                        </span>
                                    ) : 'Mark as Clean'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 text-center gap-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px]">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-4xl shadow-inner">✨</div>
                    <div className="max-w-md">
                        <h2 className="text-2xl font-black text-slate-800 mb-2">All rooms are clean!</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">No rooms currently require housekeeping attention. Excellent work by the team!</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Housekeeping;
