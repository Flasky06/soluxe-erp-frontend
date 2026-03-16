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
        pendingPurchaseOrders: 0,
        cleanRooms: 0,
        dirtyRooms: 0,
        maintenanceRooms: 0
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
            {/* Priority Housekeeping Section */}
            {stats.pendingHousekeeping > 0 && (
                <div className="flex items-center gap-6 p-6 bg-white border border-orange-100 rounded-2xl shadow-sm animate-pulse">
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-black">
                        {stats.pendingHousekeeping}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-orange-800 uppercase tracking-[0.2em]">Prioritize Housekeeping</span>
                        <span className="text-xs text-orange-600 font-bold">There are rooms awaiting cleaning for new arrivals.</span>
                    </div>
                    <div className="ml-auto">
                        <button className="px-6 py-2 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
                            Assign Tasks
                        </button>
                    </div>
                </div>
            )}


            {/* Front Desk Flow (Check-in/Check-out) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-all cursor-pointer">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 text-2xl font-black">↓</div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Expected Arrivals</span>
                            <span className="text-4xl font-black text-slate-800">{stats.totalArrivalsToday} <span className="text-sm font-bold text-slate-400">Guests</span></span>
                        </div>
                    </div>
                    <div className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Check-in desk</div>
                </div>

                <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all cursor-pointer">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 text-2xl font-black">↑</div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Expected Departures</span>
                            <span className="text-4xl font-black text-slate-800">{stats.totalDeparturesToday} <span className="text-sm font-bold text-slate-400">Guests</span></span>
                        </div>
                    </div>
                    <div className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Check-out desk</div>
                </div>
            </div>

            {/* Room Issues & Health Portfolio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">✓</div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clean & Ready</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black text-slate-800">{stats.cleanRooms}</span>
                        <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${(stats.cleanRooms / stats.totalRooms) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">⚠</div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirty / Pending</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black text-slate-800">{stats.dirtyRooms}</span>
                        <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500" style={{ width: `${(stats.dirtyRooms / stats.totalRooms) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">⚙</div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Out of Order</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-black text-slate-800">{stats.maintenanceRooms}</span>
                        <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${(stats.maintenanceRooms / stats.totalRooms) * 100}%` }}></div>
                        </div>
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
                        <div className="flex flex-col items-center">
                            <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] mb-4 text-center">Operational Health</span>
                            <div className="w-24 h-24 rounded-full border-4 border-yellow/20 flex items-center justify-center mb-2">
                                <span className="text-2xl font-black text-yellow">{stats.occupancyRate}%</span>
                            </div>
                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Global Occupancy</span>
                        </div>

                        <div className="h-px bg-white/10 w-full"></div>

                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="flex flex-col px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter mb-1">In-House</span>
                                <span className="text-xl font-black">{stats.activeStays}</span>
                            </div>
                            <div className="flex flex-col px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter mb-1">Available</span>
                                <span className="text-xl font-black text-yellow">{stats.totalRooms - stats.activeStays}</span>
                            </div>
                        </div>

                        <div className="mt-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-white/70">Occupancy Target</span>
                                <span className="text-[10px] font-black uppercase bg-yellow text-maroon px-2 py-0.5 rounded-full">85% Goal</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,0,0.4)]" style={{ width: `${Math.min(100, (stats.occupancyRate / 85) * 100)}%` }}></div>
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">Growth Status</span>
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">{stats.occupancyRate}% Current</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
