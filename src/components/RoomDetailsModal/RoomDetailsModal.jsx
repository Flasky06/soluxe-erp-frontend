import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../../services/api';
import Modal from '../Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { X, Calendar, Clock, User, Info } from 'lucide-react';

const RoomDetailsModal = ({ isOpen, onClose, roomId, roomNumber }) => {
    const { t } = useLanguage();
    const [history, setHistory] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchRoomData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [historyRes, calendarRes] = await Promise.all([
                api.get(`/rooms/${roomId}/history`),
                api.get(`/rooms/${roomId}/calendar`)
            ]);
            setHistory(historyRes.data.items);
            
            // Map calendar events for FullCalendar
            const events = calendarRes.data.map(item => ({
                title: item.type === 'STAY' ? 'Occupied' : 'Reserved',
                start: item.timestamp,
                end: item.description.includes('until') ? item.description.split('until ')[1] : item.timestamp,
                backgroundColor: item.type === 'STAY' ? '#14532d' : '#a855f7',
                borderColor: 'transparent',
                extendedProps: { ...item }
            }));
            setCalendarEvents(events);
        } catch (err) {
            console.error('Failed to fetch room details:', err);
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    const fetchHistoryByDate = React.useCallback(async () => {
        try {
            const res = await api.get(`/rooms/${roomId}/history`, { params: { date: selectedDate } });
            setHistory(res.data.items);
        } catch (err) {
            console.error('Failed to fetch history for date:', err);
        }
    }, [roomId, selectedDate]);

    useEffect(() => {
        if (isOpen && roomId) {
            fetchRoomData();
        }
    }, [isOpen, roomId, fetchRoomData]);

    useEffect(() => {
        if (isOpen && roomId && selectedDate) {
            fetchHistoryByDate();
        }
    }, [isOpen, roomId, selectedDate, fetchHistoryByDate]);

    const handleDateClick = (arg) => {
        setSelectedDate(arg.dateStr);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`${t('Room')} ${roomNumber} - ${t('History & Calendar')}`}
            size="lg"
            customClasses="!w-[90%] !max-w-[1200px]"
        >
            <div className="flex flex-col lg:flex-row gap-6 p-2 h-[75vh]">
                {/* Left Side: Calendar */}
                <div className="flex-1 bg-white rounded-xl border border-slate-100 p-4 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold uppercase tracking-wider text-xs">
                        <Calendar size={14} className="text-maroon" />
                        {t('Occupancy Calendar')}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={calendarEvents}
                            dateClick={handleDateClick}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: ''
                            }}
                            height="100%"
                            themeSystem="standard"
                        />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#14532d]"></div>
                            {t('Stay')}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#a855f7]"></div>
                            {t('Reserved')}
                        </div>
                    </div>
                </div>

                {/* Right Side: History Timeline */}
                <div className="w-full lg:w-[400px] bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-slate-800 font-bold uppercase tracking-wider text-xs">
                            <Clock size={14} className="text-maroon" />
                            {t('History')}
                        </div>
                        {selectedDate && (
                            <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-500 font-bold">
                                {selectedDate}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
                        {loading ? (
                            <div className="text-center py-20 text-slate-400 animate-pulse">{t('Loading history...')}</div>
                        ) : history.length > 0 ? (
                            history.map((item, idx) => (
                                <div key={idx} className="relative pl-6 pb-2 group">
                                    {/* Timeline line */}
                                    <div className="absolute left-[7px] top-2 bottom-0 w-[2px] bg-slate-200 group-last:hidden"></div>
                                    {/* Timeline dot */}
                                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ring-2 ring-slate-100 bg-maroon z-10"></div>
                                    
                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black uppercase text-maroon/60 tracking-widest">{item.type}</span>
                                            <span className="text-[9px] font-bold text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 font-semibold leading-relaxed">{item.description}</p>
                                        {item.status && (
                                            <div className="mt-2 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.status}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300 opacity-60">
                                <Info size={32} strokeWidth={1.5} className="mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">{t('No activity found')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default RoomDetailsModal;
