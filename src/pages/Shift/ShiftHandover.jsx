import React, { useState, useEffect } from 'react';
import { 
    Clock, 
    ArrowRightLeft, 
    Calendar, 
    DollarSign, 
    User, 
    ClipboardList,
    AlertCircle,
    CheckCircle2,
    CalendarDays,
    History
} from 'lucide-react';
import shiftService from '../../services/shiftService';
import useAuthStore from '../../store/authStore';
import { format } from 'date-fns';
import { useLanguage } from '../../context/LanguageContext';

const ShiftHandover = () => {
    const { t } = useLanguage();
    const { user } = useAuthStore();
    const [currentShift, setCurrentShift] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clockingIn, setClockingIn] = useState(false);
    const [clockingOut, setClockingOut] = useState(false);
    
    // Form states
    const [shiftType, setShiftType] = useState('DAY_SHIFT');
    const [employeeId, setEmployeeId] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const current = await shiftService.getCurrentShift();
            setCurrentShift(current);
            
            const past = await shiftService.getShiftHistory();
            setHistory(past);
        } catch (error) {
            console.error('Error fetching shift data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClockIn = async (e) => {
        e.preventDefault();
        setClockingIn(true);
        try {
            const newShift = await shiftService.clockIn(shiftType, employeeId);
            setCurrentShift(newShift);
            // Refresh history to see active shift
            const past = await shiftService.getShiftHistory();
            setHistory(past);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to clock in');
        } finally {
            setClockingIn(false);
        }
    };

    const handleClockOut = async (e) => {
        e.preventDefault();
        setClockingOut(true);
        try {
            await shiftService.clockOut(currentShift.id, notes);
            setCurrentShift(null);
            setNotes('');
            // Refresh history
            const past = await shiftService.getShiftHistory();
            setHistory(past);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to clock out');
        } finally {
            setClockingOut(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <ArrowRightLeft className="text-maroon h-8 w-8" />
                        {t('Receptionist Handover')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('Manage your daily shifts and earnings records')}</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <CalendarDays className="text-maroon h-5 w-5" />
                    <span className="font-semibold text-slate-700">{format(new Date(), 'EEEE, MMMM do, yyyy')}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Shift / Clock In Column */}
                <div className="lg:col-span-1 space-y-6">
                    {!currentShift ? (
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <div className="bg-maroon p-6 text-white">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Clock className="h-6 w-6" />
                                    {t('Clock In')}
                                </h2>
                                <p className="text-white/70 text-sm mt-1">{t('Start your shift record')}</p>
                            </div>
                            <form onSubmit={handleClockIn} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('Shift Type')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShiftType('DAY_SHIFT')}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${shiftType === 'DAY_SHIFT' ? 'border-maroon bg-maroon/5 text-maroon' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            <span className="font-bold">{t('Day Shift')}</span>
                                            <span className="text-[10px] opacity-70">6:00 AM - 6:00 PM</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShiftType('NIGHT_SHIFT')}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${shiftType === 'NIGHT_SHIFT' ? 'border-maroon bg-maroon/5 text-maroon' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            <span className="font-bold">{t('Night Shift')}</span>
                                            <span className="text-[10px] opacity-70">6:00 PM - 6:00 AM</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('Receptionist Name')}</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={user?.fullName || user?.username || ''} 
                                            readOnly 
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">{t('Employee ID (Optional)')}</label>
                                    <div className="relative">
                                        <ClipboardList className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={employeeId} 
                                            onChange={(e) => setEmployeeId(e.target.value)}
                                            placeholder="e.g. EMP-001"
                                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-maroon/20 focus:border-maroon outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={clockingIn}
                                    className="w-full bg-maroon text-white font-bold py-4 rounded-xl shadow-lg shadow-maroon/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                                >
                                    {clockingIn ? t('Clocking in...') : t('Clock In Now')}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <div className="bg-green-600 p-6 text-white flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <CheckCircle2 className="h-6 w-6" />
                                        {t('Active Shift')}
                                    </h2>
                                    <p className="text-white/70 text-sm mt-1">{t('Shift in progress')}</p>
                                </div>
                                <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {currentShift.shiftType.replace('_', ' ')}
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                <Clock className="text-maroon h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">{t('Clocked In At')}</p>
                                                <p className="font-bold text-slate-700">{format(new Date(currentShift.clockInTime), 'hh:mm a')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                <DollarSign className="text-green-600 h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">{t('Earnings So Far')}</p>
                                                <p className="font-bold text-green-600 text-xl">KES {currentShift.totalEarnings?.toLocaleString() || '0'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                <Users className="text-blue-600 h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">{t('Clients Sold To')}</p>
                                                <p className="font-bold text-blue-600 text-xl">{currentShift.clientsCount || '0'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleClockOut} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">{t('Shift Notes / Remarks')}</label>
                                        <textarea 
                                            rows="4" 
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder={t('Enter hand-over notes, balance details, etc.')}
                                            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-maroon/20 focus:border-maroon outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={clockingOut}
                                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                                    >
                                        {clockingOut ? t('Clocking out...') : t('Clock Out & Handover')}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                {/* History / Summary Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                                <History className="h-6 w-6 text-maroon" />
                                {t('Shift Handover History')}
                            </h2>
                            <button onClick={fetchData} className="text-maroon font-bold text-sm hover:underline">{t('Refresh')}</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 text-left">
                                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('Date')}</th>
                                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('Receptionist')}</th>
                                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('Shift')}</th>
                                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center">{t('Clients')}</th>
                                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('Clock In/Out')}</th>
                                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">{t('Earnings')}</th>
                                        <th className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('Status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.length > 0 ? (
                                        history.map((shift) => (
                                            <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-700">{format(new Date(shift.date), 'MMM dd, yyyy')}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-maroon/10 text-maroon flex items-center justify-center font-bold text-xs">
                                                            {shift.fullName?.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-700 text-sm">{shift.fullName}</p>
                                                            <p className="text-[10px] text-slate-400">{shift.employeeId || 'No ID'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${shift.shiftType === 'DAY_SHIFT' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                        {shift.shiftType === 'DAY_SHIFT' ? t('Day') : t('Night')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <p className="font-bold text-slate-700">{shift.clientsCount || 0}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                                            <span className="w-8 opacity-50 font-mono">IN:</span>
                                                            <span className="font-bold">{format(new Date(shift.clockInTime), 'hh:mm a')}</span>
                                                        </div>
                                                        {shift.clockOutTime && (
                                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                <span className="w-8 opacity-50 font-mono">OUT:</span>
                                                                <span className="font-bold">{format(new Date(shift.clockOutTime), 'hh:mm a')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="font-extrabold text-slate-800">KES {shift.totalEarnings?.toLocaleString() || '0'}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {shift.status === 'ACTIVE' ? (
                                                            <span className="flex items-center gap-1 text-green-600 font-bold text-xs">
                                                                <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></span>
                                                                {t('In Progress')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs font-medium">
                                                                {t('Closed')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-20 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-3">
                                                    <AlertCircle className="h-12 w-12 opacity-20" />
                                                    <p>{t('No shift records found')}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftHandover;
