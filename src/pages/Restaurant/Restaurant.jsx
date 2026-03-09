import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Restaurant.css';

const Restaurant = () => {
    const [tables, setTables] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [stays, setStays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [formData, setFormData] = useState({
        tableName: '',
        capacity: 2,
        location: 'MAIN_HALL',
        isVip: false,
        notes: '',
        status: 'AVAILABLE'
    });
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

    const handleOpenModal = (table = null) => {
        if (table) {
            setEditingTable(table);
            setFormData({
                tableName: table.tableName,
                capacity: table.capacity,
                location: table.location,
                isVip: table.isVip,
                notes: table.notes || '',
                status: table.status
            });
        } else {
            setEditingTable(null);
            setFormData({
                tableName: '',
                capacity: 2,
                location: 'MAIN_HALL',
                isVip: false,
                notes: '',
                status: 'AVAILABLE'
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTable) {
                await api.put(`/restaurant-tables/${editingTable.id}`, formData);
            } else {
                await api.post('/restaurant-tables', formData);
            }
            setShowModal(false);
            fetchTables();
        } catch (err) {
            console.error('Failed to save table:', err);
            alert('Failed to save table.');
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
            await api.post('/dining-sessions', {
                ...sessionFormData,
                tableId: selectedTable.id,
                status: 'OPEN',
                openedAt: new Date().toISOString()
            });
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

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'status-available';
            case 'OCCUPIED': return 'status-occupied';
            case 'RESERVED': return 'status-reserved';
            default: return '';
        }
    };

    return (
        <div className="restaurant-page">
            <div className="page-header">
                <div>
                    <h1>Restaurant Table Management</h1>
                    <p>Monitor real-time table occupancy and manage configurations.</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add Table</button>
            </div>

            <div className="restaurant-stats-grid">
                <div className="premium-card stat-card">
                    <h3>Total Tables</h3>
                    <div className="stat-value">{tables.length}</div>
                </div>
                <div className="premium-card stat-card">
                    <h3>Available</h3>
                    <div className="stat-value" style={{color: '#10b981'}}>
                        {tables.filter(t => t.status === 'AVAILABLE').length}
                    </div>
                </div>
                <div className="premium-card stat-card">
                    <h3>Occupied</h3>
                    <div className="stat-value" style={{color: '#ef4444'}}>
                        {tables.filter(t => t.status === 'OCCUPIED').length}
                    </div>
                </div>
                <div className="premium-card stat-card">
                    <h3>Active Sessions</h3>
                    <div className="stat-value" style={{color: '#f59e0b'}}>
                        {sessions.length}
                    </div>
                </div>
            </div>

            <div className="tables-grid">
                {loading ? (
                    <div className="loading">Loading tables...</div>
                ) : (
                    tables.map(table => {
                        const activeSessionForTable = sessions.find(s => s.tableId === table.id);
                        return (
                            <div key={table.id} className={`premium-card table-card ${table.isVip ? 'vip-table' : ''} ${activeSessionForTable ? 'session-active' : ''}`}>
                                <div className="table-card-header">
                                    <span className={`status-pill ${activeSessionForTable ? 'status-occupied' : getStatusBadgeClass(table.status)}`}>
                                        {activeSessionForTable ? 'IN SESSION' : table.status}
                                    </span>
                                    {table.isVip && <span className="vip-badge">⭐ VIP</span>}
                                </div>
                                <div className="table-visual">
                                    <div className="table-shape">
                                        <span className="table-name">{table.tableName}</span>
                                    </div>
                                    {activeSessionForTable && (
                                        <div className="session-indicator">
                                            <span className="guest-count">{activeSessionForTable.paxCount} pax</span>
                                        </div>
                                    )}
                                    <div className="chairs-visual">
                                        {[...Array(Math.min(table.capacity, 8))].map((_, i) => (
                                            <div key={i} className="chair"></div>
                                        ))}
                                    </div>
                                </div>
                                <div className="table-details">
                                    {activeSessionForTable ? (
                                        <>
                                            <p className="active-guest"><strong>Guest:</strong> {activeSessionForTable.guestName || 'Walk-in'}</p>
                                            <p className="session-time"><strong>Time:</strong> {new Date(activeSessionForTable.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            <p className="bill-preview"><strong>Bill:</strong> KES {parseFloat(activeSessionForTable.totalAmount || 0).toLocaleString()}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p><strong>Location:</strong> {table.location.replace('_', ' ')}</p>
                                            <p><strong>Capacity:</strong> {table.capacity} Pax</p>
                                            {table.notes && <p className="table-notes">"{table.notes}"</p>}
                                        </>
                                    )}
                                </div>
                                <div className="table-card-actions">
                                    {activeSessionForTable ? (
                                        <button className="btn-primary" onClick={() => handleManageSession(activeSessionForTable, table)}>🧾 Orders</button>
                                    ) : (
                                        <button className="btn-primary" onClick={() => handleOpenTable(table)}>Open Table</button>
                                    )}
                                    <button className="edit-btn" onClick={() => handleOpenModal(table)}>Config</button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="section-divider">
                <h2>Menu & Ordering</h2>
            </div>

            <div className="menu-grid">
                {menuItems.map(item => (
                    <div key={item.id} className="premium-card menu-item-card">
                        <div className="menu-item-info">
                            <h3>{item.name}</h3>
                            <span className="category-tag">{item.category?.name || 'General'}</span>
                            <div className="price-tag">KES {item.price}</div>
                        </div>
                        <button
                            className="btn-primary btn-sm"
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
                            Add to Order
                        </button>
                    </div>
                ))}
            </div>

            {/* Table Config Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card modal-xl">
                        <div className="modal-header">
                            <div className="modal-title-area">
                                <h2>{editingTable ? 'Edit Table Configuration' : 'Register New Table'}</h2>
                                <p className="modal-subtitle">Configure table properties and service details.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Table Name / Number</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.tableName}
                                        onChange={(e) => setFormData({...formData, tableName: e.target.value})}
                                        placeholder="e.g. Table 12 or Window Corner"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Capacity (Pax)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Location</label>
                                    <select
                                        value={formData.location}
                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    >
                                        <option value="MAIN_HALL">Main Hall</option>
                                        <option value="PRIVATE_ROOM">Private Room</option>
                                        <option value="GARDEN">Garden</option>
                                        <option value="BAR">Bar</option>
                                        <option value="TAKEAWAY">Takeaway</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Current Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="AVAILABLE">Available</option>
                                        <option value="OCCUPIED">Occupied</option>
                                        <option value="RESERVED">Reserved</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '25px'}}>
                                    <input
                                        type="checkbox"
                                        id="isVip"
                                        checked={formData.isVip}
                                        onChange={(e) => setFormData({...formData, isVip: e.target.checked})}
                                    />
                                    <label htmlFor="isVip" style={{marginBottom: 0}}>VIP Table</label>
                                </div>
                                <div className="form-group full-width">
                                    <label>Internal Service Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        placeholder="Special setup requirements, preferred server, or location-specific notes..."
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Dismiss</button>
                                <button type="submit" className="btn-primary">
                                    {editingTable ? 'Update Configuration' : 'Create Table'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Open Table / Session Modal */}
            {showSessionModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card session-modal">
                        <div className="modal-header">
                            <div className="modal-title-area">
                                <h2>Open Table: {selectedTable?.tableName}</h2>
                                <p className="modal-subtitle">Start a new dining session for this table.</p>
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
                                        onChange={(e) => setSessionFormData({...sessionFormData, paxCount: parseInt(e.target.value)})}
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
                                <button type="button" onClick={() => setShowSessionModal(false)} className="btn-secondary">Dismiss</button>
                                <button type="submit" className="btn-primary">Start Session</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Order Management Modal */}
            {showOrderModal && activeSession && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card modal-xl">
                        <div className="modal-header">
                            <div className="modal-title-area">
                                <h2>🧾 {selectedTable?.tableName} — {activeSession.guestName || 'Walk-in'}</h2>
                                <p className="modal-subtitle">
                                    Session opened at {new Date(activeSession.openedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} · {activeSession.paxCount} pax
                                </p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowOrderModal(false)}>&times;</button>
                        </div>

                        <div className="order-modal-body">
                            {/* Left: Current Orders */}
                            <div className="order-list-panel">
                                <h3 className="panel-title">Current Order</h3>
                                {orderLoading ? (
                                    <div className="loading">Loading orders...</div>
                                ) : sessionOrders.length === 0 ? (
                                    <div className="order-empty-state">
                                        <p>No items yet.</p>
                                        <p className="sub-text">Add items from the menu →</p>
                                    </div>
                                ) : (
                                    <div className="order-items-list">
                                        {sessionOrders.map(order => (
                                            <div key={order.id} className="order-item-row">
                                                <div className="order-item-info">
                                                    <span className="order-item-name">{order.menuItem?.name || `Item #${order.menuItemId}`}</span>
                                                    <span className="order-item-meta">x{order.quantity} @ KES {parseFloat(order.unitPrice || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="order-item-right">
                                                    <span className="order-item-total">KES {parseFloat(order.totalAmount || 0).toLocaleString()}</span>
                                                    <button className="remove-order-btn" onClick={() => handleRemoveOrder(order.id)}>×</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="bill-total-bar">
                                    <span className="bill-label">Total</span>
                                    <span className="bill-amount">KES {orderTotal.toLocaleString()}</span>
                                </div>

                                <button
                                    className="btn-danger close-session-btn"
                                    onClick={handleCloseSession}
                                    disabled={sessionOrders.length === 0}
                                >
                                    ✓ Settle & Close Table
                                </button>
                            </div>

                            {/* Right: Menu Picker */}
                            <div className="menu-picker-panel">
                                <h3 className="panel-title">Menu</h3>
                                <div className="menu-picker-grid">
                                    {menuItems.map(item => (
                                        <div key={item.id} className="menu-picker-card" onClick={() => handleAddToOrder(item)}>
                                            <div className="picker-item-name">{item.name}</div>
                                            <div className="picker-item-category">{item.category?.name || 'General'}</div>
                                            <div className="picker-item-price">KES {parseFloat(item.price || 0).toLocaleString()}</div>
                                            <div className="picker-add-btn">+ Add</div>
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
