import React, { useState, useEffect, useCallback } from 'react';
import { 
    TrendingUp, 
    ArrowUpRight, 
    ArrowDownRight, 
    Download, 
    Calendar,
    PieChart,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import api from '../../services/api';

const ProfitAndLoss = () => {
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/profit-and-loss?startDate=${startDate}&endDate=${endDate}`);
            setData(res.data);
        } catch (err) {
            console.error("Error fetching P&L:", err);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!data && loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold">Generating Statement...</div>;

    const SectionRow = ({ label, value, isTotal = false, isIndented = false, isNegative = false }) => (
        <div className={`flex justify-between items-center py-3 ${isTotal ? 'border-t-2 border-slate-200 mt-2 font-black text-slate-900 pt-4' : 'border-b border-slate-50 text-slate-600 font-medium'}`}>
            <span className={`${isIndented ? 'pl-6' : ''}`}>{label}</span>
            <span className={`${isNegative && value > 0 ? 'text-red-500' : ''}`}>
                {isNegative && value > 0 ? '(' : ''}
                {parseFloat(value || 0).toLocaleString()}
                {isNegative && value > 0 ? ')' : ''}
            </span>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-text-dark tracking-tight">Profit & Loss Statement</h1>
                    <p className="text-text-slate mt-1">Income and expenditure for the selected period</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-transparent outline-none" />
                        <span className="text-slate-300">→</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-transparent outline-none" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard 
                    label="Gross Revenue" 
                    value={data?.totalRevenue} 
                    icon={TrendingUp} 
                    color="text-emerald-600" 
                    bg="bg-emerald-50" 
                />
                <SummaryCard 
                    label="Total OpEx" 
                    value={data?.totalOperatingExpenses} 
                    icon={PieChart} 
                    color="text-red-600" 
                    bg="bg-red-50" 
                />
                <SummaryCard 
                    label="Net Profit" 
                    value={data?.netProfit} 
                    icon={BarChart3} 
                    color="text-blue-600" 
                    bg="bg-blue-50" 
                />
            </div>

            <div className="premium-card p-10 bg-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <TrendingUp size={200} />
                </div>
                
                <div className="mb-10 text-center border-b border-slate-100 pb-10">
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-widest">Soluxe Club Hotel Limited</h2>
                    <p className="text-slate-400 font-bold mt-2">STATEMENT OF COMPREHENSIVE INCOME</p>
                    <p className="text-xs font-bold text-primary mt-1 uppercase tracking-tighter">
                        For the period: {startDate} to {endDate}
                    </p>
                </div>

                {/* Revenue Section */}
                <div className="mb-8">
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4">I. Revenue</h3>
                    {data?.revenueByDepartment && Object.entries(data.revenueByDepartment).map(([dept, amt]) => (
                        <SectionRow key={dept} label={`Sales - ${dept}`} value={amt} isIndented />
                    ))}
                    <SectionRow label="Total Revenue" value={data?.totalRevenue} isTotal />
                </div>

                {/* COGS Section */}
                <div className="mb-8">
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4">II. Cost of Sales</h3>
                    <SectionRow label="Cost of Supplies & Material" value={data?.costOfSales} isIndented isNegative />
                    <SectionRow label="Total Cost of Sales" value={data?.costOfSales} isTotal isNegative />
                </div>

                <div className="mb-10 bg-slate-50 p-4 rounded-xl flex justify-between items-center">
                    <span className="text-lg font-black text-slate-700 uppercase tracking-tight">Gross Profit</span>
                    <span className="text-2xl font-black text-slate-900">KSh {parseFloat(data?.grossProfit || 0).toLocaleString()}</span>
                </div>

                {/* Expenses Section */}
                <div className="mb-8">
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4">III. Operating Expenses</h3>
                    <SectionRow label="Payroll & Employee Benefits" value={data?.payrollExpenses} isIndented isNegative />
                    <SectionRow label="Operational Expenses (Utilities, Admin)" value={data?.operationalExpenses} isIndented isNegative />
                    <SectionRow label="Maintenance & Repairs" value={data?.maintenanceCosts} isIndented isNegative />
                    <SectionRow label="Petty Cash Disbursements" value={data?.pettyCashExpenses} isIndented isNegative />
                    <SectionRow label="Total Operating Expenses" value={data?.totalOperatingExpenses} isTotal isNegative />
                </div>

                {/* Final Net Profit */}
                <div className="mt-12 bg-primary p-6 rounded-2xl flex justify-between items-center text-white shadow-2xl shadow-primary/30">
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-80">Net Profit for the Period</h4>
                        <div className="flex items-center gap-2 mt-1 font-bold italic opacity-60 text-[10px]">
                            <span>Margin: {data?.operatingMargin}%</span>
                            <ArrowRight size={10} />
                        </div>
                    </div>
                    <span className="text-4xl font-black tracking-tighter">KSh {parseFloat(data?.netProfit || 0).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ label, value, icon: _Icon, color, bg }) => {
    const Icon = _Icon;
    return (
        <div className="premium-card p-6 flex items-center justify-between">
            <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                <div className={`text-2xl font-black mt-1 ${color}`}>KSh {parseFloat(value || 0).toLocaleString()}</div>
            </div>
            <div className={`p-3 rounded-2xl ${bg} ${color}`}>
                <Icon size={24} />
            </div>
        </div>
    );
};

export default ProfitAndLoss;
