import React from 'react';
import './Kitchen.css';

const Kitchen = () => {
    return (
        <div className="kitchen-page">
            <div className="page-header">
                <div>
                    <h1>Kitchen Management</h1>
                    <p>Track food orders, preparation status, and inventory links.</p>
                </div>
            </div>

            <div className="premium-card empty-state">
                <div className="success-icon">👨‍🍳</div>
                <h2>Kitchen Module Ready for Integration</h2>
                <p>The kitchen order management and POS synchronization features are currently being finalized.</p>
                <div className="kitchen-features">
                    <span className="badge-primary">Live Order Tracking</span>
                    <span className="badge-primary">Recipe Mapping</span>
                    <span className="badge-primary">Stock Deduction</span>
                </div>
            </div>
        </div>
    );
};

export default Kitchen;
