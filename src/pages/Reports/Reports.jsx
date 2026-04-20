import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText } from 'lucide-react';
import Pagination from '../../components/Pagination/Pagination';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate } from '../../services/formatters';

// ─── Section Tab Button ───────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border
            ${active
                ? 'bg-yellow text-maroon border-yellow shadow-lg shadow-yellow/20'
                : 'bg-white text-slate-500 border-slate-200 hover:border-maroon/30 hover:text-maroon'
            }`}
    >
        {label}
    </button>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
    <div className={`premium-card p-5 flex flex-col gap-1 border-l-4 ${accent || 'border-l-primary'}`}>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-3xl font-extrabold text-primary">{value}</div>
        {sub && <div className="text-[12px] text-slate-400 font-medium">{sub}</div>}
    </div>
);

// ─── Section Wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, period, children }) => (
    <div className="flex flex-col gap-6">
        <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-extrabold text-slate-800">{title}</h2>
            {period && <span className="text-xs font-semibold text-slate-400 italic">({period})</span>}
        </div>
        {children}
    </div>
);

// ─── Loading Placeholder ──────────────────────────────────────────────────────
const LoadingRow = () => (
    <tr><td colSpan="20" className="py-16 text-center text-slate-400 italic">Loading data…</td></tr>
);

// ─────────────────────────────────────────────────────────────────────────────
//  REPORTS PAGE
// ─────────────────────────────────────────────────────────────────────────────
const Reports = () => {
    const [activeTab, setActiveTab] = useState('revenue');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const { t } = useLanguage();

    // Data state
    const [revenue, setRevenue] = useState(null);
    const [revenueByType, setRevenueByType] = useState({});
    const [reservations, setReservations] = useState([]);
    const [guests, setGuests] = useState([]);
    const [folios, setFolios] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;

    const today = new Date().toISOString().split('T')[0];

    const downloadCSV = (data, filename) => {
        if (!data || data.length === 0) return;
        
        let dataToProcess = Array.isArray(data) ? data : [data];

        if (filename.includes('revenue') && !Array.isArray(data)) {
            dataToProcess = [{
                netRevenue: data.netRevenue,
                totalRevenue: data.totalRevenue,
                ...data.revenueByChargeType
            }];
        }

        const headers = Object.keys(dataToProcess[0]);
        const csvContent = [
            headers.join(','),
            ...dataToProcess.map(row => headers.map(header => {
                const val = row[header] === null || row[header] === undefined ? '' : row[header];
                return `"${val.toString().replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [revRes, resRes, guestRes, folioRes, roomRes] = await Promise.allSettled([
                    api.get(`/reports/revenue-report?startDate=${startDate}&endDate=${endDate}`),
                    api.get('/reservations'),
                    api.get('/guests'),
                    api.get('/folios'),
                    api.get('/rooms'),
                ]);
                if (revRes.status === 'fulfilled') { setRevenue(revRes.value.data); setRevenueByType(revRes.value.data?.revenueByChargeType || {}); }
                if (resRes.status === 'fulfilled') setReservations(resRes.value.data || []);
                if (guestRes.status === 'fulfilled') setGuests(guestRes.value.data || []);
                if (folioRes.status === 'fulfilled') setFolios(folioRes.value.data || []);
                if (roomRes.status === 'fulfilled') setRooms(roomRes.value.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
        setCurrentPage(1);
    }, [startDate, endDate, activeTab]);

    // Derived stats
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'CHECKED_IN').length;
    const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const arrivalsToday = reservations.filter(r => r.dateIn === today && r.status === 'BOOKED').length;
    const departuresToday = reservations.filter(r => r.dateOut === today).length;
    const folioTotal = folios.reduce((s, f) => s + (parseFloat(f.totalAmount) || 0), 0);
    const periodLabel = startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} → ${formatDate(endDate)}`;

    const tabs = [
        { id: 'revenue', label: t('Revenue') },
        { id: 'reservations', label: t('Reservations') },
        { id: 'guests', label: t('Guests') },
    ];

    const getActiveDataForCSV = () => {
        switch (activeTab) {
            case 'revenue': return revenue ? [revenue] : [];
            case 'reservations': return reservations;
            case 'guests': return guests;
            default: return [];
        }
    };

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #printable-report, #printable-report * { visibility: visible; }
                    #printable-report { position: fixed; top: 0; left: 0; width: 100%; padding: 2rem; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div id="printable-report" className="flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 no-print">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <h1 className="text-2xl font-black text-text-dark tracking-tight">{t('Management Reports')}</h1>
                            <p className="text-text-slate mt-1">{t('From')}: {formatDate(startDate)} · {t('To')}: {formatDate(endDate)}</p>
                        </div>
                        <button 
                            className="btn-secondary !bg-white !px-6 border border-slate-200 flex items-center gap-2"
                            onClick={() => {
                                const activeData = getActiveDataForCSV();
                                downloadCSV(activeData, `${activeTab}_report`);
                            }}
                        >
                            <FileText size={18} />
                            {t('Download CSV')}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 no-print mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{t('From')}:</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 outline-none shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{t('To')}:</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 outline-none shadow-sm" />
                    </div>
                    <button onClick={() => window.print()} className="btn-secondary !px-5">
                        {t('Print Report')}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 flex-wrap mb-6 no-print">
                    {tabs.map(tab => (
                        <TabBtn key={tab.id} label={tab.label} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'revenue' && (
                    <Section title={t('Revenue Report')} period={periodLabel}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatCard label={t('Net Revenue')} value={`$ ${parseFloat(revenue?.netRevenue || 0).toLocaleString()}`} sub={`${t('Gross')}: $ ${parseFloat(revenue?.totalRevenue || 0).toLocaleString()}`} accent="border-l-green-500" />
                            <StatCard label={t('Occupancy Rate')} value={`${occupancyPct}%`} sub={`${occupiedRooms} ${t('occupied')} · ${totalRooms - occupiedRooms} ${t('available')}`} accent="border-l-indigo-500" />
                            <StatCard label={t('Arrivals Today')} value={arrivalsToday} sub={t('Guests checking in today')} accent="border-l-blue-500" />
                            <StatCard label={t('Departures Today')} value={departuresToday} sub={t('Guests checking out today')} accent="border-l-slate-400" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            <div className="premium-card p-6">
                                <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100">{t('Revenue by Charge Type')}</h3>
                                {Object.keys(revenueByType).length === 0 ? (
                                    <p className="py-10 text-center text-slate-400 italic text-sm">No charges recorded for this period.</p>
                                ) : (
                                    <div className="overflow-x-auto w-full">
                                        <table className="management-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('Charge Type')}</th>
                                                    <th className="text-right">{t('Amount ($)')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(revenueByType).map(([type, amount]) => (
                                                    <tr key={type}>
                                                        <td className="capitalize">{type.replace(/_/g, ' ').toLowerCase()}</td>
                                                        <td className="text-right font-bold text-slate-800">{parseFloat(amount).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="premium-card p-6">
                                <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100">{t('Folio Summary')}</h3>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm font-bold text-slate-600">{t('Total Folio Value')}</span>
                                    <span className="font-extrabold text-primary text-lg">$ {folioTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </Section>
                )}

                {activeTab === 'reservations' && (
                    <Section title={t('Reservations Report')}>
                        <div className="premium-card mt-6">
                            <div className="overflow-x-auto w-full">
                                <table className="management-table">
                                    <thead>
                                        <tr>
                                            <th>#</th><th>{t('Guest')}</th><th>{t('Check-In')}</th><th>{t('Check-Out')}</th><th>{t('Status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? <LoadingRow /> : reservations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(r => (
                                            <tr key={r.id}>
                                                <td>{r.id}</td>
                                                <td>{guests.find(g => g.id === r.guestId)?.fullName || '—'}</td>
                                                <td>{formatDate(r.dateIn)}</td>
                                                <td>{formatDate(r.dateOut)}</td>
                                                <td><span className={`status-badge ${r.status?.toLowerCase()}`}>{r.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4">
                                <Pagination currentPage={currentPage} totalPages={Math.ceil(reservations.length / PAGE_SIZE)} onPageChange={setCurrentPage} totalItems={reservations.length} pageSize={PAGE_SIZE} />
                            </div>
                        </div>
                    </Section>
                )}

                {activeTab === 'guests' && (
                    <Section title={t('Guest Report')}>
                        <div className="premium-card mt-6">
                            <div className="overflow-x-auto w-full">
                                <table className="management-table">
                                    <thead>
                                        <tr>
                                            <th>#</th><th>{t('Full Name')}</th><th>{t('Email')}</th><th>{t('Phone')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? <LoadingRow /> : guests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map(g => (
                                            <tr key={g.id}>
                                                <td>{g.id}</td>
                                                <td>{g.fullName}</td>
                                                <td>{g.email || '—'}</td>
                                                <td>{g.phone || g.phoneNumber || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4">
                                <Pagination currentPage={currentPage} totalPages={Math.ceil(guests.length / PAGE_SIZE)} onPageChange={setCurrentPage} totalItems={guests.length} pageSize={PAGE_SIZE} />
                            </div>
                        </div>
                    </Section>
                )}
            </div>
        </>
    );
};

export default Reports;
