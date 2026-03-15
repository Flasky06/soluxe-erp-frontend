import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    Utensils, 
    Users, 
    Clock, 
    Plus, 
    LogOut, 
    ChefHat, 
    Search,
    Edit2,
    Trash2,
    Info,
    LayoutGrid,
    Table as TableIcon,
    Coffee
} from 'lucide-react';

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
                status: 'OPEN'
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
                status: 'PENDING'
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
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Restaurant Management</h2>
                    <p className="text-sm text-slate-500 font-medium">Manage floor layout, active dining sessions, and menu orders.</p>
                </div>
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

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <TableIcon className="text-maroon" size={20} />
                        Floor Layout & Active Tables
                    </h3>
                </div>

                <div className="premium-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th className="w-[15%]">Table</th>
                                    <th className="w-[15%]">Location</th>
                                    <th className="w-[10%]">Pax</th>
                                    <th className="w-[15%]">Status</th>
                                    <th className="w-[20%]">Current Guest</th>
                                    <th className="w-[25%] text-right pr-6">Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="6" className="py-6"><div className="h-4 bg-slate-100 rounded mx-4"></div></td>
                                        </tr>
                                    ))
                                ) : tables.length > 0 ? (
                                    tables.map(table => {
                                        const activeSessionForTable = sessions.find(s => s.tableId === table.id);
                                        return (
                                            <tr key={table.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm
                                                            ${table.isVip ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                                                            {table.tableName.replace('Table ', '')}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800">{table.tableName}</span>
                                                            {table.isVip && <span className="text-[9px] font-black text-amber-600 uppercase">VIP Table</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-slate-600 font-medium capitalize">{table.location.replace('_', ' ').toLowerCase()}</span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-1.5 text-slate-600">
                                                        <Users size={14} className="opacity-50" />
                                                        <span className="font-bold">{table.capacity}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${
                                                        activeSessionForTable ? 'warning' : 
                                                        table.status === 'AVAILABLE' ? 'success' : 
                                                        table.status === 'RESERVED' ? 'info' : 'secondary'
                                                    }`}>
                                                        {activeSessionForTable ? 'IN SESSION' : table.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {activeSessionForTable ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-bold text-slate-800">{activeSessionForTable.guestName || 'Walk-in'}</span>
                                                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                                                                <span className="text-maroon">KSh {parseFloat(activeSessionForTable.totalAmount || 0).toLocaleString()}</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={10} />
                                                                    {new Date(activeSessionForTable.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-xs">Ready for seating</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex items-center justify-end gap-2 pr-4">
                                                        {activeSessionForTable ? (
                                                            <button 
                                                                onClick={() => handleManageSession(activeSessionForTable, table)}
                                                                className="flex items-center gap-2 bg-maroon text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-maroon/90 shadow-sm transition-all active:scale-95"
                                                            >
                                                                <ChefHat size={14} />
                                                                Manage Orders
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleOpenTable(table)}
                                                                className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 shadow-sm transition-all active:scale-95"
                                                            >
                                                                <Plus size={14} />
                                                                Open Table
                                                            </button>
                                                        )}
                                                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-slate-400 italic">No tables configured.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Utensils className="text-maroon" size={20} />
                        Menu & Ordering Picker
                    </h3>
                </div>

                <div className="premium-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th className="w-[40%]">Item Name</th>
                                    <th className="w-[20%]">Category</th>
                                    <th className="w-[20%]">Price</th>
                                    <th className="w-[20%] text-right pr-6">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {menuItems.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-maroon">
                                                    {item.category?.name?.toLowerCase().includes('drink') ? <Coffee size={14} /> : <Utensils size={14} />}
                                                </div>
                                                <span className="font-bold text-slate-800">{item.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-1 rounded-md">
                                                {item.category?.name || 'General'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="font-bold text-slate-700">KSh {parseFloat(item.price).toLocaleString()}</span>
                                        </td>
                                        <td>
                                            <div className="flex justify-end pr-4">
                                                <button
                                                    onClick={() => {
                                                        if (sessions.length === 0) {
                                                            alert('No active sessions. Please open a table first.');
                                                        } else if (sessions.length === 1) {
                                                            const session = sessions[0];
                                                            const table = tables.find(t => t.id === session.tableId);
                                                            handleManageSession(session, table);
                                                        } else {
                                                            alert('Multiple active sessions. Use the "Manage Orders" button on a specific table to add items.');
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 bg-slate-50 text-maroon border border-maroon/20 hover:bg-maroon hover:text-white px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                                                >
                                                    <Plus size={12} />
                                                    Quick Add
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
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
