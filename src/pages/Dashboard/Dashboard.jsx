import React, { useState, useEffect } from 'react';
import api from '../../services/api';
const Dashboard = () => {
    const [stats, setStats] = useState({
        totalArrivalsToday: 0,
        totalDeparturesToday: 0,
        activeStays: 0,
        occupancyRate: 0,
        dailyRevenue: 0,
        averageDailyRate: 0,
        revenuePerAvailableRoom: 0,
        pendingHousekeeping: 0,
        lowStockItems: 0,
        pendingLeaveRequests: 0,
        pendingPurchaseOrders: 0
    });
    const [recentArrivals, setRecentArrivals] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/summary');
                setStats(response.data);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            }
        };

        const fetchDashboardData = async () => {
            try {
                const arrivalsRes = await api.get('/reservations/arrivals');
                setRecentArrivals(arrivalsRes.data.slice(0, 5));
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            }
        };

        fetchStats();
        fetchDashboardData();
    }, []);

    return (
        <div className="flex flex-col gap-8">
            {/* Actionable Alerts Section */}
            {(stats.pendingHousekeeping > 0 || stats.lowStockItems > 0 || stats.pendingLeaveRequests > 0 || stats.pendingPurchaseOrders > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.pendingHousekeeping > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                                {stats.pendingHousekeeping}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">Housekeeping</span>
                                <span className="text-xs text-orange-600">Pending Cleaning</span>
                            </div>
                        </div>
                    )}
                    {stats.lowStockItems > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
                            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                                {stats.lowStockItems}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Low Stock</span>
                                <span className="text-xs text-red-600">Reorder needed</span>
                            </div>
                        </div>
                    )}
                    {stats.pendingLeaveRequests > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                {stats.pendingLeaveRequests}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Leave Requests</span>
                                <span className="text-xs text-blue-600">Pending approval</span>
                            </div>
                        </div>
                    )}
                    {stats.pendingPurchaseOrders > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                {stats.pendingPurchaseOrders}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Purchase Orders</span>
                                <span className="text-xs text-purple-600">Awaiting status</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Core Operational KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="premium-card !bg-white">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Front Desk Status</span>
                    <div className="flex items-center justify-between mt-3">
                        <div className="flex flex-col">
                            <span className="text-3xl font-black text-slate-800">{stats.totalArrivalsToday}</span>
                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Pending Arrivals</span>
                        </div>
                        <div className="w-px h-10 bg-slate-100"></div>
                        <div className="flex flex-col text-right">
                            <span className="text-3xl font-black text-slate-800">{stats.totalDeparturesToday}</span>
                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter">Departures</span>
                        </div>
                    </div>
                </div>

                <div className="premium-card !bg-white">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Occupancy Rate</span>
                    <div className="flex items-center gap-4 mt-3">
                        <span className="text-3xl font-black text-slate-800">{stats.occupancyRate}%</span>
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-maroon transition-all duration-1000" style={{ width: `${stats.occupancyRate}%` }}></div>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2 block uppercase">{stats.activeStays} In-House Guests</span>
                </div>

                <div className="premium-card !bg-white">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Average Daily Rate</span>
                    <div className="mt-3">
                        <span className="text-3xl font-black text-slate-800">KSh {stats.averageDailyRate.toLocaleString()}</span>
                        <div className="text-[10px] font-bold text-blue-600 uppercase mt-1 tracking-wider">Average Daily Rate (ADR)</div>
                    </div>
                </div>

                <div className="premium-card !bg-white">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Revenue Per Available Room</span>
                    <div className="mt-3">
                        <span className="text-3xl font-black text-slate-800">KSh {stats.revenuePerAvailableRoom.toLocaleString()}</span>
                        <div className="text-[10px] font-bold text-indigo-600 uppercase mt-1 tracking-wider">Revenue Per Available Room (RevPAR)</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 premium-card">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Recent Arrivals</h3>
                        <span className="text-xs font-bold text-slate-400 uppercase">Latest 5</span>
                    </div>
                    {recentArrivals.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {recentArrivals.map(arr => (
                                <div key={arr.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-maroon/5 flex items-center justify-center text-maroon font-bold text-xs uppercase">
                                            {arr.guestName?.substring(0, 2)}
                                        </div>
                                        <span className="font-bold text-slate-700">{arr.guestName || 'Direct Guest'}</span>
                                    </div>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Room {arr.roomNumber || 'TBD'}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <div className="text-4xl mb-2 opacity-20">🛄</div>
                            <p className="text-slate-400 italic text-sm">No arrivals recorded for today.</p>
                        </div>
                    )}
                </div>

                <div className="premium-card !bg-maroon !text-white">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] mb-4">Financial Snapshot</span>
                            <span className="text-[10px] font-bold text-white/40 uppercase mb-1">Total Revenue Today</span>
                            <div className="text-4xl font-black text-yellow leading-tight">
                                KSh {stats.dailyRevenue.toLocaleString()}
                            </div>
                        </div>

                        <div className="h-px bg-white/10 w-full"></div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white/40 uppercase">Room Rev</span>
                                <span className="text-lg font-bold">KSh {(stats.averageDailyRate * stats.activeStays).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white/40 uppercase">Other Rev</span>
                                <span className="text-lg font-bold">KSh {(stats.dailyRevenue - (stats.averageDailyRate * stats.activeStays)).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-white/70">Occupancy Target</span>
                                <span className="text-xs font-black text-yellow">85%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-yellow" style={{ width: `${Math.min(100, (stats.occupancyRate / 85) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
