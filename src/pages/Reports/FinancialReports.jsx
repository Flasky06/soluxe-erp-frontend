import React, { useState, useEffect, useCallback } from 'react';
import { 
    FileText, 
    TrendingUp, 
    CreditCard, 
    DollarSign, 
    ArrowUpRight, 
    ArrowDownRight,
    Search,
    Download,
    ShieldCheck,
    Zap,
    Building2,
    HardHat
} from 'lucide-react';
import axios from 'axios';

const FinancialReports = () => {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [financeData, setFinanceData] = useState(null);

    const fetchFinanceData = useCallback(async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/reports/revenue-report?startDate=${startDate}&endDate=${endDate}`);
            setFinanceData(res.data);
        } catch (err) {
            console.error("Error fetching finance reports:", err);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchFinanceData();
    }, [fetchFinanceData]);

    const downloadCSV = (data, filename) => {
        if (!data) return;
        const csvRows = [];
        const headers = Object.keys(data).filter(k => typeof data[k] !== 'object');
        csvRows.push(headers.join(','));
        const values = headers.map(h => data[h]);
        csvRows.push(values.join(','));
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-text-dark tracking-tight">Financial Reports</h1>
                    <p className="text-text-slate mt-1">Revenue audit and cash collection tracking</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-transparent outline-none" />
                        <span className="text-slate-300">→</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-transparent outline-none" />
                    </div>
                    <button 
                        onClick={() => downloadCSV(financeData, 'financial_summary')}
                        className="btn-secondary !bg-white border border-slate-200 flex items-center gap-2"
                    >
                        <Download size={18} />
                        Export
                    </button>
                </div>
            </div>

            {/* KPI Grill */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Billed Revenue" 
                    value={`KSh ${parseFloat(financeData?.totalRevenue || 0).toLocaleString()}`} 
                    desc="Total invoices generated"
                    icon={FileText}
                    color="text-primary"
                    bg="bg-primary/5"
                />
                <StatCard 
                    label="Cash Collected" 
                    value={`KSh ${parseFloat(financeData?.totalPayments || 0).toLocaleString()}`} 
                    desc="Actual payments received"
                    icon={CreditCard}
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <StatCard 
                    label="Total Expenses" 
                    value={`KSh ${parseFloat(financeData?.totalExpenses || 0).toLocaleString()}`} 
                    desc="Operational expenditures"
                    icon={ArrowDownRight}
                    color="text-red-600"
                    bg="bg-red-50"
                />
                <StatCard 
                    label="Net Profit" 
                    value={`KSh ${parseFloat(financeData?.totalPayments || 0) - parseFloat(financeData?.operationalExpenses || 0).toLocaleString()}`} 
                    desc="Collections - OpEx"
                    icon={DollarSign}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <StatCard 
                    label="Money In (Capital)" 
                    value={`KSh ${parseFloat(financeData?.totalCapitalInjected || 0).toLocaleString()}`} 
                    desc="Owner investments"
                    icon={TrendingUp}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
                <StatCard 
                    label="Fixed Assets" 
                    value={`KSh ${parseFloat(financeData?.totalAssets || 0).toLocaleString()}`} 
                    desc="Freezers, Furniture, etc."
                    icon={Building2}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown */}
                <div className="premium-card p-6">
                    <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100">Revenue by Charge Type</h3>
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="pb-3 text-left">Category</th>
                                <th className="pb-3 text-right">Amount (KSh)</th>
                                <th className="pb-3 text-right">Share (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {financeData?.revenueByChargeType && Object.entries(financeData.revenueByChargeType).map(([type, amount]) => (
                                <tr key={type}>
                                    <td className="py-4 text-sm font-semibold text-slate-600">{type}</td>
                                    <td className="py-4 text-right font-bold text-slate-800">{parseFloat(amount).toLocaleString()}</td>
                                    <td className="py-4 text-right">
                                        <span className="status-badge info">
                                            {Math.round((amount / (financeData.totalRevenue || 1)) * 100)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Treasury Audit & Cash Flow */}
                <div className="premium-card p-6">
                    <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                        <span>Treasury Audit</span>
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Unrealized Revenue</p>
                                <p className="text-sm font-black text-slate-700">Pending Folios</p>
                            </div>
                            <span className="text-sm font-black text-slate-600">
                                KSh {Math.max(0, (financeData?.totalRevenue || 0) - (financeData?.totalPayments || 0)).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Procurement</p>
                                <p className="text-sm font-black text-slate-700">Supply Spend</p>
                            </div>
                            <span className="text-sm font-black text-red-600">
                                KSh {parseFloat(financeData?.supplyCosts || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Payroll Liability</p>
                                <p className="text-sm font-black text-slate-700">Staff Salaries</p>
                            </div>
                            <span className="text-sm font-black text-red-600">
                                KSh {parseFloat(financeData?.payrollExpenses || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Inventory Assets</p>
                                <p className="text-sm font-black text-slate-700">Stock Value</p>
                            </div>
                            <span className="text-sm font-black text-blue-600">
                                KSh {parseFloat(financeData?.inventoryValue || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Petty Cash</p>
                                <p className="text-sm font-black text-slate-700">Daily Cash Spend</p>
                            </div>
                            <span className="text-sm font-black text-orange-600">
                                KSh {parseFloat(financeData?.pettyCash || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                            <div>
                                <p className="text-[10px] font-bold text-orange-600 uppercase">Maintenance</p>
                                <p className="text-sm font-black text-slate-700">Repairs & Upkeep</p>
                            </div>
                            <span className="text-sm font-black text-orange-600">
                                KSh {parseFloat(financeData?.maintenanceCosts || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* AR & AP Debtor Tracking */}
                <div className="premium-card p-6">
                    <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                        <span>Debtor Tracking</span>
                        <Search className="w-4 h-4 text-slate-500" />
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-red-50/50 border border-red-100">
                            <div>
                                <p className="text-[10px] font-bold text-red-600 uppercase">Accounts Payable</p>
                                <p className="text-sm font-black text-slate-700">Owed to Suppliers</p>
                            </div>
                            <span className="text-sm font-black text-red-600">
                                KSh {parseFloat(financeData?.accountsPayable || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                            <div>
                                <p className="text-[10px] font-bold text-blue-600 uppercase">Accounts Receivable</p>
                                <p className="text-sm font-black text-slate-700">Due from Guests</p>
                            </div>
                            <span className="text-sm font-black text-blue-600">
                                KSh {parseFloat(financeData?.accountsReceivable || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Owner's Equity & Savings */}
                <div className="premium-card p-6">
                    <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                        <span>Equity & Reserves</span>
                        <Zap className="w-4 h-4 text-amber-500" />
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                            <div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase">Total Savings</p>
                                <p className="text-sm font-black text-slate-700">Capital Reserves</p>
                            </div>
                            <span className="text-sm font-black text-emerald-600">
                                KSh {parseFloat(financeData?.totalSavings || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                            <div>
                                <p className="text-[10px] font-bold text-amber-600 uppercase">Total Drawings</p>
                                <p className="text-sm font-black text-slate-700">Owner Withdrawals</p>
                            </div>
                            <span className="text-sm font-black text-amber-600">
                                KSh {parseFloat(financeData?.totalDrawings || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-xs font-bold text-slate-500 uppercase italic">Available Liquidity</span>
                                <span className="text-lg font-black text-green-600">
                                    KSh {(
                                        parseFloat(financeData?.totalPayments || 0) + 
                                        parseFloat(financeData?.totalCapitalInjected || 0) - 
                                        parseFloat(financeData?.operationalExpenses || 0) - 
                                        parseFloat(financeData?.totalAssets || 0) -
                                        parseFloat(financeData?.totalDrawings || 0) -
                                        parseFloat(financeData?.pettyCash || 0)
                                    ).toLocaleString()}
                                </span>
                            </div>
                            <p className="px-1 mt-1 text-[10px] text-slate-400 text-right uppercase tracking-tighter">
                                Net Cash on Hand
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* General Ledger */}
            <div className="premium-card p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-700">General Ledger</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Running Balance History</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="pb-3">Timestamp</th>
                                <th className="pb-3">Account</th>
                                <th className="pb-3">Reference</th>
                                <th className="pb-3">Description</th>
                                <th className="pb-3 text-right">Debit / Credit</th>
                                <th className="pb-3 text-right">Running Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {financeData?.auditTray?.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 text-xs text-slate-500 whitespace-nowrap">
                                        {new Date(item.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td className="py-4">
                                        <span className={`status-badge ${
                                            item.type === 'REVENUE' || item.type === 'COLLECTION' ? 'success' : 'error'
                                        }`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="py-4 text-sm font-bold text-slate-700">{item.reference}</td>
                                    <td className="py-4 text-sm text-slate-600">{item.description}</td>
                                    <td className={`py-4 text-right font-black ${
                                        item.type === 'EXPENSE' || item.type === 'PROCUREMENT' ? 'text-red-500' : 'text-green-600'
                                    }`}>
                                        {item.type === 'EXPENSE' || item.type === 'PROCUREMENT' ? '-' : '+'}
                                        {parseFloat(item.amount || 0).toLocaleString()}
                                    </td>
                                    <td className="py-4 text-right">
                                        <span className="text-sm font-black text-slate-800">
                                            KSh {parseFloat(item.runningBalance || 0).toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!financeData?.auditTray || financeData.auditTray.length === 0) && (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-slate-400 italic text-sm">
                                        No ledger entries for this period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, desc, icon: _Icon, color, bg }) => {
    const Icon = _Icon;
    return (
        <div className="premium-card p-6 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <div className={`text-2xl font-black mt-1 ${color}`}>{value}</div>
                <p className="text-[12px] text-slate-500 mt-1 font-medium">{desc}</p>
            </div>
        </div>
    );
};

export default FinancialReports;
