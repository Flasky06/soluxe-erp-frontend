import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Calendar, Info, ArrowLeft, User, Clock, FileText } from 'lucide-react';

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

    const fetchData = useCallback(async () => {
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
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const allRecords = [
        ...stays.map(s => ({ ...s, _type: 'STAY' })),
        ...reservations.map(r => ({ ...r, _type: 'RESERVATION' }))
    ].sort((a, b) => new Date(b.dateIn) - new Date(a.dateIn));

    const calculateNights = (inDate, outDate) => {
        if (!inDate || !outDate) return 0;
        const start = new Date(inDate);
        const end = new Date(outDate);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
    };

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
                <div className="ml-auto flex items-center gap-4">
                   <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Current Status')}</span>
                        <span className={`text-xs font-black uppercase tracking-widest ${
                            room?.status === 'AVAILABLE' ? 'text-emerald-600' :
                            room?.status === 'OCCUPIED' ? 'text-blue-600' :
                            'text-red-600'
                        }`}>{room?.status}</span>
                   </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Top Statistics Strip */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="premium-card !p-4 bg-slate-900 text-white border-none shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black">{allRecords.length}</p>
                                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{t('Total Records')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="premium-card !p-4 bg-emerald-600 text-white border-none shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black">{stays.length}</p>
                                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{t('Past Stays')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="premium-card !p-4 bg-purple-600 text-white border-none shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black">{reservations.length}</p>
                                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{t('Upcoming')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="premium-card !p-4 bg-maroon text-white border-none shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xl font-black">{room?.status === 'OCCUPIED' ? t('Occupied') : t('Idle')}</p>
                                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{t('Current State')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: Calendar */}
                <div className="premium-card !p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={16} className="text-maroon" />
                            {t('Occupancy & Booking Calendar')}
                        </h3>
                        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded bg-[#059669]"></div>
                                {t('Past Stay')}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded bg-[#9333ea]"></div>
                                {t('Reserved')}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded bg-[#dc2626]"></div>
                                {t('Active Checkout')}
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
                            height="600px"
                            displayEventTime={false}
                        />
                    </div>
                </div>

                {/* History Table below Calendar */}
                <div className="premium-card !p-0">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                         <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Info size={16} className="text-maroon" />
                            {t('Complete Stay & Reservation History')}
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('Total Records')}:</span>
                            <span className="bg-slate-900 text-white text-[11px] px-3 py-0.5 rounded-full font-black">
                                {allRecords.length}
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th>{t('Type')}</th>
                                    <th>{t('Guest Name')}</th>
                                    <th>{t('Check-In')}</th>
                                    <th>{t('Check-Out')}</th>
                                    <th>{t('Duration')}</th>
                                    <th>{t('Status')}</th>
                                    <th className="text-right">{t('System ID')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-20 text-slate-300">
                                            <Info size={40} strokeWidth={1} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-xs uppercase font-black tracking-widest">{t('No history records found for this room')}</p>
                                        </td>
                                    </tr>
                                ) : (
                                    allRecords.map((rec, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm
                                                    ${rec._type === 'RESERVATION' ? 'bg-purple-600 text-white' : 
                                                      (rec.status === 'CHECKED_OUT' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white')
                                                    }`}>
                                                    {rec._type === 'STAY' ? t('Stay') : t('Booked')}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-400">
                                                        {rec.guestName ? rec.guestName[0] : 'G'}
                                                    </div>
                                                    <span className="font-bold text-slate-800">{rec.guestName || t('Walk-in Guest')}</span>
                                                </div>
                                            </td>
                                            <td className="text-[12px] font-bold text-slate-600">
                                                {fmt(rec.dateIn)}
                                            </td>
                                            <td className="text-[12px] font-bold text-slate-600">
                                                {fmt(rec.actualDateOut || rec.dateOut)}
                                            </td>
                                            <td>
                                                <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                    {calculateNights(rec.dateIn, rec.dateOut)} {t('Nights')}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColor(rec.status)}`}>
                                                    {rec.status?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="text-right text-[11px] font-bold text-slate-400">
                                                #{rec.id}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomDetails;
