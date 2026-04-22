import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import useAuthStore from '../../store/authStore';

import {
    CalendarCheck, LogIn, LogOut, FileText, Sparkles, Users,
    Bed, BarChart2, Settings, KeyRound, CreditCard, Layers,
    Building2, CalendarDays,
} from 'lucide-react';

// ─── Module Tile ──────────────────────────────────────────────────────────────
function ModuleTile({ icon, label, subtitle, stat, statLabel, gradient, onClick }) {
    const Icon = icon;
    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col justify-between p-5 rounded-3xl ${gradient} hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 cursor-pointer text-left overflow-hidden`}
            style={{ minHeight: '130px' }}
        >
            {/* Watermark icon */}
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                <Icon size={110} className="text-white" />
            </div>

            {/* Top: icon + label */}
            <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white/30 transition-all duration-200 shrink-0">
                    <Icon size={20} className="text-white" />
                </div>
                <div className="pt-0.5">
                    <div className="text-sm font-extrabold text-white leading-tight drop-shadow-sm">{label}</div>
                    <div className="text-[11px] text-white/70 font-medium mt-0.5 leading-tight">{subtitle}</div>
                </div>
            </div>

            {/* Bottom: live stat */}
            {stat !== undefined && (
                <div className="mt-4">
                    <span className="text-4xl font-black text-white drop-shadow">{stat}</span>
                    {statLabel && <span className="text-[11px] font-bold text-white/70 ml-2 uppercase tracking-wider">{statLabel}</span>}
                </div>
            )}
        </button>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { t } = useLanguage();

    const [stats, setStats] = useState({
        totalArrivalsToday: 0,
        totalDeparturesToday: 0,
        activeStays: 0,
        totalRooms: 0,
        occupancyRate: 0,
        pendingHousekeeping: 0,
        cleanRooms: 0,
        dirtyRooms: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/summary');
                setStats(res.data);
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            }
        };
        fetchStats();
    }, []);

    const hasRole = (...roles) => roles.some(r => user?.roles?.includes(r));

    const tiles = [
        {
            icon: CalendarCheck,
            label: t('Reservations'),
            subtitle: t('Bookings & upcoming stays'),
            stat: stats.totalArrivalsToday,
            statLabel: t('arrivals today'),
            gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
            route: '/reservations',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: LogIn,
            label: t('Check-In'),
            subtitle: t('Welcome arriving guests'),
            stat: stats.totalArrivalsToday,
            statLabel: t('expected'),
            gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
            route: '/check-in',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: LogOut,
            label: t('Check-Out'),
            subtitle: t('Process departing guests'),
            stat: stats.totalDeparturesToday,
            statLabel: t('departures today'),
            gradient: 'bg-gradient-to-br from-orange-500 to-orange-700',
            route: '/check-out',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: Users,
            label: t('Guests'),
            subtitle: t('Guest profiles & history'),
            stat: stats.activeStays,
            statLabel: t('in-house'),
            gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
            route: '/guests',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: Bed,
            label: t('Rooms'),
            subtitle: t('Room status & availability'),
            stat: stats.totalRooms - stats.activeStays,
            statLabel: t('available'),
            gradient: 'bg-gradient-to-br from-slate-500 to-slate-700',
            route: '/rooms',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: Sparkles,
            label: t('Housekeeping'),
            subtitle: t('Cleaning tasks & room status'),
            stat: stats.pendingHousekeeping,
            statLabel: t('pending'),
            gradient: 'bg-gradient-to-br from-teal-500 to-teal-700',
            route: '/housekeeping',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_HOUSEKEEPING', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: FileText,
            label: t('Folio & Billing'),
            subtitle: t('Guest charges & invoices'),
            stat: `${stats.occupancyRate}%`,
            statLabel: t('occupancy'),
            gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
            route: '/folio',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT'),
        },
        {
            icon: BarChart2,
            label: t('Reports'),
            subtitle: t('Revenue, reservations & guests'),
            gradient: 'bg-gradient-to-br from-rose-500 to-rose-700',
            route: '/reports',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'),
        },
        {
            icon: CreditCard,
            label: t('Payment Methods'),
            subtitle: t('Configure payment options'),
            gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
            route: '/payment-methods',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'),
        },
        {
            icon: Layers,
            label: t('Charge Types'),
            subtitle: t('Manage billing charge items'),
            gradient: 'bg-gradient-to-br from-amber-500 to-amber-700',
            route: '/charge-types',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'),
        },
        {
            icon: Building2,
            label: t('Venues'),
            subtitle: t('Manage venue spaces'),
            gradient: 'bg-gradient-to-br from-pink-500 to-pink-700',
            route: '/venues',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: CalendarDays,
            label: t('Venue Bookings'),
            subtitle: t('Event & function bookings'),
            gradient: 'bg-gradient-to-br from-violet-500 to-violet-700',
            route: '/venue-bookings',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: KeyRound,
            label: t('Keycards'),
            subtitle: t('Door keycard management'),
            gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
            route: '/keycards',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: Settings,
            label: t('Settings'),
            subtitle: t('System configuration'),
            gradient: 'bg-gradient-to-br from-gray-500 to-gray-700',
            route: '/settings',
            allowed: hasRole('ROLE_HOTEL_ADMIN'),
        },
    ].filter(tile => tile.allowed);

    return (
        <div className="flex flex-col gap-6 pb-8">
            {/* ── Module Tile Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {tiles.map(tile => (
                    <ModuleTile
                        key={tile.route}
                        icon={tile.icon}
                        label={tile.label}
                        subtitle={tile.subtitle}
                        stat={tile.stat}
                        statLabel={tile.statLabel}
                        gradient={tile.gradient}
                        onClick={() => navigate(tile.route)}
                    />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
