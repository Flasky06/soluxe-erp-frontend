import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../services/formatters';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
    <div className={`premium-card p-5 flex flex-col gap-1 border-l-4 ${accent || 'border-l-primary'}`}>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-3xl font-extrabold text-primary">{value}</div>
        {sub && <div className="text-[12px] text-slate-400 font-medium">{sub}</div>}
    </div>
);

// ─── Loading Placeholder ──────────────────────────────────────────────────────
const LoadingRow = () => (
    <tr><td colSpan="20" className="py-16 text-center text-slate-400 italic">Loading data…</td></tr>
);

// ─────────────────────────────────────────────────────────────────────────────
//  GENERAL REPORTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
const GeneralReports = () => {
    const { t } = useLanguage();

    const [reservations, setReservations] = useState([]);
    const [guests, setGuests]  = useState([]);
    const [rooms, setRooms]    = useState([]);
    const [staffPerformance, setStaffPerformance] = useState([]);
    const [loading, setLoading] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    const downloadCSV = (data, filename) => {
        if (!data || data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                const val = row[h] === null || row[h] === undefined ? '' : row[h];
                return `"${val.toString().replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${today}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [resRes, guestRes, roomRes, staffRes] = await Promise.allSettled([
                    api.get('/reservations'),
                    api.get('/guests'),
                    api.get('/rooms'),
                    api.get('/reports/user-performance')
                ]);
                if (resRes.status   === 'fulfilled') setReservations(resRes.value.data   || []);
                if (guestRes.status === 'fulfilled') setGuests(guestRes.value.data       || []);
                if (roomRes.status  === 'fulfilled') setRooms(roomRes.value.data         || []);
                if (staffRes.status === 'fulfilled') setStaffPerformance(staffRes.value.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Derived stats
    const totalRooms      = rooms.length;
    const occupiedRooms   = rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'CHECKED_IN').length;
    const availableRooms  = rooms.filter(r => r.status === 'AVAILABLE').length;
    const dirtyRooms      = rooms.filter(r => r.status === 'DIRTY').length;
    const occupancyPct    = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const arrivalsToday   = reservations.filter(r => r.dateIn  === today && r.status === 'BOOKED').length;
    const departuresToday = reservations.filter(r => r.dateOut === today).length;
    const inHouseCount    = reservations.filter(r => r.status === 'CHECKED_IN').length;

    // Reservation status breakdown
    const statusGroups = reservations.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-general, #print-general * { visibility: visible; }
                    #print-general { position: fixed; top: 0; left: 0; width: 100%; padding: 2rem; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div id="print-general" className="flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 no-print">
                    <div>
                        <h1 className="text-2xl font-black text-text-dark tracking-tight">{t('General Reports')}</h1>
                        <p className="text-text-slate mt-1">{t('Live operational snapshot')}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn-secondary !bg-white !px-5 border border-slate-200 flex items-center gap-2"
                            onClick={() => downloadCSV(reservations, 'reservations_report')}
                        >
                            <FileText size={16} />
                            {t('Export CSV')}
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="btn-secondary !px-5 transition-all hover:bg-maroon hover:text-white"
                        >
                            {t('Print Report')}
                        </button>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                    <StatCard label={t('Occupancy Rate')}    value={`${occupancyPct}%`}   sub={`${occupiedRooms} / ${totalRooms} ${t('rooms')}`}    accent="border-l-indigo-500" />
                    <StatCard label={t('Arrivals Today')}    value={arrivalsToday}         sub={t('Expected Check-ins')}                              accent="border-l-blue-500" />
                    <StatCard label={t('Departures Today')}  value={departuresToday}        sub={t('Expected Check-outs')}                             accent="border-l-slate-400" />
                    <StatCard label={t('In-House Guests')}   value={inHouseCount}          sub={t('Currently checked in')}                            accent="border-l-green-500" />
                </div>

                {/* Second row */}
                <div className="grid grid-cols-3 gap-5 mb-8">
                    <StatCard label={t('Available Rooms')} value={availableRooms} sub={t('Ready to check-in')} accent="border-l-emerald-400" />
                    <StatCard label={t('Dirty / Cleaning')} value={dirtyRooms}   sub={t('Awaiting housekeeping')} accent="border-l-amber-400" />
                    <StatCard label={t('Total Reservations')} value={reservations.length} sub={t('All time')} accent="border-l-violet-500" />
                </div>

                {/* Reservation Status Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="premium-card p-6">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
                            {t('Reservation Status Breakdown')}
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(statusGroups).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <span className={`status-badge ${status.toLowerCase()}`}>{t(status)}</span>
                                    <span className="font-bold text-slate-800">{count}</span>
                                </div>
                            ))}
                            {Object.keys(statusGroups).length === 0 && (
                                <p className="text-slate-400 italic text-sm text-center py-4">{t('No reservations found.')}</p>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 premium-card p-6">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
                            {t('Room Status Overview')}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {['AVAILABLE','OCCUPIED','CHECKED_IN','DIRTY','MAINTENANCE','OUT_OF_ORDER'].map(s => {
                                const count = rooms.filter(r => r.status === s).length;
                                return (
                                    <div key={s} className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                                        <span className={`status-badge ${s.toLowerCase()} text-[10px]`}>{t(s)}</span>
                                        <span className="text-2xl font-extrabold text-slate-800">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Reservations Table */}
                <div className="premium-card">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{t('All Reservations')}</h3>
                        <div className="text-[11px] text-slate-400 font-medium">{reservations.length} {t('total found')}</div>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>{t('Guest')}</th>
                                    <th>{t('Room')}</th>
                                    <th>{t('Check-In')}</th>
                                    <th>{t('Check-Out')}</th>
                                    <th>{t('Status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <LoadingRow /> : reservations.map(r => (
                                    <tr key={r.id}>
                                        <td className="font-bold text-slate-400">#{r.id}</td>
                                        <td className="font-semibold text-slate-700">{guests.find(g => g.id === r.guestId)?.fullName || '—'}</td>
                                        <td className="text-slate-600">{r.roomNumber || r.roomId || '—'}</td>
                                        <td>{formatDate(r.dateIn)}</td>
                                        <td>{formatDate(r.dateOut)}</td>
                                        <td><span className={`status-badge ${r.status?.toLowerCase()}`}>{t(r.status)}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Staff Performance Table */}
                <div className="premium-card mt-8">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{t('Staff Performance')}</h3>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th>{t('System User')}</th>
                                    <th>{t('Check-ins')}</th>
                                    <th>{t('Check-outs')}</th>
                                    <th>{t('Total Collected')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <LoadingRow /> : staffPerformance.map(sp => (
                                    <tr key={sp.userId}>
                                        <td className="font-semibold text-slate-700">
                                            {sp.fullName} <span className="text-sm font-normal text-slate-400">({sp.username})</span>
                                        </td>
                                        <td className="font-bold text-green-600">{sp.checkIns}</td>
                                        <td className="font-bold text-slate-500">{sp.checkOuts}</td>
                                        <td className="font-bold text-primary">
                                            ${(sp.totalCollected || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                {!loading && staffPerformance.length === 0 && (
                                    <tr><td colSpan="4" className="text-center text-slate-400 py-6">{t('No staff data available.')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GeneralReports;
