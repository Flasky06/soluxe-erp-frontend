import React, { useState, useEffect } from 'react';
import api from '../../services/api';
const Dashboard = () => {
    const [stats, setStats] = useState([
        { label: 'Today Arrivals', value: '...', trend: '', key: 'totalArrivalsToday' },
        { label: 'Today Departures', value: '...', trend: '', key: 'totalDeparturesToday' },
        { label: 'Total Occupancy', value: '...', trend: '', key: 'occupancyRate' },
        { label: 'Active Stays', value: '...', trend: '', key: 'activeStays' },
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
        <div className="flex flex-col">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <div key={stat.label} className="premium-card flex flex-col gap-2">
                        <div className="flex-1">
                            <span className="text-[13px] font-semibold text-text-slate uppercase tracking-wider">{stat.label}</span>
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold text-text-dark">{stat.value}</span>
                                {stat.trend && (
                                    <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${stat.trend.startsWith('+') ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                        {stat.trend}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 premium-card">
                    <h3 className="mb-5 text-lg font-bold text-maroon">Recent Arrivals</h3>
                    <div className="flex flex-col">
                        {recentArrivals.length > 0 ? (
                            <ul className="list-none p-0 m-0">
                                {recentArrivals.map(arr => (
                                    <li key={arr.id} className="flex justify-between py-3 border-b border-slate-100 last:border-b-0">
                                        <span className="font-semibold text-text-dark">{arr.guestName || 'Walk-in Guest'}</span>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wide">Room {arr.roomNumber || 'Unassigned'}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-text-slate italic text-center py-8">No arrivals scheduled for today.</p>
                        )}
                    </div>
                </div>
                <div className="premium-card">
                    <h3 className="mb-5 text-lg font-bold text-maroon">Revenue Insights</h3>
                    <div className="flex flex-col gap-4">
                        {revenue ? (
                            <>
                                <div className="flex justify-between items-center text-text-dark">
                                    <span className="text-text-slate">Room Revenue</span>
                                    <strong className="text-lg font-bold text-maroon">KSh {(revenue.roomRevenue || 0).toLocaleString()}</strong>
                                </div>
                                <div className="flex justify-between items-center text-text-dark">
                                    <span className="text-text-slate">F&B Revenue</span>
                                    <strong className="text-lg font-bold text-maroon">KSh {(revenue.foodAndBeverageRevenue || 0).toLocaleString()}</strong>
                                </div>
                                <div className="flex justify-between items-center text-xl mt-4 pt-4 border-t-2 border-slate-100">
                                    <span className="font-bold text-text-dark">Total Expected</span>
                                    <strong className="text-2xl font-extrabold text-green-600 font-mono">KSh {(revenue.totalRevenue || 0).toLocaleString()}</strong>
                                </div>
                            </>
                        ) : (
                            <p className="text-text-slate italic text-center py-8">No revenue data for today.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
