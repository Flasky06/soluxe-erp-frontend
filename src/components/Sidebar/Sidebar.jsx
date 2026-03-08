import React, { useState, useMemo, useCallback } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import './Sidebar.css';

const menuGroups = [
    {
        title: 'Main',
        items: [
            { label: 'Dashboard', path: '/', allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
        ]
    },
    {
        title: 'Operations',
        items: [
            { label: 'Reservations', path: '/reservations', allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Rooms', path: '/rooms', allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Guests', path: '/guests', allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Housekeeping', path: '/housekeeping', allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_HOUSEKEEPING'] },
            { label: 'Maintenance', path: '/maintenance', allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_MAINTENANCE'] },
        ]
    },
    {
        title: 'Kitchen & Dining',
        items: [
            { label: 'Kitchen Orders', path: '/kitchen', allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_CHEF'] },
            { label: 'Restaurant POS', path: '/restaurant', allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_WAITER', 'ROLE_CASHIER'] },
        ]
    },
    {
        title: 'Financials',
        items: [
            { label: 'Folio & Billing', path: '/folio', allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT'] },
            { label: 'Reports', path: '/reports', allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'] },
        ]
    },
    {
        title: 'Inventory',
        items: [
            { label: 'Stock Management', path: '/inventory', allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_STORE_KEEPER'] },
        ]
    },
    {
        title: 'System',
        items: [
            { label: 'Settings', path: '/settings', allowedRoles: ['ROLE_HOTEL_ADMIN'] },
            { label: 'Departments', path: '/departments', allowedRoles: ['ROLE_HOTEL_ADMIN'] },
            { label: 'Room Types', path: '/room-types', allowedRoles: ['ROLE_HOTEL_ADMIN'] },
            { label: 'Employees', path: '/employees', allowedRoles: ['ROLE_HOTEL_ADMIN'] },
            { label: 'Inventory', path: '/inventory', allowedRoles: ['ROLE_HOTEL_ADMIN'] },
        ]
    }
];

const Sidebar = () => {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Helper to check if item is allowed for current user
    const isItemAllowed = useCallback((item) => {
        if (!item.allowedRoles) return true;
        return item.allowedRoles.some(role => user?.roles?.includes(role));
    }, [user?.roles]);

    // Filter groups and items
    const filteredGroups = useMemo(() => {
        return menuGroups.map(group => ({
            ...group,
            items: group.items.filter(isItemAllowed)
        })).filter(group => group.items.length > 0);
    }, [isItemAllowed]);

    // Derive active group from current path
    const activeGroupTitle = useMemo(() => {
        const currentPath = location.pathname;
        const activeGroup = filteredGroups.find(group => 
            group.items.some(item => item.path === currentPath)
        );
        return activeGroup ? activeGroup.title : null;
    }, [location.pathname, filteredGroups]);

    const [openGroupState, setOpenGroupState] = useState(null);
    const [prevActiveGroup, setPrevActiveGroup] = useState(null);

    // Sync state with active group change during render (React recommended pattern)
    let openGroup = openGroupState;
    if (activeGroupTitle !== prevActiveGroup) {
        setPrevActiveGroup(activeGroupTitle);
        setOpenGroupState(activeGroupTitle);
        openGroup = activeGroupTitle;
    }

    const toggleGroup = (title) => {
        setOpenGroupState(openGroup === title ? null : title);
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span className="logo-icon">🏨</span>
                <span className="logo-text">Soluxe<span>Hotel</span></span>
            </div>
            
            <nav className="sidebar-nav">
                {filteredGroups.map((group) => (
                    <div key={group.title} className={`nav-group ${openGroup === group.title ? 'is-open' : ''}`}>
                        <div 
                            className="nav-group-header" 
                            onClick={() => toggleGroup(group.title)}
                        >
                            <span className="nav-group-title">{group.title}</span>
                            <span className="chevron">{openGroup === group.title ? '▼' : '▶'}</span>
                        </div>
                        <div className="nav-group-items">
                            {group.items.map((item) => (
                                <NavLink 
                                    key={item.label} 
                                    to={item.path} 
                                    className={({ isActive }) => `nav-item submenu-item ${isActive ? 'active' : ''}`}
                                >
                                    <span className="nav-label">{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="user-avatar">
                        {user ? user.username.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user ? user.username : 'Guest User'}</span>
                        <span className="user-role">
                            {user?.roles?.includes('ROLE_HOTEL_ADMIN') ? 'Hotel Admin' : 
                             user?.roles?.includes('ROLE_MANAGER') ? 'Manager' : 
                             user?.roles?.includes('ROLE_RECEPTIONIST') ? 'Receptionist' : 
                             user?.roles?.includes('ROLE_HOUSEKEEPING') ? 'Housekeeping' : 
                             user?.roles?.includes('ROLE_ACCOUNTANT') ? 'Accountant' : 
                             user?.roles?.includes('ROLE_CHEF') ? 'Chef' : 
                             user?.roles?.includes('ROLE_WAITER') ? 'Waiter' : 
                             user?.roles?.includes('ROLE_CASHIER') ? 'Cashier' : 
                             user?.roles?.includes('ROLE_STORE_KEEPER') ? 'Store Keeper' : 
                             user?.roles?.includes('ROLE_MAINTENANCE') ? 'Maintenance' : 'Staff'}
                        </span>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout} title="Sign Out">
                    <span className="logout-icon">Logout 🚪</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
