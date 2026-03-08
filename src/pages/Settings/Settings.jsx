import React from 'react';
import './Settings.css';

const Settings = () => {
    return (
        <div className="settings-page">
            <div className="page-header">
                <div>
                    <h1>System Settings</h1>
                    <p>Configure hotel policies, user permissions, and property details.</p>
                </div>
            </div>

            <div className="premium-card empty-state">
                <div className="success-icon">⚙️</div>
                <h2>Settings & Configuration</h2>
                <p>Core system identity and security configuration tools are being finalized.</p>
                <div className="settings-features">
                    <span className="badge-primary">User Roles</span>
                    <span className="badge-primary">Taxation Rules</span>
                    <span className="badge-primary">Property Info</span>
                </div>
            </div>
        </div>
    );
};

export default Settings;
