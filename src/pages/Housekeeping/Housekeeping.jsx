import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Sparkles, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Housekeeping = () => {
    const { t } = useLanguage();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/housekeeping/dirty');
            setRooms(res.data);
        } catch (err) {
            console.error('Failed to fetch rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const updateStatus = async (roomId, status) => {
        try {
            await api.post(`/housekeeping/rooms/${roomId}/status?status=${status}`);
            fetchRooms();
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Status update failed.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'DIRTY': return 'bg-red-100 text-red-600 border-red-200';
            case 'CLEANING': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'INSPECTED': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'AVAILABLE': return 'bg-green-100 text-green-600 border-green-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t('Housekeeping Board')}</h1>
                    <p className="text-slate-500 text-sm mt-1">{t('Manage room turnovers and cleaning cycles.')}</p>
                </div>
                <button 
                    onClick={fetchRooms}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    {t('Refresh')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1,2,3].map(i => (
                        <div key={i} className="premium-card h-40 animate-pulse bg-slate-50 border-slate-100"></div>
                    ))
                ) : rooms.length > 0 ? (
                    rooms.map((room) => (
                        <div key={room.id} className="premium-card !bg-white group hover:shadow-lg transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">{t('Room')} {room.roomNumber}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{room.roomType?.name || 'Standard Room'}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter border ${getStatusColor(room.status)}`}>
                                    {room.status}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3 mt-6">
                                {room.status === 'DIRTY' && (
                                    <button 
                                        onClick={() => updateStatus(room.id, 'CLEANING')}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm shadow-sm transition-all"
                                    >
                                        <Clock size={16} /> {t('Start Cleaning')}
                                    </button>
                                )}
                                {room.status === 'CLEANING' && (
                                    <button 
                                        onClick={() => updateStatus(room.id, 'INSPECTED')}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-sm transition-all"
                                    >
                                        <CheckCircle size={16} /> {t('Mark as Inspected')}
                                    </button>
                                )}
                                {room.status === 'INSPECTED' && (
                                    <button 
                                        onClick={() => updateStatus(room.id, 'AVAILABLE')}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all"
                                    >
                                        <Sparkles size={16} /> {t('Ready for Guests')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{t('All Rooms are Clean!')}</h3>
                        <p className="text-slate-400 text-sm max-w-xs mt-2">{t('There are currently no rooms marked as Dirty or Cleaning in the system.')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Housekeeping;
