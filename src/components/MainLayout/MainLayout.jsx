import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import './MainLayout.css';

const MainLayout = ({ children }) => {
    return (
        <div className="main-layout">
            <Sidebar />
            <main className="main-content">
                <header className="content-header">
                    <div className="header-spacer"></div>
                    <div className="header-actions">
                        <button className="action-btn notification-btn">
                            <span>🔔</span>
                            <span className="badge"></span>
                        </button>
                    </div>
                </header>
                <div className="page-body">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
