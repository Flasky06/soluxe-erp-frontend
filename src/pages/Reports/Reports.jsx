import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Reports.css';

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
        <div className="reports-page">
            <div className="page-header">
                <div>
                    <h1>Reports & Analytics</h1>
                    <p>Live operational and financial performance data.</p>
                </div>
                <div className="header-actions">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="date-picker-input"
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading report data...</div>
            ) : (
                <>
                    {/* Revenue Summary Cards */}
                    <div className="report-stats-grid">
                        <div className="premium-card report-stat-card">
                            <div className="report-stat-label">Total Revenue</div>
                            <div className="report-stat-value">
                                KES {parseFloat(revenue?.totalRevenue || 0).toLocaleString()}
                            </div>
                            <div className="report-stat-sub">For {selectedDate}</div>
                        </div>
                        <div className="premium-card report-stat-card">
                            <div className="report-stat-label">All-Time Folio Revenue</div>
                            <div className="report-stat-value">
                                KES {folioStats.totalRevenue.toLocaleString()}
                            </div>
                            <div className="report-stat-sub">{folioStats.open} open · {folioStats.closed} closed folios</div>
                        </div>
                        <div className="premium-card report-stat-card">
                            <div className="report-stat-label">Total Reservations</div>
                            <div className="report-stat-value">{reservationStats.total}</div>
                            <div className="report-stat-sub">{reservationStats.checkedIn} in-house · {reservationStats.booked} upcoming</div>
                        </div>
                        <div className="premium-card report-stat-card">
                            <div className="report-stat-label">Cancellations</div>
                            <div className="report-stat-value" style={{color: '#dc2626'}}>{reservationStats.cancelled}</div>
                            <div className="report-stat-sub">of {reservationStats.total} total bookings</div>
                        </div>
                    </div>

                    {/* Revenue by Charge Type Bar Chart */}
                    <div className="reports-grid">
                        <div className="premium-card chart-card">
                            <h3>Revenue by Charge Type ({selectedDate})</h3>
                            {Object.keys(revenueByType).length === 0 ? (
                                <p className="empty-sub-state">No charges recorded for this date.</p>
                            ) : (
                                <div className="bar-chart-area">
                                    {Object.entries(revenueByType).map(([type, amount]) => {
                                        const pct = Math.max(4, (parseFloat(amount) / maxBarValue) * 100);
                                        return (
                                            <div key={type} className="bar-row">
                                                <div className="bar-label">{type.replace(/_/g, ' ')}</div>
                                                <div className="bar-track">
                                                    <div className="bar-fill" style={{width: `${pct}%`}} />
                                                </div>
                                                <div className="bar-value">KES {parseFloat(amount).toLocaleString()}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Reservation Status Breakdown */}
                        <div className="premium-card chart-card">
                            <h3>Reservation Status Breakdown</h3>
                            <div className="donut-legend">
                                {[
                                    { label: 'Booked', value: reservationStats.booked, color: '#3b82f6' },
                                    { label: 'Checked In', value: reservationStats.checkedIn, color: '#10b981' },
                                    { label: 'Checked Out', value: reservationStats.checkedOut, color: '#6b7280' },
                                    { label: 'Cancelled', value: reservationStats.cancelled, color: '#ef4444' },
                                ].map(item => (
                                    <div key={item.label} className="legend-row">
                                        <div className="legend-dot" style={{background: item.color}} />
                                        <span className="legend-label">{item.label}</span>
                                        <span className="legend-value">{item.value}</span>
                                        <div className="legend-bar-track">
                                            <div
                                                className="legend-bar-fill"
                                                style={{
                                                    width: reservationStats.total > 0 ? `${(item.value / reservationStats.total) * 100}%` : '0%',
                                                    background: item.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
