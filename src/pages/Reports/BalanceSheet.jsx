import React, { useState, useEffect, useCallback } from 'react';
import { 
    LayoutDashboard, 
    Building2, 
    Wallet, 
    ShieldCheck, 
    Download,
    ArrowRightCircle,
    ArrowUpCircle,
    ArrowDownCircle,
    CreditCard
} from 'lucide-react';
import api from '../../services/api';

const BalanceSheet = () => {
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/balance-sheet?asOfDate=${asOfDate}`);
            setData(res.data);
        } catch (err) {
            console.error("Error fetching balance sheet:", err);
        } finally {
            setLoading(false);
        }
    }, [asOfDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!data && loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold text-xl uppercase tracking-widest">Compiling Assets & Liabilities...</div>;

    const StatementLine = ({ label, value, isIndented = false, isBold = false, isTotal = false }) => (
        <div className={`flex justify-between items-center py-2 ${isTotal ? 'border-t-2 border-slate-700 font-black text-slate-900 mt-2 mb-4 pt-3' : 'border-b border-slate-50 text-sm'} ${isBold ? 'font-black text-slate-800' : 'text-slate-600 font-medium'}`}>
            <span className={isIndented ? 'pl-8 text-xs' : ''}>{label}</span>
            <span>$ {parseFloat(value || 0).toLocaleString()}</span>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-text-dark tracking-tight">Balance Sheet</h1>
                    <p className="text-text-slate mt-1">Snapshot of financial position as of a specific date</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                        <span className="pl-4 text-xs font-bold text-slate-400 uppercase tracking-widest">As At:</span>
                        <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)}
                            className="px-4 py-2 text-sm font-black text-primary bg-transparent outline-none" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Left Column: Assets */}
                <div className="premium-card p-8 bg-white border-t-8 border-t-emerald-500 shadow-xl min-h-[700px]">
                    <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-100">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">ASSETS</h2>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic border-l-4 border-emerald-500 pl-3">Current Assets</h3>
                        <div>
                            <StatementLine label="Cash and Cash Equivalents" value={data?.cashOnHand} isIndented />
                            <StatementLine label="Accounts Receivable (Net)" value={data?.accountsReceivable} isIndented />
                            <StatementLine label="Inventory" value={data?.inventoryValue} isIndented />
                            <StatementLine label="Total Current Assets" value={data?.totalCurrentAssets} isBold />
                        </div>

                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic border-l-4 border-emerald-500 pl-3 mt-10">Non-Current Assets</h3>
                        <div>
                            <StatementLine label="Furniture, Plant & Equipment" value={data?.fixedAssetsValue} isIndented />
                            <StatementLine label="Accumulated Depreciation" value={0} isIndented />
                            <StatementLine label="Total Non-Current Assets" value={data?.fixedAssetsValue} isBold />
                        </div>
                    </div>

                    <div className="mt-auto pt-20">
                        <div className="bg-emerald-500 p-6 rounded-2xl flex justify-between items-center text-white shadow-lg shadow-emerald-200">
                            <span className="font-black uppercase tracking-widest text-sm">Total Assets</span>
                            <span className="text-3xl font-black tracking-tighter">$ {parseFloat(data?.totalAssets || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Liabilities & Equity */}
                <div className="flex flex-col gap-6 h-full">
                    
                    {/* Liabilities Section */}
                    <div className="premium-card p-8 bg-white border-t-8 border-t-red-500 shadow-xl flex-1">
                        <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">LIABILITIES</h2>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic border-l-4 border-red-500 pl-3">Current Liabilities</h3>
                            <div>
                                <StatementLine label="Accounts Payable" value={data?.accountsPayable} isIndented />
                                <StatementLine label="Taxes Payable" value={data?.taxPayable} isIndented />
                                <StatementLine label="Total Current Liabilities" value={data?.totalLiabilities} isBold />
                            </div>
                        </div>
                    </div>

                    {/* Equity Section */}
                    <div className="premium-card p-8 bg-white border-t-8 border-t-indigo-500 shadow-xl flex-1">
                        <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-100">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">EQUITY</h2>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic border-l-4 border-indigo-500 pl-3">Owner's Equity</h3>
                            <div>
                                <StatementLine label="Capital Injected" value={data?.capitalInjected} isIndented />
                                <StatementLine label="Retained Earnings" value={data?.retainedEarnings} isIndented />
                                <StatementLine label="Total Equity" value={data?.totalEquity} isBold />
                            </div>
                        </div>
                    </div>

                    {/* Final Equation Verification */}
                    <div className="bg-slate-900 p-6 rounded-2xl flex justify-between items-center text-white shadow-xl">
                        <div className="flex flex-col">
                            <span className="font-bold uppercase tracking-widest text-[10px] opacity-60">Total Liabilities & Equity</span>
                            <span className="text-2xl font-black tracking-tighter">$ {(parseFloat(data?.totalLiabilities || 0) + parseFloat(data?.totalEquity || 0)).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${Math.abs((data?.totalAssets || 0) - ((data?.totalLiabilities || 0) + (data?.totalEquity || 0))) < 1 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`}></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Balanced</span>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default BalanceSheet;
