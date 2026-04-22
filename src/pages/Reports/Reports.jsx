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
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
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
                const [revRes, resRes, guestRes, roomRes] = await Promise.allSettled([
                    api.get(`/reports/revenue-report?startDate=${startDate}&endDate=${endDate}`),
                    api.get('/reservations'),
                    api.get('/guests'),
                    api.get('/rooms'),
                ]);
                if (revRes.status === 'fulfilled') { setRevenue(revRes.value.data); setRevenueByType(revRes.value.data?.revenueByChargeType || {}); }
                if (resRes.status === 'fulfilled') setReservations(resRes.value.data || []);
                if (guestRes.status === 'fulfilled') setGuests(guestRes.value.data || []);
                if (roomRes.status === 'fulfilled') setRooms(roomRes.value.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [startDate, endDate, activeTab]);

    // Derived stats
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'CHECKED_IN').length;
    const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const arrivalsToday = reservations.filter(r => r.dateIn === today && r.status === 'BOOKED').length;
    const departuresToday = reservations.filter(r => r.dateOut === today).length;
    const periodLabel = startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} → ${formatDate(endDate)}`;

    const tabs = [
        { id: 'financial', label: t('Financial Summary') },
        { id: 'ledger', label: t('General Ledger') },
        { id: 'operational', label: t('Operational Data') },
    ];

    const getActiveDataForCSV = () => {
        switch (activeTab) {
            case 'financial': return revenue ? [revenue] : [];
            case 'ledger': return revenue?.auditTray || [];
            case 'operational': return reservations;
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
                            <h1 className="text-2xl font-black text-text-dark tracking-tight">{t('Financial & Operational Reports')}</h1>
                            <p className="text-text-slate mt-1">{t('Period')}: {formatDate(startDate)} → {formatDate(endDate)}</p>
                        </div>
                        <button 
                            className="btn-secondary !bg-white !px-6 border border-slate-200 flex items-center gap-2"
                            onClick={() => {
                                const activeData = getActiveDataForCSV();
                                downloadCSV(activeData, `${activeTab}_report`);
                            }}
                        >
                            <FileText size={18} />
                            {t('Export Data')}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 no-print mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('Start Date')}:</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 outline-none shadow-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('End Date')}:</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 outline-none shadow-sm" />
                    </div>
                    <button onClick={() => window.print()} className="btn-secondary !px-5 transition-all hover:bg-maroon hover:text-white">
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
                {activeTab === 'financial' && (
                    <Section title={t('Financial Performance Overview')} period={periodLabel}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatCard label={t('Gross Revenue')} value={`$ ${parseFloat(revenue?.totalRevenue || 0).toLocaleString()}`} sub={`${t('Net')}: $ ${parseFloat(revenue?.netRevenue || 0).toLocaleString()}`} accent="border-l-green-500" />
                            <StatCard label={t('Total Collections')} value={`$ ${parseFloat(revenue?.totalPayments || 0).toLocaleString()}`} sub={t('Actual cash received')} accent="border-l-blue-500" />
                            <StatCard label={t('Total Expenses')} value={`$ ${parseFloat(revenue?.totalExpenses || 0).toLocaleString()}`} sub={`${t('OpEx')}: $ ${parseFloat(revenue?.operationalExpenses || 0).toLocaleString()}`} accent="border-l-red-500" />
                            <StatCard label={t('Net Cash Flow')} value={`$ ${((parseFloat(revenue?.totalPayments || 0)) - (parseFloat(revenue?.totalExpenses || 0))).toLocaleString()}`} sub={t('Collections - Expenses')} accent="border-l-indigo-500" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                            <StatCard label={t('Accounts Receivable')} value={`$ ${parseFloat(revenue?.accountsReceivable || 0).toLocaleString()}`} sub={t('Pending from closed folios')} accent="border-l-amber-500" />
                            <StatCard label={t('Accounts Payable')} value={`$ ${parseFloat(revenue?.accountsPayable || 0).toLocaleString()}`} sub={t('Unpaid purchase orders')} accent="border-l-slate-400" />
                            <StatCard label={t('Supply Costs')} value={`$ ${parseFloat(revenue?.supplyCosts || 0).toLocaleString()}`} sub={t('Procurement & Inventory')} accent="border-l-rose-400" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                            <div className="premium-card p-6">
                                <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                                    {t('Revenue Distribution')}
                                    <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-600 rounded-full uppercase">{t('Details')}</span>
                                </h3>
                                {Object.keys(revenueByType).length === 0 ? (
                                    <p className="py-10 text-center text-slate-400 italic text-sm">No charges recorded for this period.</p>
                                ) : (
                                    <div className="overflow-x-auto w-full">
                                        <table className="management-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('Category')}</th>
                                                    <th className="text-right">{t('Amount ($)')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(revenueByType).map(([type, amount]) => (
                                                    <tr key={type}>
                                                        <td className="capitalize font-medium text-slate-600">{type.replace(/_/g, ' ').toLowerCase()}</td>
                                                        <td className="text-right font-black text-slate-800">{parseFloat(amount).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="premium-card p-6">
                                <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                                    {t('Asset & Liability Summary')}
                                    <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-full uppercase">{t('Balance')}</span>
                                </h3>
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                        <span className="text-sm font-semibold text-slate-600">{t('Capital Assets Purchased')}</span>
                                        <span className="font-bold text-slate-800">$ {parseFloat(revenue?.totalAssets || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                        <span className="text-sm font-semibold text-slate-600">{t('Maintenance Reserve')}</span>
                                        <span className="font-bold text-slate-800">$ {parseFloat(revenue?.maintenanceCosts || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                        <span className="text-sm font-semibold text-slate-600">{t('Petty Cash Balance')}</span>
                                        <span className="font-bold text-slate-800">$ {parseFloat(revenue?.pettyCash || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm font-semibold text-slate-600">{t('Total Payroll Obligations')}</span>
                                        <span className="font-bold text-slate-800">$ {parseFloat(revenue?.payrollExpenses || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>
                )}

                {activeTab === 'ledger' && (
                    <Section title={t('Financial Transaction Ledger')} period={periodLabel}>
                        <div className="premium-card overflow-hidden">
                            <div className="overflow-x-auto w-full">
                                <table className="management-table">
                                    <thead>
                                        <tr>
                                            <th>{t('Date & Time')}</th>
                                            <th>{t('Type')}</th>
                                            <th>{t('Account / Reference')}</th>
                                            <th>{t('Description')}</th>
                                            <th className="text-right">{t('Amount ($)')}</th>
                                            <th className="text-right">{t('Running Balance ($)')}</th>
                                            <th className="text-center">{t('Status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? <LoadingRow /> : (revenue?.auditTray || []).length === 0 ? (
                                            <tr><td colSpan="7" className="py-16 text-center text-slate-400 italic">No ledger entries for this period.</td></tr>
                                        ) : revenue.auditTray.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="whitespace-nowrap text-[12px] font-medium text-slate-500">{new Date(item.timestamp).toLocaleString()}</td>
                                                <td>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                                                        ${item.type === 'REVENUE' || item.type === 'COLLECTION' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="font-semibold text-slate-700">{item.account}</td>
                                                <td className="text-[13px] text-slate-600 max-w-xs truncate">{item.description}</td>
                                                <td className={`text-right font-bold ${item.type === 'REVENUE' || item.type === 'COLLECTION' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {item.type === 'REVENUE' || item.type === 'COLLECTION' ? '+' : '-'}{parseFloat(item.amount).toLocaleString()}
                                                </td>
                                                <td className="text-right font-black text-slate-800">
                                                    {parseFloat(item.runningBalance).toLocaleString()}
                                                </td>
                                                <td className="text-center">
                                                    <span className="text-[11px] font-bold text-slate-400">{item.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Section>
                )}

                {activeTab === 'operational' && (
                    <Section title={t('Operational Statistics')}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                            <StatCard label={t('Occupancy Rate')} value={`${occupancyPct}%`} sub={`${occupiedRooms} ${t('occupied Rooms')}`} accent="border-l-indigo-500" />
                            <StatCard label={t('Arrivals Today')} value={arrivalsToday} sub={t('Expected Check-ins')} accent="border-l-blue-500" />
                            <StatCard label={t('Departures Today')} value={departuresToday} sub={t('Expected Check-outs')} accent="border-l-slate-400" />
                        </div>

                        <div className="premium-card">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{t('Recent Reservations')}</h3>
                                <div className="text-[11px] text-slate-400 font-medium">{reservations.length} {t('total found')}</div>
                            </div>
                            <div className="overflow-x-auto w-full">
                                <table className="management-table">
                                    <thead>
                                        <tr>
                                            <th>#</th><th>{t('Guest')}</th><th>{t('Check-In')}</th><th>{t('Check-Out')}</th><th>{t('Status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? <LoadingRow /> : reservations.slice(0, 50).map(r => (
                                            <tr key={r.id}>
                                                <td className="font-bold text-slate-400">#{r.id}</td>
                                                <td className="font-semibold text-slate-700">{guests.find(g => g.id === r.guestId)?.fullName || '—'}</td>
                                                <td>{formatDate(r.dateIn)}</td>
                                                <td>{formatDate(r.dateOut)}</td>
                                                <td><span className={`status-badge ${r.status?.toLowerCase()}`}>{r.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Section>
                )}
            </div>
        </>
    );
};

export default Reports;
