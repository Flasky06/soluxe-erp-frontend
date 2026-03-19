import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Calendar, Plus, Clock, CheckCircle, XCircle, FileText, Search, User } from 'lucide-react';
import Modal from '../../components/Modal/Modal';

const LeaveRequests = () => {
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

    return (
        <div className="flex flex-col gap-8">
            <div className="table-tools flex justify-between items-center">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-text-dark tracking-tight">Leave Requests</h2>
                    <p className="text-text-slate text-sm font-medium">Manage and track employee absence requests.</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Submit Request
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 premium-card">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Leave History</span>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow animate-pulse"></span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Real-time Updates</span>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto w-full">
                        <table className="management-table" style={{ minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Reason</th>
                                    {isManager && <th>Employee</th>}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={isManager ? 6 : 5} className="py-6"><div className="h-4 bg-slate-100 rounded"></div></td>
                                        </tr>
                                    ))
                                ) : requests.length > 0 ? (requests.map(req => (
                                    <tr key={req.id}>
                                        <td><span className="font-bold text-text-dark">{req.leaveTypeName || 'General Leave'}</span></td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[13px] text-slate-700">{req.dateFrom} → {req.dateTo}</span>
                                                <span className="text-[10px] font-bold text-slate-400">Total duration: 0 days</span>
                                            </div>
                                        </td>
                                        <td><span className={`status-badge ${getStatusBadge(req.status)}`}>{req.status}</span></td>
                                        <td className="max-w-[200px] truncate"><span className="text-text-slate italic">"{req.reason}"</span></td>
                                        {isManager && <td><span className="font-medium text-text-dark">Employee #{req.employeeId}</span></td>}
                                        <td>
                                            <div className="flex gap-2">
                                                {isManager && req.status === 'PENDING' ? (
                                                    <>
                                                        <button className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Approve" onClick={() => handleStatusUpdate(req.id, 'APPROVED')}><CheckCircle size={16} /></button>
                                                        <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Reject" onClick={() => handleStatusUpdate(req.id, 'REJECTED')}><XCircle size={16} /></button>
                                                    </>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-slate-300 uppercase">Processed</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))) : (
                                    <tr>
                                        <td colSpan={isManager ? 6 : 5} className="py-20 text-center text-text-slate italic">No leave requests found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="premium-card p-6 bg-linear-to-br from-slate-900 to-slate-800 text-white">
                        <h4 className="text-lg font-bold mb-4">Leave Policy</h4>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                <div className="p-3 bg-yellow rounded-xl text-maroon shadow-lg shadow-yellow/20"><Calendar size={20} /></div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-white/50 uppercase">Carry Forward</span>
                                    <span className="text-lg font-black italic">5 Days</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                <div className="p-3 bg-white/10 rounded-xl text-white"><FileText size={20} /></div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-white/50 uppercase">Notice Period</span>
                                    <span className="text-lg font-black italic">48 Hours</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="premium-card p-6 border-l-4 border-l-maroon">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Pending Approval</h4>
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
                title="New Leave Request"
                size="sm"
                customClasses="!w-[90%] !max-w-[500px]"
            >
                <form onSubmit={handleSubmit} className="p-4">
                            <div className="flex flex-col gap-6">
                                <div className="form-group">
                                    <label>Leave Category</label>
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
                                        <label>Start Date</label>
                                        <input type="date" required value={formData.dateFrom} onChange={(e) => setFormData({...formData, dateFrom: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="date" required value={formData.dateTo} onChange={(e) => setFormData({...formData, dateTo: e.target.value})} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Reason for Absence</label>
                                    <textarea 
                                        className="min-h-[100px]" 
                                        required 
                                        value={formData.reason} 
                                        onChange={(e) => setFormData({...formData, reason: e.target.value})} 
                                        placeholder="Briefly describe the reason for your leave..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer !px-0 mt-8">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-8">Discard</button>
                                <button type="submit" className="btn-primary !px-12">Submit Request</button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default LeaveRequests;
