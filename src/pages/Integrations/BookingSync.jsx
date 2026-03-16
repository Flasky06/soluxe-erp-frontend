import React from 'react';
import { Globe, ShieldCheck, RefreshCw, Zap } from 'lucide-react';

const BookingSync = () => {
    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto py-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden premium-card bg-slate-900 p-12 text-white">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                    <Globe size={300} />
                </div>
                
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-500/30">
                        <Zap size={12} />
                        Next-Gen Channel Manager
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter mb-4 leading-tight">
                        Booking.com <br />
                        <span className="text-blue-400">Direct Synchronization</span>
                    </h1>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed">
                        Say goodbye to manual adjustments. We are building a deep-level API integration with Booking.com to sync your inventory, rates, and reservations in real-time.
                    </p>
                    <div className="mt-10 flex items-center gap-4">
                        <div className="px-6 py-3 bg-blue-600 rounded-xl font-bold text-sm shadow-xl shadow-blue-900/40">
                            Coming Soon
                        </div>
                        <div className="text-sm font-bold text-slate-500 italic">
                            Expected Launch: Q2 2026
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard 
                    icon={RefreshCw}
                    title="Inventory Sync"
                    description="Automatically close rooms on Booking.com when guest check-ins or manual reservations are made."
                />
                <FeatureCard 
                    icon={ShieldCheck}
                    title="Price Parity"
                    description="Update rates across all platforms simultaneously to maintain price consistency and avoid penalties."
                />
                <FeatureCard 
                    icon={Globe}
                    title="Direct Reservations"
                    description="Bookings from the platform flow directly into your Front Desk and Folio system."
                />
            </div>

            {/* Visual Placeholder */}
            <div className="premium-card bg-white p-10 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center py-32">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
                    <RefreshCw size={40} className="animate-spin-slow" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Integration Workspace Under Construction</h3>
                <p className="text-slate-400 max-w-md mt-2 font-medium">
                    Our engineering team is currently working with Booking.com's connectivity APIs to ensure a 99.9% uptime for your channel synchronization.
                </p>
            </div>
        </div>
    );
};

const FeatureCard = (props) => {
    const Icon = props.icon;
    return (
        <div className="premium-card bg-white p-8">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Icon size={24} />
            </div>
            <h4 className="text-lg font-black text-slate-800 mb-2 tracking-tight">{props.title}</h4>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">{props.description}</p>
        </div>
    );
};

export default BookingSync;
