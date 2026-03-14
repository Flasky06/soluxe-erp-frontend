import React, { useState, useEffect } from 'react';
import api from '../../services/api';

// ─── Section Tab Button ───────────────────────────────────────────────────────
const TabBtn = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border
            ${active
                ? 'bg-maroon text-white border-maroon shadow'
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

    // Data state
    const [revenue, setRevenue] = useState(null);
    const [revenueByType, setRevenueByType] = useState({});
    const [reservations, setReservations] = useState([]);
    const [guests, setGuests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [diningOrders, setDiningOrders] = useState([]);
    const [dinningSessions, setDinningSessions] = useState([]);
    const [maintenance, setMaintenance] = useState([]);
    const [folios, setFolios] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [venueBookings, setVenueBookings] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    const today = new Date().toISOString().split('T')[0];

    const downloadCSV = (data, filename) => {
        if (!data || data.length === 0) return;
        
        // Handle cases where data might be an object (like revenue) instead of an array
        let dataToProcess = Array.isArray(data) ? data : [data];

        // If data is revenue object, we might want to flatten it or pick specific parts
        if (filename.includes('revenue') && !Array.isArray(data)) {
            dataToProcess = [{
                netRevenue: data.netRevenue,
                totalRevenue: data.totalRevenue,
                ...data.revenueByChargeType // Flatten charge types if they exist
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
                const [revRes, resRes, guestRes, empRes, ordersRes, sessionsRes, maintRes, folioRes, roomRes, venueRes, invRes] = await Promise.allSettled([
                    api.get(`/reports/revenue-report?startDate=${startDate}&endDate=${endDate}`),
                    api.get('/reservations'),
                    api.get('/guests'),
                    api.get('/employees'),
                    api.get('/dining-orders'),
                    api.get('/dining-sessions'),
                    api.get('/maintenance'),
                    api.get('/folios'),
                    api.get('/rooms'),
                    api.get('/venue-bookings'),
                    api.get('/inventory'),
                ]);
                if (revRes.status === 'fulfilled') { setRevenue(revRes.value.data); setRevenueByType(revRes.value.data?.revenueByChargeType || {}); }
                if (resRes.status === 'fulfilled') setReservations(resRes.value.data || []);
                if (guestRes.status === 'fulfilled') setGuests(guestRes.value.data || []);
                if (empRes.status === 'fulfilled') setEmployees(empRes.value.data || []);
                if (ordersRes.status === 'fulfilled') setDiningOrders(ordersRes.value.data || []);
                if (sessionsRes.status === 'fulfilled') setDinningSessions(sessionsRes.value.data || []);
                if (maintRes.status === 'fulfilled') setMaintenance(maintRes.value.data || []);
                if (folioRes.status === 'fulfilled') setFolios(folioRes.value.data || []);
                if (roomRes.status === 'fulfilled') setRooms(roomRes.value.data || []);
                if (venueRes.status === 'fulfilled') setVenueBookings(venueRes.value.data || []);
                if (invRes.status === 'fulfilled') setInventory(invRes.value.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [startDate, endDate]);

    // ─── Derived stats ─────────────────────────────────────────────────────────
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'CHECKED_IN').length;
    const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const arrivalsToday = reservations.filter(r => r.dateIn === today && r.status === 'BOOKED').length;
    const departuresToday = reservations.filter(r => r.dateOut === today).length;
    const folioTotal = folios.reduce((s, f) => s + (parseFloat(f.totalAmount) || 0), 0);
    const posTotal = diningOrders.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);
    const venueTotal = venueBookings.reduce((s, b) => s + (parseFloat(b.totalAmount) || 0), 0);
    const byDept = employees.reduce((acc, e) => {
        const dept = e.department || e.departmentName || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
    }, {});
    const periodLabel = startDate === endDate ? startDate : `${startDate} → ${endDate}`;

    const tabs = [
        { id: 'revenue', label: 'Revenue' },
        { id: 'reservations', label: 'Reservations' },
        { id: 'guests', label: 'Guests' },
        { id: 'employees', label: 'Employees' },
        { id: 'pos', label: 'F&B / POS' },
        { id: 'venue', label: 'Venue Bookings' },
        { id: 'maintenance', label: 'Maintenance' },
        { id: 'inventory', label: 'Inventory' },
    ];

    const getActiveDataForCSV = () => {
        switch (activeTab) {
            case 'revenue': return revenue ? [revenue] : []; // Revenue is an object, wrap in array for CSV
            case 'reservations': return reservations;
            case 'guests': return guests;
            case 'employees': return employees;
            case 'pos': return diningOrders; // Or combine diningOrders and dinningSessions
            case 'venue': return venueBookings;
            case 'maintenance': return maintenance;
            case 'inventory': return inventory;
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

                {/* ── Header ── */}
                <div className="flex justify-between items-center mb-6 no-print">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <h1 className="text-2xl font-black text-text-dark tracking-tight">Management Reports</h1>
                            <p className="text-text-slate mt-1">Daily, monthly and operational insights</p>
                        </div>
                        <button 
                            className="btn-secondary !bg-white !px-6 border border-slate-200 flex items-center gap-2"
                            onClick={() => {
                                const activeData = getActiveDataForCSV();
                                downloadCSV(activeData, `${activeTab}_report`);
                            }}
                        >
                            <FileText size={18} />
                            Download CSV
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">From:</span>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 outline-none shadow-sm" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">To:</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 outline-none shadow-sm" />
                        </div>
                        <button onClick={() => window.print()} className="btn-secondary !px-5">
                            Print Report
                        </button>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-2 flex-wrap mb-6 no-print">
                    {tabs.map(t => (
                        <TabBtn key={t.id} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
                    ))}
                </div>

                {/* ════════════════════════════════════════════════
                    REVENUE SECTION
                ════════════════════════════════════════════════ */}
                {activeTab === 'revenue' && (
                    <Section title="Revenue Report" period={periodLabel}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatCard label="Net Revenue" value={`KSh ${parseFloat(revenue?.netRevenue || 0).toLocaleString()}`} sub={`Gross: KSh ${parseFloat(revenue?.totalRevenue || 0).toLocaleString()}`} accent="border-l-green-500" />
                            <StatCard label="Occupancy Rate" value={`${occupancyPct}%`} sub={`${occupiedRooms} occupied · ${totalRooms - occupiedRooms} available`} accent="border-l-indigo-500" />
                            <StatCard label="Arrivals Today" value={arrivalsToday} sub="Guests checking in today" accent="border-l-blue-500" />
                            <StatCard label="Departures Today" value={departuresToday} sub="Guests checking out today" accent="border-l-slate-400" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Revenue by Charge Type */}
                            <div className="premium-card p-6">
                                <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100">Revenue by Charge Type</h3>
                                {Object.keys(revenueByType).length === 0 ? (
                                    <p className="py-10 text-center text-slate-400 italic text-sm">No charges recorded for this period.</p>
                                ) : (
                                    <table className="w-full">
                                        <thead><tr className="border-b border-slate-100">
                                            <th className="text-left text-[11px] font-bold text-slate-400 uppercase pb-2">Charge Type</th>
                                            <th className="text-right text-[11px] font-bold text-slate-400 uppercase pb-2">Amount (KSh)</th>
                                            <th className="text-right text-[11px] font-bold text-slate-400 uppercase pb-2">Share</th>
                                        </tr></thead>
                                        <tbody>
                                            {(() => {
                                                const total = Object.values(revenueByType).reduce((s, v) => s + parseFloat(v), 0);
                                                return Object.entries(revenueByType)
                                                    .sort(([, a], [, b]) => parseFloat(b) - parseFloat(a))
                                                    .map(([type, amount]) => (
                                                        <tr key={type} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                            <td className="py-3 text-sm font-semibold text-slate-600 capitalize">{type.replace(/_/g, ' ').toLowerCase()}</td>
                                                            <td className="py-3 text-right font-bold text-slate-800 text-sm">{parseFloat(amount).toLocaleString()}</td>
                                                            <td className="py-3 text-right"><span className="status-badge info text-[11px]">{total > 0 ? Math.round((parseFloat(amount) / total) * 100) : 0}%</span></td>
                                                        </tr>
                                                    ));
                                            })()}
                                        </tbody>
                                        <tfoot><tr className="border-t-2 border-slate-200">
                                            <td className="pt-3 text-sm font-extrabold text-slate-700">Total</td>
                                            <td className="pt-3 text-right font-extrabold text-primary">{Object.values(revenueByType).reduce((s, v) => s + parseFloat(v), 0).toLocaleString()}</td>
                                            <td className="pt-3 text-right"><span className="status-badge checked-in text-[11px]">100%</span></td>
                                        </tr></tfoot>
                                    </table>
                                )}
                            </div>

                            {/* Folio Summary */}
                            <div className="premium-card p-6">
                                <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100">Folio Summary</h3>
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                                        <div className="text-2xl font-extrabold text-orange-600">{folios.filter(f => f.status === 'OPEN').length}</div>
                                        <div className="text-[11px] font-bold text-orange-400 uppercase mt-1">Open</div>
                                    </div>
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                                        <div className="text-2xl font-extrabold text-green-700">{folios.filter(f => f.status === 'CLOSED').length}</div>
                                        <div className="text-[11px] font-bold text-green-400 uppercase mt-1">Closed</div>
                                    </div>
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                                        <div className="text-xl font-extrabold text-indigo-700">{folios.length}</div>
                                        <div className="text-[11px] font-bold text-indigo-400 uppercase mt-1">Total</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between py-3 border-t border-slate-100">
                                    <span className="text-sm font-bold text-slate-600">All-time Folio Value</span>
                                    <span className="font-extrabold text-primary text-lg">KSh {folioTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </Section>
                )}

                {/* ════════════════════════════════════════════════
                    RESERVATIONS SECTION
                ════════════════════════════════════════════════ */}
                {activeTab === 'reservations' && (
                    <Section title="Reservations Report">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatCard label="Total Reservations" value={reservations.length} accent="border-l-primary" />
                            <StatCard label="Booked" value={reservations.filter(r => r.status === 'BOOKED').length} accent="border-l-blue-500" />
                            <StatCard label="Checked In" value={reservations.filter(r => r.status === 'CHECKED_IN').length} accent="border-l-green-500" />
                            <StatCard label="Cancelled" value={reservations.filter(r => r.status === 'CANCELLED').length} accent="border-l-red-400" />
                        </div>

                        <div className="premium-card overflow-x-auto">
                            <div className="p-5 border-b border-slate-100 font-bold text-slate-700">All Reservations</div>
                            <table className="management-table">
                                <thead><tr>
                                    <th>#</th><th>Guest</th><th>Type</th><th>Check-In</th><th>Check-Out</th><th>Status</th><th>Nights</th>
                                </tr></thead>
                                <tbody>
                                    {loading ? <LoadingRow /> : reservations.length === 0
                                        ? <tr><td colSpan="7" className="py-16 text-center text-slate-400 italic">No reservations found.</td></tr>
                                        : reservations.map(r => {
                                            const g = guests.find(g => g.id === r.guestId);
                                            const nights = r.dateIn && r.dateOut
                                                ? Math.round((new Date(r.dateOut) - new Date(r.dateIn)) / 86400000)
                                                : '—';
                                            return (
                                                <tr key={r.id}>
                                                    <td className="text-slate-400 text-xs">{r.id}</td>
                                                    <td className="font-bold text-text-dark">{g?.fullName || `Guest ${r.guestId}`}</td>
                                                    <td>{r.roomTypeId ? 'Room' : 'Table'}</td>
                                                    <td>{r.dateIn || '—'}</td>
                                                    <td>{r.dateOut || '—'}</td>
                                                    <td><span className={`status-badge ${r.status?.toLowerCase().replace('_', '-')}`}>{r.status}</span></td>
                                                    <td className="text-center font-semibold">{nights}</td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                )}

                {/* ════════════════════════════════════════════════
                    GUESTS SECTION
                ════════════════════════════════════════════════ */}
                {activeTab === 'guests' && (
                    <Section title="Guest Report">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <StatCard label="Total Guests" value={guests.length} accent="border-l-primary" />
                            <StatCard label="Guests with Active Stays" value={reservations.filter(r => r.status === 'CHECKED_IN').length} accent="border-l-green-500" />
                            <StatCard label="New Arrivals Today" value={arrivalsToday} sub="Booked, checking in today" accent="border-l-blue-500" />
                        </div>

                        <div className="premium-card overflow-x-auto">
                            <div className="p-5 border-b border-slate-100 font-bold text-slate-700">All Registered Guests</div>
                            <table className="management-table">
                                <thead><tr>
                                    <th>#</th><th>Full Name</th><th>Email</th><th>Phone</th><th>Nationality</th><th>ID Type</th><th>ID Number</th>
                                </tr></thead>
                                <tbody>
                                    {loading ? <LoadingRow /> : guests.length === 0
                                        ? <tr><td colSpan="7" className="py-16 text-center text-slate-400 italic">No guests found.</td></tr>
                                        : guests.map(g => (
                                            <tr key={g.id}>
                                                <td className="text-slate-400 text-xs">{g.id}</td>
                                                <td className="font-bold text-text-dark">{g.fullName}</td>
                                                <td className="text-sm text-slate-500">{g.email || '—'}</td>
                                                <td className="text-sm text-slate-500">{g.phone || g.phoneNumber || '—'}</td>
                                                <td>{g.nationality || '—'}</td>
                                                <td><span className="status-badge info text-[11px]">{g.idType || '—'}</span></td>
                                                <td className="text-sm text-slate-600">{g.idNumber || '—'}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                )}

                {/* ════════════════════════════════════════════════
                    EMPLOYEES SECTION
                ════════════════════════════════════════════════ */}
                {activeTab === 'employees' && (
                    <Section title="Employee Report">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <StatCard label="Total Employees" value={employees.length} accent="border-l-primary" />
                            <StatCard label="Departments" value={Object.keys(byDept).length} accent="border-l-indigo-500" />
                            <StatCard label="Active" value={employees.filter(e => e.status === 'ACTIVE' || !e.status).length} accent="border-l-green-500" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Department breakdown */}
                            <div className="premium-card p-6">
                                <h3 className="text-base font-bold text-slate-700 mb-4 pb-3 border-b border-slate-100">By Department</h3>
                                {Object.keys(byDept).length === 0
                                    ? <p className="py-8 text-center text-slate-400 italic text-sm">No department data.</p>
                                    : <table className="w-full">
                                        <thead><tr className="border-b border-slate-100">
                                            <th className="text-left text-[11px] font-bold text-slate-400 uppercase pb-2">Department</th>
                                            <th className="text-right text-[11px] font-bold text-slate-400 uppercase pb-2">Count</th>
                                        </tr></thead>
                                        <tbody>
                                            {Object.entries(byDept).sort(([, a], [, b]) => b - a).map(([dept, count]) => (
                                                <tr key={dept} className="border-b border-slate-50 hover:bg-slate-50">
                                                    <td className="py-3 text-sm font-semibold text-slate-600">{dept}</td>
                                                    <td className="py-3 text-right font-extrabold text-primary text-lg">{count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                }
                            </div>

                            {/* Employee list */}
                            <div className="premium-card overflow-x-auto">
                                <div className="p-5 border-b border-slate-100 font-bold text-slate-700">Employee Directory</div>
                                <table className="management-table">
                                    <thead><tr><th>Name</th><th>Department</th><th>Role</th><th>Phone</th><th>Email</th></tr></thead>
                                    <tbody>
                                        {loading ? <LoadingRow /> : employees.length === 0
                                            ? <tr><td colSpan="5" className="py-16 text-center text-slate-400 italic">No employees found.</td></tr>
                                            : employees.map(e => (
                                                <tr key={e.id}>
                                                    <td className="font-bold text-text-dark">{e.firstName} {e.lastName}</td>
                                                    <td><span className="status-badge info text-[11px]">{e.department || e.departmentName || '—'}</span></td>
                                                    <td className="text-sm text-slate-500">{e.role || e.position || '—'}</td>
                                                    <td className="text-sm text-slate-500">{e.phone || e.phoneNumber || '—'}</td>
                                                    <td className="text-sm text-slate-500">{e.email || '—'}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Section>
                )}

                {/* ════════════════════════════════════════════════
                    POS / F&B SECTION
                ════════════════════════════════════════════════ */}
                {activeTab === 'pos' && (
                    <Section title="F&B / POS Report">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatCard label="Total Orders" value={diningOrders.length} accent="border-l-yellow-500" />
                            <StatCard label="Dining Sessions" value={dinningSessions.length} accent="border-l-orange-500" />
                            <StatCard label="Open Sessions" value={dinningSessions.filter(s => s.status === 'OPEN' || !s.closedAt).length} accent="border-l-red-400" />
                            <StatCard label="Total POS Revenue" value={`KSh ${posTotal.toLocaleString()}`} accent="border-l-green-500" />
                        </div>

                        <div className="premium-card overflow-x-auto">
                            <div className="p-5 border-b border-slate-100 font-bold text-slate-700">Dining Orders</div>
                            <table className="management-table">
                                <thead><tr>
                                    <th>#</th><th>Session</th><th>Table</th><th>Items</th><th>Total (KSh)</th><th>Status</th>
                                </tr></thead>
                                <tbody>
                                    {loading ? <LoadingRow /> : diningOrders.length === 0
                                        ? <tr><td colSpan="6" className="py-16 text-center text-slate-400 italic">No dining orders found.</td></tr>
                                        : diningOrders.map(o => (
                                            <tr key={o.id}>
                                                <td className="text-slate-400 text-xs">{o.id}</td>
                                                <td className="text-sm text-slate-600">{o.sessionId || '—'}</td>
                                                <td className="text-sm text-slate-600">{o.tableId || o.tableName || '—'}</td>
                                                <td className="text-sm">{o.itemCount || (o.orderItems?.length) || '—'}</td>
                                                <td className="font-bold text-slate-800">{parseFloat(o.totalAmount || 0).toLocaleString()}</td>
                                                <td><span className={`status-badge ${o.status === 'PAID' ? 'checked-in' : o.status === 'CANCELLED' ? 'cancelled' : 'booked'} text-[11px]`}>{o.status || '—'}</span></td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                )}

                {/* ════════════════════════════════════════════════
                    VENUE BOOKINGS SECTION
                ════════════════════════════════════════════════ */}
                {activeTab === 'venue' && (
                    <Section title="Venue Bookings Report">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatCard label="Total Bookings" value={venueBookings.length} accent="border-l-primary" />
                            <StatCard label="Confirmed" value={venueBookings.filter(b => b.status === 'CONFIRMED').length} accent="border-l-green-500" />
                            <StatCard label="Pending" value={venueBookings.filter(b => b.status === 'PENDING').length} accent="border-l-yellow-400" />
                            <StatCard label="Total Value" value={`KSh ${venueTotal.toLocaleString()}`} accent="border-l-indigo-500" />
                        </div>

                        <div className="premium-card overflow-x-auto">
                            <div className="p-5 border-b border-slate-100 font-bold text-slate-700">All Venue Bookings</div>
                            <table className="management-table">
                                <thead><tr>
                                    <th>#</th><th>Client</th><th>Venue</th><th>Event</th><th>Date In</th><th>Guests</th><th>Total (KSh)</th><th>Deposit</th><th>Status</th>
                                </tr></thead>
                                <tbody>
                                    {loading ? <LoadingRow /> : venueBookings.length === 0
                                        ? <tr><td colSpan="9" className="py-16 text-center text-slate-400 italic">No venue bookings found.</td></tr>
                                        : venueBookings.map(b => (
                                            <tr key={b.id}>
                                                <td className="text-slate-400 text-xs">{b.id}</td>
                                                <td className="font-bold text-text-dark">{b.clientName}<br /><span className="text-[11px] text-slate-400 font-normal">{b.clientCompany}</span></td>
                                                <td><span className="status-badge info text-[11px]">{b.venueName || `#${b.venueId}`}</span></td>
                                                <td className="text-sm text-slate-600">{b.eventType?.replace(/_/g, ' ')}</td>
                                                <td className="text-sm font-medium">{b.dateIn}</td>
                                                <td className="text-center">{b.expectedGuests || '—'}</td>
                                                <td className="font-semibold">{b.totalAmount ? parseFloat(b.totalAmount).toLocaleString() : '—'}</td>
                                                <td>
                                                    {b.deposit ? <span className={`text-xs font-bold ${b.depositPaid ? 'text-green-600' : 'text-red-500'}`}>{b.depositPaid ? '✓ Paid' : '✗ Unpaid'}</span> : '—'}
                                                </td>
                                                <td><span className={`status-badge ${b.status === 'CONFIRMED' ? 'checked-in' : b.status === 'CANCELLED' ? 'cancelled' : b.status === 'COMPLETED' ? 'checked-out' : 'booked'} text-[11px]`}>{b.status}</span></td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                )}

                {/* ════════════════════════════════════════════════
                    MAINTENANCE SECTION
                ════════════════════════════════════════════════ */}
                {activeTab === 'maintenance' && (
                    <Section title="Maintenance Report">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatCard label="Total Tickets" value={maintenance.length} accent="border-l-primary" />
                            <StatCard label="Open" value={maintenance.filter(m => m.status !== 'RESOLVED' && m.status !== 'CLOSED').length} accent="border-l-red-400" />
                            <StatCard label="Resolved" value={maintenance.filter(m => m.status === 'RESOLVED' || m.status === 'CLOSED').length} accent="border-l-green-500" />
                            <StatCard label="Urgent / High" value={maintenance.filter(m => m.priority === 'URGENT' || m.priority === 'HIGH').length} accent="border-l-orange-500" />
                        </div>

                        <div className="premium-card overflow-x-auto">
                            <div className="p-5 border-b border-slate-100 font-bold text-slate-700">All Maintenance Tickets</div>
                            <table className="management-table">
                                <thead><tr>
                                    <th>#</th><th>Issue</th><th>Room</th><th>Priority</th><th>Status</th><th>Notes</th>
                                </tr></thead>
                                <tbody>
                                    {loading ? <LoadingRow /> : maintenance.length === 0
                                        ? <tr><td colSpan="6" className="py-16 text-center text-slate-400 italic">No maintenance tickets found.</td></tr>
                                        : maintenance.map(m => (
                                            <tr key={m.id}>
                                                <td className="text-slate-400 text-xs">{m.id}</td>
                                                <td className="font-semibold text-text-dark">{m.issueType || m.description || '—'}</td>
                                                <td>{m.roomId ? `Room ${m.roomId}` : '—'}</td>
                                                <td>
                                                    <span className={`status-badge text-[11px] ${m.priority === 'URGENT' ? 'cancelled' : m.priority === 'HIGH' ? 'warning' : 'info'}`}>
                                                        {m.priority || '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge text-[11px] ${m.status === 'RESOLVED' || m.status === 'CLOSED' ? 'checked-in' : m.status === 'IN_PROGRESS' ? 'booked' : 'warning'}`}>
                                                        {m.status || '—'}
                                                    </span>
                                                </td>
                                                <td className="text-sm text-slate-500 max-w-xs truncate">{m.notes || '—'}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                )}

                {/* ════════════════════════════════════════════════
                    INVENTORY SECTION
                ════════════════════════════════════════════════ */}
                {activeTab === 'inventory' && (
                    <Section title="Inventory Report">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            <StatCard label="Total Items" value={inventory.length} accent="border-l-primary" />
                            <StatCard label="Low Stock" value={inventory.filter(i => i.quantity != null && i.reorderLevel != null && i.quantity <= i.reorderLevel).length} accent="border-l-red-400" />
                            <StatCard label="Out of Stock" value={inventory.filter(i => i.quantity === 0).length} accent="border-l-red-600" sub="Items with 0 quantity" />
                            <StatCard label="Well Stocked" value={inventory.filter(i => i.quantity > (i.reorderLevel || 0)).length} accent="border-l-green-500" />
                        </div>

                        <div className="premium-card overflow-x-auto">
                            <div className="p-5 border-b border-slate-100 font-bold text-slate-700">All Inventory Items</div>
                            <table className="management-table">
                                <thead><tr>
                                    <th>#</th><th>Item Name</th><th>Category</th><th>Quantity</th><th>Unit</th><th>Reorder Level</th><th>Stock Status</th>
                                </tr></thead>
                                <tbody>
                                    {loading ? <LoadingRow /> : inventory.length === 0
                                        ? <tr><td colSpan="7" className="py-16 text-center text-slate-400 italic">No inventory items found.</td></tr>
                                        : inventory.map(item => {
                                            const isLow = item.quantity != null && item.reorderLevel != null && item.quantity <= item.reorderLevel;
                                            const isOut = item.quantity === 0;
                                            return (
                                                <tr key={item.id}>
                                                    <td className="text-slate-400 text-xs">{item.id}</td>
                                                    <td className="font-bold text-text-dark">{item.name || item.itemName}</td>
                                                    <td><span className="status-badge info text-[11px]">{item.categoryName || item.category || '—'}</span></td>
                                                    <td className={`font-extrabold text-lg ${isOut ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-green-600'}`}>{item.quantity ?? '—'}</td>
                                                    <td className="text-sm text-slate-500">{item.unit || '—'}</td>
                                                    <td className="text-sm text-slate-500">{item.reorderLevel ?? '—'}</td>
                                                    <td>
                                                        <span className={`status-badge text-[11px] ${isOut ? 'cancelled' : isLow ? 'warning' : 'checked-in'}`}>
                                                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'OK'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                )}
            </div>
        </>
    );
};

export default Reports;
