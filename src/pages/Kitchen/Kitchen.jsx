import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import './Kitchen.css';

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

    const getAgeClass = (orderedAt) => {
        if (!orderedAt) return '';
        const diff = Math.floor((Date.now() - new Date(orderedAt)) / 60000);
        if (diff >= 15) return 'order-urgent';
        if (diff >= 8) return 'order-warning';
        return '';
    };

    return (
        <div className="kitchen-page">
            <div className="page-header">
                <div>
                    <h1>Kitchen Management</h1>
                    <p>Manage master menu and monitor live preparation queue.</p>
                </div>
                {activeTab === 'orders' && (
                    <button className="btn-secondary" onClick={fetchLiveOrders}>↻ Refresh</button>
                )}
            </div>

            <div className="kitchen-tabs">
                <button
                    className={`tab-btn ${activeTab === 'master-menu' ? 'active' : ''}`}
                    onClick={() => setActiveTab('master-menu')}
                >
                    Master Menu
                </button>
                <button
                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Live Orders {pendingOrders.length > 0 && <span className="orders-badge">{pendingOrders.length}</span>}
                </button>
            </div>

            {loading && activeTab === 'master-menu' ? (
                <div className="loading">Loading menu data...</div>
            ) : (
                <div className="tab-content">
                    {activeTab === 'master-menu' && (
                        <div className="menu-selection-grid">
                            {menuItems.length === 0 ? (
                                <div className="premium-card empty-state">
                                    <p>No menu items found. Add items from the Restaurant page.</p>
                                </div>
                            ) : menuItems.map(item => (
                                <div key={item.id} className="menu-select-card active">
                                    <div className="card-info">
                                        <h3>{item.name}</h3>
                                        <span className="category-tag">{item.category?.name || 'General'}</span>
                                        <div className="price-tag">KES {item.price}</div>
                                        {item.prepTimeMins && (
                                            <div className="prep-time">⏱ {item.prepTimeMins} min prep</div>
                                        )}
                                    </div>
                                    <div className="card-controls">
                                        <span className={`availability-badge ${item.available ? 'available' : 'unavailable'}`}>
                                            {item.available ? '✓ Available' : '✗ Unavailable'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div>
                            {ordersLoading ? (
                                <div className="loading">Fetching live orders...</div>
                            ) : pendingOrders.length === 0 ? (
                                <div className="premium-card empty-state">
                                    <div className="success-icon">🔥</div>
                                    <h2>All Clear!</h2>
                                    <p>No pending orders in the queue right now.</p>
                                </div>
                            ) : (
                                <div className="live-orders-grid">
                                    {pendingOrders.map(order => (
                                        <div key={order.id} className={`premium-card order-ticket ${getAgeClass(order.orderedAt)}`}>
                                            <div className="ticket-header">
                                                <span className="ticket-table">
                                                    Table — Session #{order.sessionInfo?.id}
                                                </span>
                                                <span className="ticket-time">{getOrderAge(order.orderedAt)}</span>
                                            </div>
                                            <div className="ticket-item-name">
                                                {order.menuItem?.name || `Item #${order.menuItemId}`}
                                            </div>
                                            <div className="ticket-qty">Qty: {order.quantity}</div>
                                            {order.notes && (
                                                <div className="ticket-notes">📝 {order.notes}</div>
                                            )}
                                            <button
                                                className="btn-primary ticket-serve-btn"
                                                onClick={() => handleMarkServed(order.id)}
                                            >
                                                ✓ Mark Served
                                            </button>
                                        </div>
                                    ))}
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
