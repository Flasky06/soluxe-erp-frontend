import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Clock, LogIn, LogOut, Calendar, User, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Attendance = () => {
    const { t } = useLanguage();
    const { user } = useAuthStore();
    const [records, setRecords] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [currentSession, setCurrentSession] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [recordsRes, empRes] = await Promise.all([
                api.get('/attendance-records'),
                api.get('/employees')
            ]);
            setRecords(recordsRes.data);
            setEmployees(empRes.data);

            // Check if user is clocked in today
            const today = new Date().toISOString().split('T')[0];
            const activeSession = recordsRes.data.find(r => 
                r.employeeId === user?.employeeId && 
                r.date === today && 
                !r.clockOut
            );
            
            if (activeSession) {
                setIsClockedIn(true);
                setCurrentSession(activeSession);
            } else {
                setIsClockedIn(false);
                setCurrentSession(null);
            }
        } catch (err) {
            console.error('Failed to fetch attendance data:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.employeeId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleClockInOut = async () => {
        try {
            const now = new Date();
            const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss
            const dateStr = now.toISOString().split('T')[0];

            if (isClockedIn && currentSession) {
                // Clock Out
                await api.put(`/attendance-records/${currentSession.id}`, {
                    ...currentSession,
                    clockOut: timeStr
                });
                alert('Clocked out successfully!');
            } else {
                // Clock In
                await api.post('/attendance-records', {
                    employeeId: user?.employeeId,
                    date: dateStr,
                    clockIn: timeStr,
                    status: 'PRESENT',
                    recordedById: user?.id
                });
                alert('Clocked in successfully!');
            }
            fetchData();
        } catch (err) {
            console.error('Clock in/out failed:', err);
            alert('Action failed. Please try again.');
        }
    };

    const getEmployeeName = (id) => employees.find(e => e.id === id)?.fullName || `Employee #${id}`;

    const filteredRecords = records.filter(r => 
        getEmployeeName(r.employeeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.date.includes(searchTerm)
    );

    return (
        <div className="flex flex-col gap-8">
            {/* Quick Action Card */}
            <div className="premium-card bg-maroon text-white p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div className="flex flex-col gap-2 relative z-10">
                    <h2 className="text-2xl font-black tracking-tight">Daily Attendance</h2>
                    <p className="text-white/70 font-medium">Capture your work hours and stay update with your schedule.</p>
                </div>
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="flex flex-col items-end">
                        <span className="text-3xl font-mono font-black">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">{new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                    </div>
                    
                    <button 
                        onClick={handleClockInOut}
                        className={`h-16 px-8 rounded-2xl flex items-center gap-3 font-bold text-lg transition-all duration-300 shadow-xl
                            ${isClockedIn 
                                ? 'bg-white text-maroon hover:bg-white/90 active:scale-95' 
                                : 'bg-yellow text-maroon hover:bg-yellow-dark active:scale-95'}`}
                    >
                        {isClockedIn ? <LogOut size={24} /> : <LogIn size={24} />}
                        {isClockedIn ? 'Clock Out' : 'Clock In Now'}
                    </button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-yellow/10 rounded-full blur-2xl"></div>
            </div>

            {/* Attendance Logs */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-text-dark flex items-center gap-2">
                        <Clock className="text-maroon" size={20} />
                        Attendance Logs
                    </h3>
                    
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-maroon transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by name or date..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-maroon/10 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="premium-card">
                    <div className="overflow-x-auto w-full">
                        <table className="management-table" style={{ minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th>{t('Employee')}</th>
                                    <th>{t('Date')}</th>
                                    <th>{t('Clock In')}</th>
                                    <th>{t('Clock Out')}</th>
                                    <th>{t('Task Hours')}</th>
                                    <th>{t('Status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="6" className="py-6"><div className="h-4 bg-slate-100 rounded"></div></td>
                                        </tr>
                                    ))
                                ) : filteredRecords.length > 0 ? (
                                    filteredRecords.map(record => (
                                        <tr key={record.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-500">
                                                        {getEmployeeName(record.employeeId).substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-text-dark">{getEmployeeName(record.employeeId)}</span>
                                                </div>
                                            </td>
                                            <td><span className="text-text-slate font-medium">{record.date}</span></td>
                                            <td><span className="text-green-600 font-bold">{record.clockIn || '--:--'}</span></td>
                                            <td><span className="text-maroon font-bold">{record.clockOut || '--:--'}</span></td>
                                            <td><span className="font-mono text-text-dark">{record.hoursWorked ? `${record.hoursWorked} hrs` : '--'}</span></td>
                                            <td>
                                                <span className={`status-badge ${record.status === 'PRESENT' ? 'success' : 'warning'}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-text-slate italic">No attendance records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </div>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
