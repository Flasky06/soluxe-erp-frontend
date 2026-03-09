import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Reports = () => {
    const [revenue, setRevenue] = useState(null);
    const [revenueByType, setRevenueByType] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [reservationStats, setReservationStats] = useState({ total: 0, booked: 0, checkedIn: 0, cancelled: 0, checkedOut: 0 });
    const [folioStats, setFolioStats] = useState({ open: 0, closed: 0, totalRevenue: 0 });

    const fetchReports = async (date) => {
        setLoading(true);
        try {
            const [revenueRes, reservationsRes, foliosRes] = await Promise.all([
                api.get(`/reports/daily-revenue?date=${date}`),
                api.get('/reservations'),
                api.get('/folios')
            ]);

            const rev = revenueRes.data;
            setRevenue(rev);
            setRevenueByType(rev.revenueByChargeType || {});

            const reservations = reservationsRes.data;
            setReservationStats({
                total: reservations.length,
                booked: reservations.filter(r => r.status === 'BOOKED').length,
                checkedIn: reservations.filter(r => r.status === 'CHECKED_IN').length,
                cancelled: reservations.filter(r => r.status === 'CANCELLED').length,
                checkedOut: reservations.filter(r => r.status === 'CHECKED_OUT').length,
            });

            const folios = foliosRes.data;
            const totalFolioRevenue = folios.reduce((sum, f) => sum + (parseFloat(f.totalAmount) || 0), 0);
            setFolioStats({
                open: folios.filter(f => f.status === 'OPEN').length,
                closed: folios.filter(f => f.status === 'CLOSED').length,
                totalRevenue: totalFolioRevenue,
            });
        } catch (err) {
            console.error('Failed to fetch report data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports(selectedDate);
    }, [selectedDate]);

    const maxBarValue = Object.values(revenueByType).reduce((a, b) => Math.max(a, parseFloat(b) || 0), 1);

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Reports & Analytics</h1>
                    <p className="text-text-slate text-base">Live operational and financial performance data.</p>
                </div>
                <div className="flex items-center">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-40 text-text-slate animate-pulse text-xl font-medium italic">Loading report data...</div>
            ) : (
                <>
                    {/* Revenue Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="premium-card p-6 flex flex-col gap-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</div>
                            <div className="text-3xl font-extrabold text-primary">
                                KES {parseFloat(revenue?.totalRevenue || 0).toLocaleString()}
                            </div>
                            <div className="text-[12px] text-slate-400 font-medium">For {selectedDate}</div>
                        </div>
                        <div className="premium-card p-6 flex flex-col gap-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">All-Time Folio Revenue</div>
                            <div className="text-3xl font-extrabold text-primary">
                                KES {folioStats.totalRevenue.toLocaleString()}
                            </div>
                            <div className="text-[12px] text-slate-400 font-medium">{folioStats.open} open · {folioStats.closed} closed folios</div>
                        </div>
                        <div className="premium-card p-6 flex flex-col gap-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Reservations</div>
                            <div className="text-3xl font-extrabold text-primary">{reservationStats.total}</div>
                            <div className="text-[12px] text-slate-400 font-medium">{reservationStats.checkedIn} in-house · {reservationStats.booked} upcoming</div>
                        </div>
                        <div className="premium-card p-6 flex flex-col gap-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cancellations</div>
                            <div className="text-3xl font-extrabold text-red-600">{reservationStats.cancelled}</div>
                            <div className="text-[12px] text-slate-400 font-medium">of {reservationStats.total} total bookings</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue by Charge Type Bar Chart */}
                        <div className="premium-card p-8 flex flex-col min-h-[400px]">
                            <h3 className="text-lg font-bold text-slate-700 mb-8 border-b border-slate-100 pb-4">Revenue by Charge Type ({selectedDate})</h3>
                            {Object.keys(revenueByType).length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <span className="text-5xl opacity-20 italic">No Data</span>
                                    <p className="text-sm italic">No charges recorded for this date.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6 flex-1 justify-center">
                                    {Object.entries(revenueByType).map(([type, amount]) => {
                                        const pct = Math.max(4, (parseFloat(amount) / maxBarValue) * 100);
                                        return (
                                            <div key={type} className="flex items-center gap-6">
                                                <div className="w-[140px] text-right">
                                                    <span className="text-[13px] font-bold text-slate-600 capitalize tracking-tight">{type.replace(/_/g, ' ')}</span>
                                                </div>
                                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full shadow-sm transition-all duration-1000" 
                                                        style={{width: `${pct}%`}} 
                                                    />
                                                </div>
                                                <div className="w-[120px]">
                                                    <span className="font-bold text-slate-800 text-[13px]">KES {parseFloat(amount).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Reservation Status Breakdown */}
                        <div className="premium-card p-8 flex flex-col min-h-[400px]">
                            <h3 className="text-lg font-bold text-slate-700 mb-8 border-b border-slate-100 pb-4">Reservation Status Breakdown</h3>
                            <div className="flex flex-col gap-8 flex-1 justify-center">
                                {[
                                    { label: 'Booked', value: reservationStats.booked, color: 'bg-blue-500' },
                                    { label: 'Checked In', value: reservationStats.checkedIn, color: 'bg-green-500' },
                                    { label: 'Checked Out', value: reservationStats.checkedOut, color: 'bg-slate-400' },
                                    { label: 'Cancelled', value: reservationStats.cancelled, color: 'bg-red-500' },
                                ].map(item => (
                                    <div key={item.label} className="grid grid-cols-[auto_120px_40px_1fr] items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                        <span className="text-[13px] font-bold text-slate-600">{item.label}</span>
                                        <span className="text-[14px] font-extrabold text-slate-800 text-right">{item.value}</span>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-full ml-4">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                                                style={{
                                                    width: reservationStats.total > 0 ? `${(item.value / reservationStats.total) * 100}%` : '0%',
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {reservationStats.total === 0 && (
                                    <p className="text-center py-10 text-slate-400 text-sm italic">No reservations found in the system.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
