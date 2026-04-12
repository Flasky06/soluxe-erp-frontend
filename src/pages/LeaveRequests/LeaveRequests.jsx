import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Calendar, Plus, Clock, CheckCircle, XCircle, FileText, Search, User } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';

const LeaveRequests = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const { t } = useLanguage();
    const { user } = useAuthStore();
    const [requests, setRequests] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        leaveTypeId: '',
        dateFrom: '',
        dateTo: '',
        reason: ''
    });

    const isManager = user?.roles?.some(role => ['ROLE_HOTEL_ADMIN', 'ROLE_MANAGER'].includes(role));

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [typesRes, requestsRes] = await Promise.all([
                api.get('/leave-types'),
                isManager ? api.get('/leave-requests') : api.get(`/leave-requests/employee/${user?.employeeId}`)
            ]);
            setLeaveTypes(typesRes.data);
            setRequests(requestsRes.data);
            if (typesRes.data.length > 0) {
                setFormData(prev => ({ ...prev, leaveTypeId: typesRes.data[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch leave data:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.employeeId, isManager]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/leave-requests', {
                ...formData,
                employeeId: user?.employeeId,
                status: 'PENDING'
            });
            setShowModal(false);
            setFormData({
                leaveTypeId: leaveTypes[0]?.id || '',
                dateFrom: '',
                dateTo: '',
                reason: ''
            });
            fetchData();
            alert('Leave request submitted successfully!');
        } catch (err) {
            console.error('Failed to submit leave request:', err);
            alert('Submission failed. Please try again.');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const request = requests.find(r => r.id === id);
            await api.put(`/leave-requests/${id}`, {
                ...request,
                status,
                approvedById: user?.id
            });
            fetchData();
            alert(`Request ${status.toLowerCase()}!`);
        } catch (err) {
            console.error('Failed to update leave status:', err);
            alert('Update failed.');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            default: return 'info';
        }
    };

    const totalPages = Math.ceil(requests.length / PAGE_SIZE);
    const paginatedRequests = requests.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    return (
        <div className="flex flex-col gap-8">
            <div className="table-tools flex justify-between items-center">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-text-dark tracking-tight">{t('Leave Requests')}</h2>
                    <p className="text-text-slate text-sm font-medium">{t('Manage and track employee absence requests.')}</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    {t('Submit Request')}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 premium-card">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('Leave History')}</span>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow animate-pulse"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{t('Real-time Updates')}</span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto w-full">
                        <table className="management-table" style={{ minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th>{t('Type')}</th>
                                    <th>{t('Duration')}</th>
                                    <th>{t('Status')}</th>
                                    <th>{t('Reason')}</th>
                                    {isManager && <th>{t('Employee')}</th>}
                                    <th>{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={isManager ? 6 : 5} className="py-6"><div className="h-4 bg-slate-100 rounded"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedRequests.length > 0 ? (paginatedRequests.map(req => (
                                    <tr key={req.id}>
                                        <td><span className="font-bold text-text-dark">{req.leaveTypeName || t('General Leave')}</span></td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[13px] text-slate-700">{req.dateFrom} → {req.dateTo}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{t('Total duration:')} 0 {t('days')}</span>
                                            </div>
                                        </td>
                                        <td><span className={`status-badge ${getStatusBadge(req.status)}`}>{req.status}</span></td>
                                        <td className="max-w-[200px] truncate"><span className="text-text-slate italic">"{req.reason}"</span></td>
                                        {isManager && <td><span className="font-medium text-text-dark">{t('Employee')} #{req.employeeId}</span></td>}
                                        <td>
                                            <div className="flex gap-2">
                                                {isManager && req.status === 'PENDING' ? (
                                                    <>
                                                        <button className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title={t("Approve")} onClick={() => handleStatusUpdate(req.id, 'APPROVED')}><CheckCircle size={16} /></button>
                                                        <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title={t("Reject")} onClick={() => handleStatusUpdate(req.id, 'REJECTED')}><XCircle size={16} /></button>
                                                    </>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-slate-300 uppercase">{t('Processed')}</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))) : (
                                    <tr>
                                        <td colSpan={isManager ? 6 : 5} className="py-20 text-center text-text-slate italic">{t('No leave requests found.')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {!loading && requests.length > 0 && (
                        <div className="p-4 border-t border-slate-100 bg-white">
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={requests.length}
                                pageSize={PAGE_SIZE}
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-6">
                    <div className="premium-card p-6 bg-linear-to-br from-slate-900 to-slate-800 text-white">
                        <h4 className="text-lg font-bold mb-4">{t('Leave Policy')}</h4>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                <div className="p-3 bg-yellow rounded-xl text-maroon shadow-lg shadow-yellow/20"><Calendar size={20} /></div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-white/50 uppercase">{t('Carry Forward')}</span>
                                    <span className="text-lg font-black italic">5 {t('Days')}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                <div className="p-3 bg-white/10 rounded-xl text-white"><FileText size={20} /></div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-white/50 uppercase">{t('Notice Period')}</span>
                                    <span className="text-lg font-black italic">48 {t('Hours')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-6 border-l-4 border-l-maroon">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{t('Pending Approval')}</h4>
                        <div className="flex items-center justify-between">
                            <span className="text-4xl font-black text-text-dark">{requests.filter(r => r.status === 'PENDING').length}</span>
                            <div className="p-4 bg-maroon/5 text-maroon rounded-2xl"><Clock size={24} /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={t('New Leave Request')}
                size="sm"
                customClasses="!w-[90%] !max-w-[500px]"
            >
                <form onSubmit={handleSubmit} className="p-4">
                            <div className="flex flex-col gap-6">
                                <div className="form-group">
                                    <label>{t('Leave Category')}</label>
                                    <select 
                                        required 
                                        value={formData.leaveTypeId} 
                                        onChange={(e) => setFormData({...formData, leaveTypeId: e.target.value})}
                                    >
                                        {leaveTypes.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label>{t('Start Date')}</label>
                                        <input type="date" required value={formData.dateFrom} onChange={(e) => setFormData({...formData, dateFrom: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('End Date')}</label>
                                        <input type="date" required value={formData.dateTo} onChange={(e) => setFormData({...formData, dateTo: e.target.value})} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t('Reason for Absence')}</label>
                                    <textarea 
                                        className="min-h-[100px]" 
                                        required 
                                        value={formData.reason} 
                                        onChange={(e) => setFormData({...formData, reason: e.target.value})} 
                                        placeholder={t('Briefly describe the reason for your leave...')}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer !px-0 mt-8">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-8">{t('Discard')}</button>
                                <button type="submit" className="btn-primary !px-12">{t('Submit Request')}</button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default LeaveRequests;
