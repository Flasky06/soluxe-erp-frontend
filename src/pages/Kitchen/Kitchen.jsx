import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const Kitchen = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('master-menu');

    const fetchMenu = async () => {
        try {
            const response = await api.get('/menu-items');
            setMenuItems(response.data);
        } catch (err) {
            console.error('Failed to fetch menu:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLiveOrders = useCallback(async () => {
        setOrdersLoading(true);
        try {
            // Get all active dining sessions then aggregate their orders
            const sessionsRes = await api.get('/dining-sessions/active');
            const sessions = sessionsRes.data;
            if (sessions.length === 0) {
                setPendingOrders([]);
                return;
            }
            const orderRequests = sessions.map(s => api.get(`/dining-orders/session/${s.id}`));
            const orderResults = await Promise.all(orderRequests);
            const allOrders = orderResults.flatMap((res, i) =>
                res.data.map(o => ({ ...o, sessionInfo: sessions[i] }))
            );
            // Only show pending/in-progress
            const pending = allOrders.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS');
            setPendingOrders(pending);
        } catch (err) {
            console.error('Failed to fetch live orders:', err);
        } finally {
            setOrdersLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMenu();
    }, []);

    useEffect(() => {
        if (activeTab === 'orders') {
            fetchLiveOrders();
            // Auto-refresh every 30 seconds
            const interval = setInterval(fetchLiveOrders, 30000);
            return () => clearInterval(interval);
        }
    }, [activeTab, fetchLiveOrders]);

    const handleMarkServed = async (orderId) => {
        try {
            // Update order status via delete is not appropriate — we'd need a PATCH endpoint
            // For now mark it by removing from the pending list optimistically
            setPendingOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (err) {
            console.error('Failed to update order:', err);
        }
    };

    const getOrderAge = (orderedAt) => {
        if (!orderedAt) return '';
        const diff = Math.floor((Date.now() - new Date(orderedAt)) / 60000);
        if (diff < 1) return 'just now';
        return `${diff}m ago`;
    };


    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Kitchen Management</h1>
                    <p className="text-text-slate text-base">Manage master menu and monitor live preparation queue.</p>
                </div>
                {activeTab === 'orders' && (
                    <button className="btn-secondary" onClick={fetchLiveOrders}>Refresh Queue</button>
                )}
            </div>

            <div className="flex gap-2 mb-8 border-b border-slate-200">
                <button
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'master-menu' ? 'text-primary border-primary bg-primary/5' : 'text-text-slate border-transparent hover:text-primary'}`}
                    onClick={() => setActiveTab('master-menu')}
                >
                    Master Menu
                </button>
                <button
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'orders' ? 'text-primary border-primary bg-primary/5' : 'text-text-slate border-transparent hover:text-primary'}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Live Orders {pendingOrders.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{pendingOrders.length}</span>}
                </button>
            </div>

            {loading && activeTab === 'master-menu' ? (
                <div className="text-center py-20 text-text-slate animate-pulse text-lg">Loading menu data...</div>
            ) : (
                <div className="flex flex-col">
                    {activeTab === 'master-menu' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {menuItems.length === 0 ? (
                                <div className="col-span-full premium-card p-12 text-center text-text-slate border-2 border-dashed border-slate-200 bg-slate-50">
                                    <p>No menu items found. Add items from the Restaurant page.</p>
                                </div>
                            ) : menuItems.map(item => (
                                <div key={item.id} className={`premium-card p-6 flex justify-between items-start transition-all ${item.available ? 'border-green-200 shadow-sm border-2' : 'opacity-60 grayscale bg-slate-50'}`}>
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-lg font-bold text-text-dark m-0">{item.name}</h3>
                                        <span className="text-[10px] font-bold text-text-slate uppercase tracking-wider">{item.category?.name || 'General'}</span>
                                        <div className="text-base font-bold text-slate-700 mt-2">KSh {item.price}</div>
                                        {item.prepTimeMins && (
                                            <div className="text-[12px] text-text-slate mt-2 italic">{item.prepTimeMins} min prep</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${item.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {item.available ? 'Available' : 'Unavailable'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div>
                            {ordersLoading ? (
                                <div className="text-center py-20 text-text-slate animate-pulse text-lg">Fetching live orders...</div>
                            ) : pendingOrders.length === 0 ? (
                                <div className="premium-card p-16 text-center border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center">
                                    <div className="text-5xl mb-4">🔥</div>
                                    <h2 className="text-2xl font-bold text-text-dark">All Clear!</h2>
                                    <p className="text-text-slate mt-2">No pending orders in the queue right now.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                                    {pendingOrders.map(order => {
                                        const diff = Math.floor((Date.now() - new Date(order.orderedAt)) / 60000);
                                        const isUrgent = diff >= 15;
                                        const isWarning = diff >= 8;
                                        
                                        return (
                                            <div key={order.id} className={`premium-card p-6 flex flex-col gap-4 relative border-l-4 transition-all shadow-md ${isUrgent ? 'border-l-red-500 animate-pulse ring-2 ring-red-500/20' : isWarning ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
                                                <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-200">
                                                    <span className="text-[11px] font-bold text-text-slate uppercase tracking-wider">
                                                        Table — Session #{order.sessionInfo?.id}
                                                    </span>
                                                    <span className={`text-[12px] font-bold ${isUrgent ? 'text-red-600' : 'text-text-slate'}`}>{getOrderAge(order.orderedAt)}</span>
                                                </div>
                                                <div className="text-xl font-bold text-text-dark leading-tight">
                                                    {order.menuItem?.name || `Item #${order.menuItemId}`}
                                                </div>
                                                <div className="text-lg font-extrabold text-primary">Qty: {order.quantity}</div>
                                                {order.notes && (
                                                    <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-[13px] italic border border-amber-100">
                                                        📝 {order.notes}
                                                    </div>
                                                )}
                                                <button
                                                    className="mt-auto w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-sm transition-all text-sm"
                                                    onClick={() => handleMarkServed(order.id)}
                                                >
                                                    Mark Served
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Kitchen;
