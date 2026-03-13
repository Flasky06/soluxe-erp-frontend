import React, { useState, useMemo, useCallback } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { 
    LayoutDashboard, 
    Wrench, 
    CalendarCheck, 
    LogIn, 
    LogOut, 
    Users, 
    Bed, 
    MapPin, 
    CalendarPlus, 
    Sparkles, 
    Utensils, 
    CreditCard, 
    ChefHat, 
    FileText, 
    Settings, 
    Layers, 
    Box, 
    Truck, 
    UsersRound, 
    Building2, 
    Settings2 
} from 'lucide-react';

const menuGroups = [
    {
        title: 'Overview',
        icon: LayoutDashboard,
        items: [
            { label: 'Dashboard', path: '/', icon: LayoutDashboard },
            { label: 'Maintenance', path: '/maintenance', icon: Wrench, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_MAINTENANCE', 'ROLE_RECEPTIONIST'] },
            { label: 'Issue Types', path: '/maintenance-issue-types', icon: Settings2, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER'] },
        ]
    },
    {
        title: 'Front Desk',
        icon: CalendarCheck,
        items: [
            { label: 'Reservations', path: '/reservations', icon: CalendarCheck, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Check-in', path: '/check-in', icon: LogIn, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Check-out', path: '/check-out', icon: LogOut, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Guests', path: '/guests', icon: Users, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Rooms', path: '/rooms', icon: Bed, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Venues', path: '/venues', icon: MapPin, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Venue Bookings', path: '/venue-bookings', icon: CalendarPlus, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'] },
            { label: 'Housekeeping', path: '/housekeeping', icon: Sparkles, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_HOUSEKEEPING', 'ROLE_RECEPTIONIST'] },
        ]
    },
    {
        title: 'Kitchen & Dining',
        icon: Utensils,
        items: [
            { label: 'Restaurant POS', path: '/restaurant', icon: Utensils, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_WAITER', 'ROLE_CASHIER'] },
            { label: 'Quick POS', path: '/pos', icon: CreditCard, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_WAITER', 'ROLE_CASHIER', 'ROLE_RECEPTIONIST'] },
            { label: 'Kitchen Orders', path: '/kitchen', icon: ChefHat, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_CHEF'] },
            { label: 'Menu Items', path: '/menu-items', icon: Layers, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER'] },
            { label: 'Menu Categories', path: '/menu-categories', icon: Box, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER'] },
            { label: 'Tables', path: '/tables', icon: Utensils, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER'] },
        ]
    },
    {
        title: 'Financials',
        icon: FileText,
        items: [
            { label: 'Folio & Billing', path: '/folio', icon: FileText, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT'] },
            { label: 'Charge Types', path: '/charge-types', icon: Layers, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'] },
            { label: 'Payment Methods', path: '/payment-methods', icon: CreditCard, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'] },
            { label: 'Reports', path: '/reports', icon: FileText, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'] },
        ]
    },
    {
        title: 'Inventory',
        icon: Box,
        items: [
            { label: 'Stock Management', path: '/inventory', icon: Box, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_STORE_KEEPER'] },
            { label: 'Stock Categories', path: '/inventory-categories', icon: Layers, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_STORE_KEEPER'] },
            { label: 'Stock Units', path: '/inventory-units', icon: Box, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_STORE_KEEPER'] },
            { label: 'Suppliers', path: '/suppliers', icon: Truck, allowedRoles: ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_STORE_KEEPER'] },
        ]
    },
    {
        title: 'System Admin',
        icon: Settings,
        items: [
            { label: 'User Management', path: '/users', icon: UsersRound, allowedRoles: ['ROLE_HOTEL_ADMIN'] },
            { label: 'Employees', path: '/employees', icon: UsersRound, allowedRoles: ['ROLE_HOTEL_ADMIN'] },
            { label: 'Departments', path: '/departments', icon: Building2, allowedRoles: ['ROLE_HOTEL_ADMIN'] },
            { label: 'Room Types', path: '/room-types', icon: Layers, allowedRoles: ['ROLE_HOTEL_ADMIN'] },
            { label: 'Leave Types', path: '/leave-types', icon: CalendarPlus, allowedRoles: ['ROLE_HOTEL_ADMIN'] },
            { label: 'Settings', path: '/settings', icon: Settings2, allowedRoles: ['ROLE_HOTEL_ADMIN'] },
        ]
    }
];

const Sidebar = () => {
    const { user, logout } = useAuthStore();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
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
        <aside className="w-[var(--sidebar-width)] h-screen bg-maroon border-r border-border-gray flex flex-col py-6 fixed left-0 top-0 z-[100]">
            <div className="px-6 mb-10 flex items-center gap-3">
                <span className="text-xl font-extrabold -tracking-tight text-white">Soluxe <span className="text-yellow">Hotel</span></span>
            </div>
            
            <nav className="flex-1 flex flex-col overflow-y-auto">
                {filteredGroups.map((group) => (
                    <div key={group.title} className="flex flex-col mb-2">
                        <div 
                            className="flex justify-between items-center px-6 py-3 cursor-pointer text-white/40 text-[11px] uppercase tracking-wider font-bold transition-all duration-300 hover:text-white/80" 
                            onClick={() => toggleGroup(group.title)}
                        >
                            <div className="flex items-center gap-3">
                                {group.icon && <group.icon size={14} className="opacity-70" />}
                                <span>{group.title}</span>
                            </div>
                            <span className={`text-[10px] transition-transform duration-300 ${openGroup === group.title ? 'rotate-0' : '-rotate-90'}`}>▼</span>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 bg-black/10 ${openGroup === group.title ? 'max-h-[800px]' : 'max-h-0'}`}>
                            {group.items.map((item) => (
                                <NavLink 
                                    key={item.label} 
                                    to={item.path} 
                                    className={({ isActive }) => 
                                        `flex items-center gap-3 px-6 py-3 pl-8 no-underline text-white/70 font-medium text-sm transition-all duration-300 border-l-4 border-transparent hover:text-yellow hover:bg-yellow/5 ${isActive ? 'text-yellow bg-yellow/10 border-l-yellow font-bold' : ''}`
                                    }
                                >
                                    {item.icon && <item.icon size={16} />}
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-6 border-t border-border-gray">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-linear-to-br from-yellow to-yellow-dark rounded-[10px] flex items-center justify-center font-bold text-[13px] text-white">
                        {user ? user.username.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{user ? user.username : 'Guest User'}</span>
                        <span className="text-[12px] text-white/70">
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
                <button 
                    className="mt-5 w-full p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 hover:bg-maroon hover:text-white hover:border-maroon" 
                    onClick={handleLogout} 
                    title="Sign Out"
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
