import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import useNotifications from '../../services/useNotifications';

const colorMap = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100'   },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100'    },
    yellow: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100'  },
    green:  { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-100'},
};

// Map path to human-readable page title
const pageTitles = {
    '/':                  'Dashboard',
    '/reservations':      'Reservations',
    '/check-in':          'Check-In',
    '/check-out':         'Check-Out',
    '/guests':            'Guests',
    '/rooms':             'Rooms',
    '/venues':            'Venues',
    '/venue-bookings':    'Venue Bookings',
    '/housekeeping':      'Housekeeping',
    '/restaurant':        'Restaurant POS',
    '/pos':               'Quick POS',
    '/kitchen':           'Kitchen Orders',
    '/menu-items':        'Menu Items',
    '/menu-categories':   'Menu Categories',
    '/tables':            'Tables',
    '/folio':             'Folio & Billing',
    '/reports':           'Reports & Analytics',
    '/inventory':         'Stock Management',
    '/inventory-categories': 'Inventory Categories',
    '/suppliers':         'Suppliers',
    '/maintenance':       'Maintenance',
    '/users':             'User Management',
    '/employees':         'Employees',
    '/departments':       'Departments',
    '/room-types':        'Room Types',
    '/settings':          'Settings',
};

const MainLayout = ({ children }) => {
    const { notifications, totalCount } = useNotifications();
    const [panelOpen, setPanelOpen] = useState(false);
    const panelRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const pageTitle = pageTitles[location.pathname] || 'Soluxe Hotel CRM';

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAlertClick = (path) => {
        setPanelOpen(false);
        navigate(path);
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-[var(--sidebar-width)] flex flex-col min-h-screen">

                {/* ── Header ── */}
                <header className="h-[var(--header-height)] px-8 flex items-center justify-between
                                   border-b border-slate-100 bg-white sticky top-0 z-[90]
                                   shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

                    {/* Page breadcrumb / title */}
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-slate-400">Soluxe Hotel</span>
                        <span className="text-slate-200 font-light">/</span>
                        <span className="text-[13px] font-bold text-slate-700">{pageTitle}</span>
                    </div>

                    {/* Right-side actions */}
                    <div className="flex items-center gap-6" ref={panelRef}>
                        
                        {/* Date & Time Display */}
                        <div className="hidden md:flex flex-col items-end border-r border-slate-100 pr-6">
                            <span className="text-[13px] font-bold text-slate-700 tracking-tight">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>

                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setPanelOpen(prev => !prev)}
                                title="Alerts"
                                className={`relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer
                                    ${panelOpen
                                        ? 'bg-maroon text-white border-maroon'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'}`}
                            >
                                {/* Bell SVG */}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                </svg>
                                {totalCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px]
                                                     bg-red-500 text-white text-[9px] font-extrabold
                                                     rounded-full flex items-center justify-center px-0.5
                                                     border-2 border-white leading-none">
                                        {totalCount > 9 ? '9+' : totalCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Panel */}
                            {panelOpen && (
                                <div className="absolute top-[calc(100%+8px)] right-0 w-[360px] bg-white
                                                border border-slate-200 rounded-2xl overflow-hidden
                                                shadow-[0_16px_48px_rgba(0,0,0,0.14)] z-[200]"
                                     style={{ animation: 'modalIn 0.18s cubic-bezier(0.16,1,0.3,1)' }}>

                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                        <span className="font-bold text-slate-800 text-sm">Alerts</span>
                                        {totalCount > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {totalCount} active
                                            </span>
                                        )}
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="py-12 text-center text-slate-400">
                                                <div className="text-2xl font-light text-slate-300 mb-2">✓</div>
                                                <p className="text-sm font-semibold">All clear</p>
                                                <p className="text-xs text-slate-300 mt-0.5">No active alerts</p>
                                            </div>
                                        ) : (
                                            <div className="p-2 flex flex-col gap-1">
                                                {notifications.map(n => {
                                                    const c = colorMap[n.color] || colorMap.blue;
                                                    return (
                                                        <button
                                                            key={n.id}
                                                            onClick={() => handleAlertClick(n.path)}
                                                            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border
                                                                        ${c.border} ${c.bg} hover:shadow-sm transition-all duration-150 cursor-pointer`}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`font-bold text-[12.5px] ${c.text}`}>{n.title}</p>
                                                                {n.detail && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{n.detail}</p>}
                                                            </div>
                                                            <span className="text-slate-300 text-sm">›</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/60">
                                        <span className="text-[10px] text-slate-300 font-medium">Refreshes every 2 min</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ── Page Content ── */}
                <div className="flex-1 p-8">
                    <div className="max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
