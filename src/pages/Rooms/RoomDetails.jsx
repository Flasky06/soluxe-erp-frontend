import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, LogIn, LogOut, Info, ArrowLeft, Building2, User, Phone, MapPin } from 'lucide-react';

const fmt = (dt) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + '  '
        + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const statusColor = (s) => {
    if (!s) return 'bg-slate-100 text-slate-500';
    const m = s.toLowerCase();
    if (m === 'checked_in' || m === 'active') return 'bg-emerald-100 text-emerald-700';
    if (m === 'checked_out') return 'bg-slate-100 text-slate-500';
    if (m.includes('overdue')) return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
};

const RoomDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [room, setRoom] = useState(null);
    const [stays, setStays] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [roomRes, staysRes, reservationsRes] = await Promise.all([
                api.get(`/rooms/${id}`),
                api.get('/stays').catch(() => ({ data: [] })),
                api.get('/reservations').catch(() => ({ data: [] }))
            ]);

            setRoom(roomRes.data);

            const allStays = Array.isArray(staysRes.data)
                ? staysRes.data
                : (staysRes.data?.content || []);
            const allReservations = Array.isArray(reservationsRes.data)
                ? reservationsRes.data
                : (reservationsRes.data?.content || []);

            const roomStays = allStays.filter(s => String(s.roomId) === String(id));
            const roomReservations = allReservations.filter(r => String(r.roomId) === String(id));

            setStays(roomStays);
            setReservations(roomReservations);

            // Build calendar events
            const events = [];
            roomStays.forEach(s => {
                if (s.dateIn) {
                    const end = s.dateOut
                        ? new Date(new Date(s.dateOut).getTime() + 86400000).toISOString().split('T')[0]
                        : s.dateIn.split('T')[0];

                    let color = '#059669'; // Emerald-600 (Active)
                    if (s.status?.toUpperCase() === 'CHECKED_OUT') {
                        color = '#dc2626'; // Red-600 (Previous)
                    }

                    events.push({
                        title: s.guestName || 'Stay',
                        start: s.dateIn.split('T')[0],
                        end,
                        display: 'background',
                        backgroundColor: color,
                        extendedProps: { type: 'STAY', status: s.status }
                    });
                }
            });

            roomReservations.forEach(r => {
                if (r.dateIn) {
                    const end = r.dateOut
                        ? new Date(new Date(r.dateOut).getTime() + 86400000).toISOString().split('T')[0]
                        : r.dateIn;

                    events.push({
                        title: r.guestName || 'Reservation',
                        start: r.dateIn,
                        end,
                        display: 'background',
                        backgroundColor: '#9333ea', // Purple-600 (Future)
                        extendedProps: { type: 'RESERVATION', status: r.status }
                    });
                }
            });

            setCalendarEvents(events);
        } catch (err) {
            console.error('Failed to fetch room details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const allRecords = [
        ...stays.map(s => ({ ...s, _type: 'STAY' })),
        ...reservations.map(r => ({ ...r, _type: 'RESERVATION' }))
    ].sort((a, b) => new Date(b.dateIn) - new Date(a.dateIn));

    if (loading && !room) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-slate-400 font-bold animate-pulse">{t('Loading room details...')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/rooms')}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-maroon hover:border-maroon/20 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                        {t('Room')} {room?.roomNumber}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{room?.roomType?.name}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('Floor')} {room?.floor}</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border shadow-sm ${
                         room?.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                         room?.status === 'OCCUPIED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                         room?.status === 'DIRTY' ? 'bg-red-50 text-red-600 border-red-100' :
                         'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                        {room?.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Occupancy & Calendar */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                    <div className="premium-card !p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={16} className="text-maroon" />
                                {t('Occupancy Calendar')}
                            </h3>
                            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded bg-[#059669]"></div>
                                    {t('Stay')}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded bg-[#9333ea]"></div>
                                    {t('Reserved')}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded bg-[#dc2626]"></div>
                                    {t('Checkout')}
                                </div>
                            </div>
                        </div>
                        <div className="calendar-container">
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                events={calendarEvents}
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: ''
                                }}
                                height="650px"
                                displayEventTime={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Right: History & Info */}
                <div className="flex flex-col gap-6">
                    {/* Quick Info */}
                    <div className="premium-card !p-6 bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-maroon/20 blur-[60px] rounded-full -mr-10 -mt-10"></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">{t('Quick Stats')}</h3>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div>
                                <p className="text-2xl font-black">{stays.length}</p>
                                <p className="text-[10px] uppercase font-bold text-white/40">{t('Total Stays')}</p>
                            </div>
                            <div>
                                <p className="text-2xl font-black">{reservations.length}</p>
                                <p className="text-[10px] uppercase font-bold text-white/40">{t('Upcoming')}</p>
                            </div>
                        </div>
                    </div>

                    {/* History List */}
                    <div className="premium-card !p-0 flex flex-col h-[550px]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Info size={16} className="text-maroon" />
                                {t('Stay History')}
                            </h3>
                            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-black">
                                {allRecords.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                            {allRecords.length === 0 ? (
                                <div className="text-center py-20 text-slate-300">
                                    <Info size={40} strokeWidth={1} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-xs uppercase font-black tracking-widest">{t('No history available')}</p>
                                </div>
                            ) : (
                                allRecords.map((rec, idx) => (
                                    <div key={idx} className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow group">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full 
                                                ${rec._type === 'RESERVATION' ? 'bg-purple-600 text-white' : 
                                                  (rec.status === 'CHECKED_OUT' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white')
                                                }`}>
                                                {rec._type === 'STAY' ? t('Stay') : t('Reservation')}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColor(rec.status)}`}>
                                                {rec.status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-maroon/10 group-hover:text-maroon transition-colors">
                                                {rec.guestName ? rec.guestName[0] : 'G'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 leading-none">{rec.guestName || 'Walk-in Guest'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">ID: #{rec.id}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('In')}</p>
                                                <p className="text-xs font-black text-slate-700">{fmt(rec.dateIn)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Out')}</p>
                                                <p className="text-xs font-black text-slate-700">{fmt(rec.dateOut)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomDetails;
