import React from 'react';
import './Restaurant.css';

const Restaurant = () => {
    return (
        <div className="restaurant-page">
            <div className="page-header">
                <div>
                    <h1>Restaurant & Bar POS</h1>
                    <p>Handle table bookings, orders, and direct room billing.</p>
                </div>
            </div>

            <div className="premium-card empty-state">
                <div className="success-icon">🍷</div>
                <h2>Restaurant POS Module</h2>
                <p>Digital menu management and table ordering systems are currently being integrated.</p>
                <div className="restaurant-features">
                    <span className="badge-primary">Table Management</span>
                    <span className="badge-primary">Room Service Integration</span>
                    <span className="badge-primary">Split Billing</span>
                </div>
            </div>
        </div>
    );
};

export default Restaurant;
