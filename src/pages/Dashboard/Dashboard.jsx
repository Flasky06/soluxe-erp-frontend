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
function ModuleTile({ icon, label, subtitle, stat, statLabel, accentClass, bgClass, textClass, onClick }) {
    const Icon = icon;
    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col justify-between p-6 rounded-3xl border-2 ${accentClass} ${bgClass} hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer text-left overflow-hidden`}
            style={{ minHeight: '120px' }}
        >
            {/* Watermark icon */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.06] pointer-events-none">
                <Icon size={110} />
            </div>

            {/* Top: icon + label */}
            <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200 shrink-0`}>
                    <Icon size={22} className={textClass} />
                </div>
                <div className="pt-0.5">
                    <div className={`text-sm font-extrabold ${textClass} leading-tight`}>{label}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">{subtitle}</div>
                </div>
            </div>

            {/* Bottom: live stat */}
            {stat !== undefined && (
                <div className="mt-4">
                    <span className={`text-4xl font-black ${textClass}`}>{stat}</span>
                    {statLabel && <span className="text-[11px] font-bold text-slate-400 ml-2 uppercase tracking-wider">{statLabel}</span>}
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
    const greeting = (() => {
        const hour = new Date().getHours();
        if (hour < 12) return t('Good Morning');
        if (hour < 17) return t('Good Afternoon');
        return t('Good Evening');
    })();

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
            accentClass: 'border-blue-200',
            bgClass: 'bg-blue-50',
            textClass: 'text-blue-700',
            route: '/reservations',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: LogIn,
            label: t('Check-In'),
            subtitle: t('Welcome arriving guests'),
            stat: stats.totalArrivalsToday,
            statLabel: t('expected'),
            accentClass: 'border-green-200',
            bgClass: 'bg-green-50',
            textClass: 'text-green-700',
            route: '/check-in',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: LogOut,
            label: t('Check-Out'),
            subtitle: t('Process departing guests'),
            stat: stats.totalDeparturesToday,
            statLabel: t('departures today'),
            accentClass: 'border-orange-200',
            bgClass: 'bg-orange-50',
            textClass: 'text-orange-700',
            route: '/check-out',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: Users,
            label: t('Guests'),
            subtitle: t('Guest profiles & history'),
            stat: stats.activeStays,
            statLabel: t('in-house'),
            accentClass: 'border-indigo-200',
            bgClass: 'bg-indigo-50',
            textClass: 'text-indigo-700',
            route: '/guests',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: Bed,
            label: t('Rooms'),
            subtitle: t('Room status & availability'),
            stat: stats.totalRooms - stats.activeStays,
            statLabel: t('available'),
            accentClass: 'border-slate-200',
            bgClass: 'bg-slate-50',
            textClass: 'text-slate-700',
            route: '/rooms',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: Sparkles,
            label: t('Housekeeping'),
            subtitle: t('Cleaning tasks & room status'),
            stat: stats.pendingHousekeeping,
            statLabel: t('pending'),
            accentClass: 'border-teal-200',
            bgClass: 'bg-teal-50',
            textClass: 'text-teal-700',
            route: '/housekeeping',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_HOUSEKEEPING', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: FileText,
            label: t('Folio & Billing'),
            subtitle: t('Guest charges & invoices'),
            stat: `${stats.occupancyRate}%`,
            statLabel: t('occupancy'),
            accentClass: 'border-purple-200',
            bgClass: 'bg-purple-50',
            textClass: 'text-purple-700',
            route: '/folio',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST', 'ROLE_ACCOUNTANT'),
        },
        {
            icon: BarChart2,
            label: t('Reports'),
            subtitle: t('Revenue, reservations & guests'),
            accentClass: 'border-rose-200',
            bgClass: 'bg-rose-50',
            textClass: 'text-rose-700',
            route: '/reports',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'),
        },
        {
            icon: CreditCard,
            label: t('Payment Methods'),
            subtitle: t('Configure payment options'),
            accentClass: 'border-yellow-200',
            bgClass: 'bg-yellow-50',
            textClass: 'text-yellow-700',
            route: '/payment-methods',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'),
        },
        {
            icon: Layers,
            label: t('Charge Types'),
            subtitle: t('Manage billing charge items'),
            accentClass: 'border-amber-200',
            bgClass: 'bg-amber-50',
            textClass: 'text-amber-700',
            route: '/charge-types',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTANT'),
        },
        {
            icon: Building2,
            label: t('Venues'),
            subtitle: t('Manage venue spaces'),
            accentClass: 'border-pink-200',
            bgClass: 'bg-pink-50',
            textClass: 'text-pink-700',
            route: '/venues',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: CalendarDays,
            label: t('Venue Bookings'),
            subtitle: t('Event & function bookings'),
            accentClass: 'border-violet-200',
            bgClass: 'bg-violet-50',
            textClass: 'text-violet-700',
            route: '/venue-bookings',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: KeyRound,
            label: t('Keycards'),
            subtitle: t('Door keycard management'),
            accentClass: 'border-cyan-200',
            bgClass: 'bg-cyan-50',
            textClass: 'text-cyan-700',
            route: '/keycards',
            allowed: hasRole('ROLE_HOTEL_ADMIN', 'ROLE_MANAGER', 'ROLE_RECEPTIONIST'),
        },
        {
            icon: Settings,
            label: t('Settings'),
            subtitle: t('System configuration'),
            accentClass: 'border-gray-200',
            bgClass: 'bg-gray-50',
            textClass: 'text-gray-600',
            route: '/settings',
            allowed: hasRole('ROLE_HOTEL_ADMIN'),
        },
    ].filter(tile => tile.allowed);

    return (
        <div className="flex flex-col gap-6 pb-8">

            {/* ── Greeting header ── */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                    {greeting}, <span className="text-maroon">{user?.username}</span> 👋
                </h1>
                <p className="text-sm text-slate-400 font-medium mt-0.5">
                    {t('What would you like to do today?')}
                </p>
            </div>

            {/* ── Occupancy Banner ── */}
            <div className="flex items-center gap-3 p-3 bg-maroon rounded-2xl text-white flex-wrap">
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white/10 border border-white/20 shrink-0">
                    <span className="text-xl font-black text-yellow">{stats.occupancyRate}%</span>
                    <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">{t('Occupancy')}</span>
                </div>
                <div className="flex gap-4 flex-wrap">
                    <div className="flex flex-col">
                        <span className="text-xl font-black">{stats.activeStays}</span>
                        <span className="text-[10px] text-white/70 font-bold uppercase tracking-wide">{t('In-House')}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-green-300">{stats.totalArrivalsToday}</span>
                        <span className="text-[10px] text-white/70 font-bold uppercase tracking-wide">{t('Arrivals')}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-orange-300">{stats.totalDeparturesToday}</span>
                        <span className="text-[10px] text-white/70 font-bold uppercase tracking-wide">{t('Departures')}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-yellow">{stats.cleanRooms}</span>
                        <span className="text-[10px] text-white/70 font-bold uppercase tracking-wide">{t('Clean')}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-red-300">{stats.dirtyRooms}</span>
                        <span className="text-[10px] text-white/70 font-bold uppercase tracking-wide">{t('Dirty')}</span>
                    </div>
                </div>
            </div>

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
                        accentClass={tile.accentClass}
                        bgClass={tile.bgClass}
                        textClass={tile.textClass}
                        onClick={() => navigate(tile.route)}
                    />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
