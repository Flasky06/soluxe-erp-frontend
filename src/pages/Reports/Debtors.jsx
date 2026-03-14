import React, { useState, useEffect, useCallback } from 'react';
import { 
    Users, 
    Truck, 
    ArrowUpRight, 
    ArrowDownRight,
    Search,
    Download,
    Eye,
    ChevronRight
} from 'lucide-react';
import axios from 'axios';

const Debtors = () => {
    const [financeData, setFinanceData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchFinanceData = useCallback(async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/reports/revenue-report?startDate=${today}&endDate=${today}`);
            setFinanceData(res.data);
        } catch (err) {
            console.error("Error fetching debtor data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFinanceData();
    }, [fetchFinanceData]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-text-dark tracking-tight">Debtor Tracking</h1>
                    <p className="text-text-slate mt-1">Manage guest receivables and supplier payables</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Accounts Receivable Card */}
                <div className="premium-card p-6 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Users size={24} />
                        </div>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase">Assets</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Accounts Receivable (AR)</span>
                    <div className="text-3xl font-black text-slate-800 mt-1">
                        KSh {parseFloat(financeData?.accountsReceivable || 0).toLocaleString()}
                    </div>
                    <p className="text-[12px] text-slate-500 mt-2">Total outstanding due from checked-out guests</p>
                </div>

                {/* Accounts Payable Card */}
                <div className="premium-card p-6 border-l-4 border-l-red-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 rounded-xl text-red-600">
                            <Truck size={24} />
                        </div>
                        <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded uppercase">Liabilities</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Accounts Payable (AP)</span>
                    <div className="text-3xl font-black text-slate-800 mt-1">
                        KSh {parseFloat(financeData?.accountsPayable || 0).toLocaleString()}
                    </div>
                    <p className="text-[12px] text-slate-500 mt-2">Total owed to suppliers for received stock/orders</p>
                </div>
            </div>

            {/* Detailed Lists Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="premium-card p-6">
                    <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                        <span>Top Guest Debtors</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </h3>
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 italic text-sm">
                        Detailed guest debtor list coming soon...
                    </div>
                </div>

                <div className="premium-card p-6">
                    <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                        <span>Top Supplier Payables</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </h3>
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 italic text-sm">
                        Detailed supplier payable list coming soon...
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Debtors;
