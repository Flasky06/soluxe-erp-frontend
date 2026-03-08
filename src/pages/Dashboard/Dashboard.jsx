import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState([
        { label: 'Today Arrivals', value: '...', trend: '', icon: '📥', key: 'totalArrivalsToday' },
        { label: 'Today Departures', value: '...', trend: '', icon: '📤', key: 'totalDeparturesToday' },
        { label: 'Total Occupancy', value: '...', trend: '', icon: '📊', key: 'occupancyRate' },
        { label: 'Active Stays', value: '...', trend: '', icon: '🏨', key: 'activeStays' },
    ]);
    const [recentArrivals, setRecentArrivals] = useState([]);
    const [revenue, setRevenue] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/summary');
                const data = response.data;
                setStats(prev => prev.map(s => ({
                    ...s,
                    value: s.key === 'occupancyRate' ? `${data[s.key]}%` : data[s.key].toString()
                })));
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            }
        };

        const fetchDashboardData = async () => {
            try {
                const [arrivalsRes, revenueRes] = await Promise.all([
                    api.get('/reservations'),
                    api.get('/reports/daily-revenue')
                ]);
                
                const today = new Date().toISOString().split('T')[0];
                const todaysArrivals = arrivalsRes.data.filter(
                    res => res.dateIn && res.dateIn.startsWith(today)
                );
                setRecentArrivals(todaysArrivals.slice(0, 5));
                setRevenue(revenueRes.data);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            }
        };

        fetchStats();
        fetchDashboardData();
    }, []);

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Dashboard Overview</h1>
                <p>Monitor your hotel's performance in real-time.</p>
            </div>

            <div className="stats-grid">
                {stats.map((stat) => (
                    <div key={stat.label} className="stat-card premium-card">
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-info">
                            <span className="stat-label">{stat.label}</span>
                            <div className="stat-row">
                                <span className="stat-value">{stat.value}</span>
                                <span className={`stat-trend ${stat.trend.startsWith('+') ? 'up' : 'down'}`}>
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-sections">
                <div className="section premium-card">
                    <h3>Recent Arrivals</h3>
                    <div className="recent-arrivals-list">
                        {recentArrivals.length > 0 ? (
                            <ul className="arrival-list">
                                {recentArrivals.map(arr => (
                                    <li key={arr.id} className="arrival-item" style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee'}}>
                                        <span className="guest-name bold">{arr.guestName || 'Walk-in Guest'}</span>
                                        <span className="room-assigned status-badge info">Room {arr.roomNumber || 'Unassigned'}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="empty-state">No arrivals scheduled for today.</p>
                        )}
                    </div>
                </div>
                <div className="section premium-card">
                    <h3>Revenue Insights</h3>
                    <div className="revenue-summary" style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px'}}>
                        {revenue ? (
                            <>
                                <div className="revenue-item" style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <span>Room Revenue</span>
                                    <strong className="amount">KES {(revenue.roomRevenue || 0).toLocaleString()}</strong>
                                </div>
                                <div className="revenue-item" style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <span>F&B Revenue</span>
                                    <strong className="amount">KES {(revenue.foodAndBeverageRevenue || 0).toLocaleString()}</strong>
                                </div>
                                <div className="revenue-item total" style={{display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', marginTop: '10px', paddingTop: '10px', borderTop: '2px solid #eee'}}>
                                    <span>Total Expected</span>
                                    <strong className="amount">KES {(revenue.totalRevenue || 0).toLocaleString()}</strong>
                                </div>
                            </>
                        ) : (
                            <p className="empty-state">No revenue data for today.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
