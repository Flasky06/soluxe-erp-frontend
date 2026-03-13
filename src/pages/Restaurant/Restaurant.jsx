import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Restaurant = () => {
    const [tables, setTables] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [stays, setStays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [sessionFormData, setSessionFormData] = useState({
        guestName: '',
        paxCount: 2,
        billingType: 'PAY_NOW',
        stayId: null
    });
    const [selectedTable, setSelectedTable] = useState(null);
    const [menuItems, setMenuItems] = useState([]);

    // Order management state
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [activeSession, setActiveSession] = useState(null);
    const [sessionOrders, setSessionOrders] = useState([]);
    const [orderLoading, setOrderLoading] = useState(false);

    const fetchTables = async () => {
        setLoading(true);
        try {
            const [tablesRes, menuRes, sessionsRes, staysRes] = await Promise.all([
                api.get('/restaurant-tables'),
                api.get('/menu-items'),
                api.get('/dining-sessions/active'),
                api.get('/stays')
            ]);
            setTables(tablesRes.data);
            setMenuItems(menuRes.data);
            setSessions(sessionsRes.data);
            setStays(staysRes.data.filter(s => s.status === 'ACTIVE'));
        } catch (err) {
            console.error('Failed to fetch restaurant data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchSessionOrders = async (sessionId) => {
        setOrderLoading(true);
        try {
            const res = await api.get(`/dining-orders/session/${sessionId}`);
            setSessionOrders(res.data);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setOrderLoading(false);
        }
    };


    const handleOpenTable = (table) => {
        setSelectedTable(table);
        setSessionFormData({
            guestName: '',
            paxCount: table.capacity,
            billingType: 'PAY_NOW',
            stayId: null
        });
        setShowSessionModal(true);
    };

    const handleSessionSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...sessionFormData,
                paxCount: parseInt(sessionFormData.paxCount) || 1,
                stayId: sessionFormData.stayId ? parseInt(sessionFormData.stayId) : null,
                tableId: selectedTable.id,
                status: 'OPEN',
                openedAt: new Date().toISOString()
            };
            await api.post('/dining-sessions', payload);
            setShowSessionModal(false);
            fetchTables();
        } catch (err) {
            console.error('Failed to open table:', err);
            alert('Failed to open table.');
        }
    };

    const handleManageSession = (session, table) => {
        setActiveSession(session);
        setSelectedTable(table);
        setShowOrderModal(true);
        fetchSessionOrders(session.id);
    };

    const handleAddToOrder = async (menuItem) => {
        try {
            await api.post('/dining-orders', {
                sessionId: activeSession.id,
                menuItemId: menuItem.id,
                quantity: 1,
                unitPrice: menuItem.price,
                totalAmount: menuItem.price,
                status: 'PENDING',
                orderedAt: new Date().toISOString()
            });
            fetchSessionOrders(activeSession.id);
        } catch (err) {
            console.error('Failed to add order:', err);
            alert('Failed to add item to order.');
        }
    };

    const handleRemoveOrder = async (orderId) => {
        try {
            await api.delete(`/dining-orders/${orderId}`);
            fetchSessionOrders(activeSession.id);
        } catch (err) {
            console.error('Failed to remove order:', err);
            alert('Failed to remove item.');
        }
    };

    const handleCloseSession = async () => {
        if (!window.confirm('Settle bill and close this table?')) return;
        try {
            await api.patch(`/dining-sessions/${activeSession.id}/close`);
            setShowOrderModal(false);
            setActiveSession(null);
            setSessionOrders([]);
            fetchTables();
        } catch (err) {
            console.error('Failed to close session:', err);
            alert('Failed to close session.');
        }
    };

    const orderTotal = sessionOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);


    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="premium-card p-6 text-center">
                    <h3 className="text-[11px] font-bold text-text-slate uppercase tracking-wider mb-2">Total Tables</h3>
                    <div className="text-4xl font-bold text-primary">{tables.length}</div>
                </div>
                <div className="premium-card p-6 text-center">
                    <h3 className="text-[11px] font-bold text-text-slate uppercase tracking-wider mb-2">Available</h3>
                    <div className="text-4xl font-bold text-green-600">
                        {tables.filter(t => t.status === 'AVAILABLE').length}
                    </div>
                </div>
                <div className="premium-card p-6 text-center">
                    <h3 className="text-[11px] font-bold text-text-slate uppercase tracking-wider mb-2">Occupied</h3>
                    <div className="text-4xl font-bold text-red-600">
                        {tables.filter(t => t.status === 'OCCUPIED').length}
                    </div>
                </div>
                <div className="premium-card p-6 text-center">
                    <h3 className="text-[11px] font-bold text-text-slate uppercase tracking-wider mb-2">Active Sessions</h3>
                    <div className="text-4xl font-bold text-amber-500">
                        {sessions.length}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-text-slate animate-pulse">Loading tables...</div>
                ) : (
                    tables.map(table => {
                        const activeSessionForTable = sessions.find(s => s.tableId === table.id);
                        return (
                            <div key={table.id} className={`premium-card p-6 flex flex-col gap-5 transition-transform hover:-translate-y-1 relative ${table.isVip ? 'border-2 border-amber-400 bg-amber-50/10' : ''} ${activeSessionForTable ? 'border-l-4 border-l-amber-500' : ''}`}>
                                <div className="flex justify-between items-center">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-tight uppercase ${activeSessionForTable ? 'bg-red-50 text-red-600' : 
                                        table.status === 'AVAILABLE' ? 'bg-green-50 text-green-600' : 
                                        table.status === 'RESERVED' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                                        {activeSessionForTable ? 'IN SESSION' : table.status}
                                    </span>
                                    {table.isVip && <span className="text-[11px] font-bold text-amber-600">⭐ VIP</span>}
                                </div>
                                
                                <div className="h-28 flex flex-col items-center justify-center relative">
                                    <div className="w-24 h-20 bg-slate-50 border-3 border-slate-200 rounded-xl flex items-center justify-center z-10 shadow-sm">
                                        <span className="font-bold text-slate-700">{table.tableName}</span>
                                    </div>
                                    {activeSessionForTable && (
                                        <div className="mt-2 text-[11px] font-bold text-amber-600 z-20">
                                            {activeSessionForTable.paxCount} pax
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex flex-wrap content-between justify-between w-32 h-26 mx-auto pointer-events-none">
                                        {[...Array(Math.min(table.capacity, 8))].map((_, i) => (
                                            <div key={i} className="w-6 h-3 bg-slate-300 rounded-sm"></div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 text-[13px]">
                                    {activeSessionForTable ? (
                                        <>
                                            <p className="text-text-dark font-medium"><strong>Guest:</strong> {activeSessionForTable.guestName || 'Walk-in'}</p>
                                            <p className="text-text-slate"><strong>Time:</strong> {new Date(activeSessionForTable.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            <p className="text-primary font-bold"><strong>Bill:</strong> KSh {parseFloat(activeSessionForTable.totalAmount || 0).toLocaleString()}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-text-dark"><strong>Location:</strong> {table.location.replace('_', ' ')}</p>
                                            <p className="text-text-slate"><strong>Capacity:</strong> {table.capacity} Pax</p>
                                            {table.notes && <p className="text-[12px] text-text-slate italic mt-1 line-clamp-1">"{table.notes}"</p>}
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-auto">
                                    {activeSessionForTable ? (
                                        <button className="flex-1 btn-primary py-2 text-[12px]" onClick={() => handleManageSession(activeSessionForTable, table)}>Orders</button>
                                    ) : (
                                        <button className="flex-1 btn-primary py-2 text-[12px]" onClick={() => handleOpenTable(table)}>Open Table</button>
                                    )}
                                    <button className="bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 px-3 py-2 rounded-md text-[12px] font-semibold transition-all" onClick={() => {/* handleOpenModal(table) */}}>Edit</button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="mt-12 mb-6 border-b border-slate-200 pb-2">
                <h2 className="text-xl font-bold text-text-dark uppercase tracking-tight">Menu & Ordering</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
                {menuItems.map(item => (
                    <div key={item.id} className="premium-card p-4 flex justify-between items-center transition-all hover:border-primary/30">
                        <div className="flex flex-col gap-1">
                            <h3 className="font-bold text-text-dark m-0 leading-tight">{item.name}</h3>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{item.category?.name || 'General'}</span>
                            <div className="text-sm font-bold text-slate-700 mt-1">KSh {item.price}</div>
                        </div>
                        <button
                            className="btn-primary-outline px-3 py-1.5 text-[11px] font-bold"
                            onClick={() => {
                                if (sessions.length === 0) {
                                    alert('No active sessions. Please open a table first.');
                                } else if (sessions.length === 1) {
                                    const session = sessions[0];
                                    const table = tables.find(t => t.id === session.tableId);
                                    handleManageSession(session, table);
                                } else {
                                    alert('Multiple active sessions. Use the Orders button on the table to add items.');
                                }
                            }}
                        >
                            Add Order
                        </button>
                    </div>
                ))}
            </div>


            {/* Open Table / Session Modal */}
            {showSessionModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[70%] !max-w-[600px]">
                        <div className="modal-header">
                            <div>
                                <h2 className="text-xl font-bold text-primary">Open Table: {selectedTable?.tableName}</h2>
                                <p className="text-sm text-text-slate mt-0.5">Start a new dining session for this table.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowSessionModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSessionSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Guest Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={sessionFormData.guestName}
                                        onChange={(e) => setSessionFormData({...sessionFormData, guestName: e.target.value})}
                                        placeholder="Enter guest name or leave blank for Walk-in"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Pax Count</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={sessionFormData.paxCount}
                                        onChange={(e) => setSessionFormData({...sessionFormData, paxCount: parseInt(e.target.value) || 1})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Billing Type</label>
                                    <select
                                        value={sessionFormData.billingType}
                                        onChange={(e) => setSessionFormData({...sessionFormData, billingType: e.target.value})}
                                    >
                                        <option value="PAY_NOW">Pay Now (Cash/Card)</option>
                                        <option value="CHARGE_TO_ROOM">Charge to Room</option>
                                    </select>
                                </div>
                                {sessionFormData.billingType === 'CHARGE_TO_ROOM' && (
                                    <div className="form-group full-width">
                                        <label>Select Active Room to Charge</label>
                                        <select
                                            required
                                            value={sessionFormData.stayId || ''}
                                            onChange={(e) => setSessionFormData({...sessionFormData, stayId: parseInt(e.target.value)})}
                                        >
                                            <option value="">-- Select Room --</option>
                                            {stays.map(stay => (
                                                <option key={stay.id} value={stay.id}>
                                                    Room ID {stay.roomId} - Res ID {stay.reservationId}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowSessionModal(false)} className="btn-secondary !px-10">Dismiss</button>
                                <button type="submit" className="btn-primary !px-10">Start Session</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Order Management Modal */}
            {showOrderModal && activeSession && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[95%] !max-w-[1400px]">
                        <div className="modal-header">
                            <div>
                                <h2 className="text-xl font-bold text-primary">🧾 {selectedTable?.tableName} — {activeSession.guestName || 'Walk-in'}</h2>
                                <p className="text-sm text-text-slate mt-0.5">
                                    Session opened at {new Date(activeSession.openedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} · {activeSession.paxCount} pax
                                </p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowOrderModal(false)}>&times;</button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-7 overflow-hidden">
                            {/* Left: Current Orders */}
                            <div className="flex flex-col overflow-hidden bg-slate-50 rounded-xl p-5 border border-slate-200">
                                <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Current Order</h3>
                                {orderLoading ? (
                                    <div className="text-center py-10 text-text-slate animate-pulse">Loading orders...</div>
                                ) : sessionOrders.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
                                        <p className="m-0">No items yet.</p>
                                        <p className="text-[12px] mt-1">Add items from the menu →</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-4 pr-1">
                                        {sessionOrders.map(order => (
                                            <div key={order.id} className="flex justify-between items-center bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-slate-800 text-sm">{order.menuItem?.name || `Item #${order.menuItemId}`}</span>
                                                    <span className="text-[11px] text-slate-500">x{order.quantity} @ KSh {parseFloat(order.unitPrice || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-primary text-sm">KSh {parseFloat(order.totalAmount || 0).toLocaleString()}</span>
                                                    <button className="bg-red-50 text-red-600 hover:bg-red-200 w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none pb-0.5 transition-all" onClick={() => handleRemoveOrder(order.id)}>×</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between items-center py-4 border-t-2 border-slate-200 mt-auto">
                                    <span className="text-base font-bold text-slate-700">Total</span>
                                    <span className="text-2xl font-extrabold text-primary">KSh {orderTotal.toLocaleString()}</span>
                                </div>

                                <button
                                    className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    onClick={handleCloseSession}
                                    disabled={sessionOrders.length === 0}
                                >
                                    ✓ Settle & Close Table
                                </button>
                            </div>

                            {/* Right: Menu Picker */}
                            <div className="flex flex-col overflow-hidden bg-slate-50 rounded-xl p-5 border border-slate-200">
                                <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Select Items</h3>
                                <div className="grid grid-cols-2 gap-3 overflow-y-auto flex-1 pr-1">
                                    {menuItems.map(item => (
                                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 cursor-pointer transition-all hover:border-primary group" onClick={() => handleAddToOrder(item)}>
                                            <div className="font-bold text-slate-800 text-sm mb-0.5">{item.name}</div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">{item.category?.name || 'General'}</div>
                                            <div className="text-primary font-bold text-base mt-2">KSh {parseFloat(item.price || 0).toLocaleString()}</div>
                                            <div className="mt-2 text-[11px] text-green-600 font-bold group-hover:translate-x-1 transition-transform">+ Add</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Restaurant;
