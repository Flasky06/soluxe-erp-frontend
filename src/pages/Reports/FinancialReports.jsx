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
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const FinancialReports = () => {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [financeData, setFinanceData] = useState(null);
    const { t } = useLanguage();

    const fetchFinanceData = useCallback(async () => {
        try {
            const res = await api.get(`/reports/revenue-report?startDate=${startDate}&endDate=${endDate}`);
            setFinanceData(res.data);
        } catch (err) {
            console.error("Error fetching finance reports:", err);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        const load = async () => {
            await fetchFinanceData();
        };
        load();
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
                    <h1 className="text-2xl font-black text-text-dark tracking-tight">{t('Financial Reports')}</h1>
                    <p className="text-text-slate mt-1">{t('Revenue audit and cash collection tracking')}</p>
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
                        {t('Export')}
                    </button>
                </div>
            </div>

            {/* KPI Grill */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label={t('Billed Revenue')}  value={`$ ${parseFloat(financeData?.totalRevenue || 0).toLocaleString()}`}  desc={t('Total invoices generated')} color="text-primary" bg="bg-primary/5" />
                <StatCard label={t('Cash Collected')}   value={`$ ${parseFloat(financeData?.totalPayments || 0).toLocaleString()}`}  desc={t('Actual payments received')} color="text-green-600" bg="bg-green-50" />
                <StatCard label={t('Total Expenses')}   value={`$ ${parseFloat(financeData?.totalExpenses || 0).toLocaleString()}`}  desc={t('Operational expenditures')} color="text-red-600" bg="bg-red-50" />
                <StatCard label={t('Net Collections')}  value={`$ ${ (parseFloat(financeData?.totalPayments || 0) - parseFloat(financeData?.operationalExpenses || 0)).toLocaleString()}`} desc={t('Collections - OpEx')} color="text-blue-600" bg="bg-blue-50" />
                <StatCard label={t('Petty Cash')}       value={`$ ${parseFloat(financeData?.pettyCash || 0).toLocaleString()}`}       desc={t('Daily cash spend')} color="text-orange-600" bg="bg-orange-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown */}
                <div className="premium-card p-6">
                    <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100">{t('Revenue by Charge Type')}</h3>
                    <div className="overflow-x-auto">
                        <table className="management-table" style={{ minWidth: '700px' }}>
                            <thead>
                                <tr>
                                    <th className="text-left">{t('Category')}</th>
                                    <th className="text-right" style={{ width: '140px' }}>{t('Amount ($)')}</th>
                                    <th className="text-right" style={{ width: '140px' }}>{t('Share (%)')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {financeData?.revenueByChargeType && Object.entries(financeData.revenueByChargeType).map(([type, amount]) => (
                                    <tr key={type}>
                                        <td className="py-4 text-sm font-semibold text-slate-600">{type}</td>
                                        <td className="py-4 text-right font-bold text-slate-800">{parseFloat(amount).toLocaleString()}</td>
                                        <td className="py-4 text-right">
                                            <div className="flex flex-col gap-2 relative z-10">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{type}</span>
                                                    <span className="text-[10px] font-black text-maroon bg-maroon/5 px-2 py-0.5 rounded-full">
                                                        {financeData ? Math.round((amount / (financeData.totalRevenue || 1)) * 100) : 0}% Share
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xl font-black text-slate-800">$ {amount.toLocaleString()}</span>
                                                    <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-maroon transition-all duration-1000" 
                                                            style={{ width: `${financeData ? Math.min(100, (amount / (financeData.totalRevenue || 1)) * 100) : 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Treasury Audit & Cash Flow */}
                <div className="premium-card p-6">
                    <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                        <span>{t('Treasury Audit')}</span>
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Unrealized Revenue')}</p>
                                <p className="text-sm font-black text-slate-700">{t('Pending Folios')}</p>
                            </div>
                            <span className="text-sm font-black text-slate-600">
                                $ {Math.max(0, (financeData?.totalRevenue || 0) - (financeData?.totalPayments || 0)).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Procurement')}</p>
                                <p className="text-sm font-black text-slate-700">{t('Supply Spend')}</p>
                            </div>
                            <span className="text-sm font-black text-red-600">
                                $ {parseFloat(financeData?.supplyCosts || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Payroll Liability')}</p>
                                <p className="text-sm font-black text-slate-700">{t('Staff Salaries')}</p>
                            </div>
                            <span className="text-sm font-black text-red-600">
                                $ {parseFloat(financeData?.payrollExpenses || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Inventory Assets')}</p>
                                <p className="text-sm font-black text-slate-700">{t('Stock Value')}</p>
                            </div>
                            <span className="text-sm font-black text-blue-600">
                                $ {parseFloat(financeData?.inventoryValue || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{t('Petty Cash')}</p>
                                <p className="text-sm font-black text-slate-700">{t('Daily Cash Spend')}</p>
                            </div>
                            <span className="text-sm font-black text-orange-600">
                                $ {parseFloat(financeData?.pettyCash || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                            <div>
                                <p className="text-[10px] font-bold text-orange-600 uppercase">{t('Maintenance')}</p>
                                <p className="text-sm font-black text-slate-700">{t('Repairs & Upkeep')}</p>
                            </div>
                            <span className="text-sm font-black text-orange-600">
                                $ {parseFloat(financeData?.maintenanceCosts || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* AR & AP Debtor Tracking */}
                <div className="premium-card p-6">
                    <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                        <span>{t('Debtor Tracking')}</span>
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-red-50/50 border border-red-100">
                            <div>
                                <p className="text-[10px] font-bold text-red-600 uppercase">{t('Accounts Payable')}</p>
                                <p className="text-sm font-black text-slate-700">{t('Owed to Suppliers')}</p>
                            </div>
                            <span className="text-sm font-black text-red-600">
                                $ {parseFloat(financeData?.accountsPayable || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                            <div>
                                <p className="text-[10px] font-bold text-blue-600 uppercase">{t('Accounts Receivable')}</p>
                                <p className="text-sm font-black text-slate-700">{t('Due from Guests')}</p>
                            </div>
                            <span className="text-sm font-black text-blue-600">
                                $ {parseFloat(financeData?.accountsReceivable || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="premium-card p-6">
                    <h3 className="text-base font-bold text-slate-700 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                        <span>{t('Liquidity Summary')}</span>
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                            <div>
                                <p className="text-[10px] font-bold text-orange-600 uppercase">{t('Petty Cash')}</p>
                                <p className="text-sm font-black text-slate-700">{t('Daily Cash Spend')}</p>
                            </div>
                            <span className="text-sm font-black text-orange-600">
                                $ {parseFloat(financeData?.pettyCash || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-xs font-bold text-slate-500 uppercase italic">{t('Active Collections')}</span>
                                <span className="text-lg font-black text-green-600">
                                    $ {(
                                        parseFloat(financeData?.totalPayments || 0) - 
                                        parseFloat(financeData?.operationalExpenses || 0) - 
                                        parseFloat(financeData?.pettyCash || 0)
                                    ).toLocaleString()}
                                </span>
                            </div>
                            <p className="px-1 mt-1 text-[10px] text-slate-400 text-right uppercase tracking-tighter">
                                {t('Net Cash from Operations')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* General Ledger */}
            <div className="premium-card p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-700">{t('General Ledger')}</h3>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('Running Balance History')}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="management-table" style={{ minWidth: '700px' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '180px' }}>{t('Timestamp')}</th>
                                <th style={{ width: '120px' }}>{t('Account')}</th>
                                <th style={{ width: '140px' }}>{t('Reference')}</th>
                                <th>{t('Description')}</th>
                                <th className="text-right" style={{ width: '140px' }}>{t('Debit / Credit')}</th>
                                <th className="text-right" style={{ width: '140px' }}>{t('Running Balance')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {financeData?.auditTrail?.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="text-xs text-slate-500 whitespace-nowrap">
                                        {new Date(item.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${
                                            item.type === 'REVENUE' || item.type === 'COLLECTION' ? 'success' : 'error'
                                        }`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="text-sm font-bold text-slate-700">{item.reference}</td>
                                    <td className="text-sm text-slate-600">{item.description}</td>
                                    <td className={`text-right font-black ${
                                        item.type === 'EXPENSE' || item.type === 'PROCUREMENT' ? 'text-red-500' : 'text-green-600'
                                    }`}>
                                        {item.type === 'EXPENSE' || item.type === 'PROCUREMENT' ? '-' : '+'}
                                        {parseFloat(item.amount || 0).toLocaleString()}
                                    </td>
                                    <td className="text-right">
                                        <span className="text-sm font-black text-slate-800">
                                            $ {parseFloat(item.runningBalance || 0).toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!financeData?.auditTrail || financeData.auditTrail.length === 0) && (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center text-slate-400 italic text-sm">
                                        {t('No data found')}
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

const StatCard = ({ label, value, desc, color }) => {
    return (
        <div className="premium-card p-6 flex items-start gap-4">
            <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <div className={`text-2xl font-black mt-1 ${color}`}>{value}</div>
                <p className="text-[12px] text-slate-500 mt-1 font-medium">{desc}</p>
            </div>
        </div>
    );
};

export default FinancialReports;
