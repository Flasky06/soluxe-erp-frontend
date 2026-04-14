import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Plus } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';
import { formatDate } from '../../services/formatters';

const Maintenance = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const { user, hasRole } = useAuthStore();
    const { t } = useLanguage();
    const [tickets, setTickets] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showIssueTypeModal, setShowIssueTypeModal] = useState(false);
    const [issueTypes, setIssueTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        roomId: '',
        issueTypeId: '',
        priority: 'MEDIUM',
        description: ''
    });

    const [issueTypeFormData, setIssueTypeFormData] = useState({
        name: '',
        description: ''
    });

    const [showResolveModal, setShowResolveModal] = useState(false);
    const [resolveData, setResolveData] = useState({
        ticketId: null,
        notes: ''
    });

    const isMaintenanceStaff = hasRole('ROLE_MAINTENANCE') || hasRole('ROLE_HOTEL_ADMIN') || hasRole('ROLE_MANAGER');

    const fetchAllData = useCallback(async () => {
        try {
            const [ticketsRes, roomsRes, usersRes, issueTypesRes] = await Promise.all([
                api.get('/maintenance'),
                api.get('/rooms'),
                api.get('/users'),
                api.get('/maintenance-issue-types')
            ]);
            setTickets(ticketsRes.data);
            setRooms(roomsRes.data);
            setUsers(usersRes.data);
            setIssueTypes(issueTypesRes.data);
            
            // Auto-select first issue type if none selected
            if (issueTypesRes.data.length > 0) {
                setFormData(prev => {
                    if (!prev.issueTypeId) {
                        return { ...prev, issueTypeId: issueTypesRes.data[0].id };
                    }
                    return prev;
                });
            }
        } catch (err) {
            console.error('Failed to fetch maintenance data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchIssueTypes = useCallback(async () => {
        try {
            const res = await api.get('/maintenance-issue-types');
            setIssueTypes(res.data);
        } catch (err) {
            console.error('Failed to fetch issue types:', err);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                roomId: formData.roomId ? parseInt(formData.roomId) : null,
                issueTypeId: parseInt(formData.issueTypeId) || 0,
                priority: formData.priority,
                description: formData.description
            };
            await api.post(`/maintenance?userId=${user.id}`, payload);
            setShowModal(false);
            setFormData({ roomId: '', issueTypeId: issueTypes[0]?.id || '', priority: 'MEDIUM', description: '' });
            fetchAllData();
        } catch (err) {
            console.error('Failed to create ticket', err);
            alert('Failed to create ticket. Please try again.');
        }
    };

    const handleCreateIssueType = async (e) => {
        e.preventDefault();
        try {
            await api.post('/maintenance-issue-types', issueTypeFormData);
            setShowIssueTypeModal(false);
            setIssueTypeFormData({ name: '', description: '' });
            fetchIssueTypes(); // Refresh the list
        } catch (err) {
            console.error('Failed to create issue type', err);
            alert('Failed to create issue type. Please try again.');
        }
    };

    const handleAssignToMe = async (ticketId) => {
        try {
            await api.put(`/maintenance/${ticketId}/assign?assigneeId=${user.id}`);
            fetchAllData();
        } catch (err) {
            console.error('Failed to assign ticket', err);
        }
    };

    const handleUpdateStatus = async (ticketId, status) => {
        if (status === 'RESOLVED') {
            setResolveData({ ticketId, notes: '' });
            setShowResolveModal(true);
            return;
        }
        
        try {
            await api.put(`/maintenance/${ticketId}/status?status=${status}`);
            fetchAllData();
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const submitResolve = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/maintenance/${resolveData.ticketId}/status?status=RESOLVED&notes=${encodeURIComponent(resolveData.notes)}`);
            setShowResolveModal(false);
            fetchAllData();
        } catch (err) {
            console.error('Failed to resolve ticket', err);
        }
    };

    const getUserName = (id) => {
        if (!id) return 'Unassigned';
        const u = users.find(u => u.id === id);
        return u ? u.username : `User ${id}`;
    };

    const getRoomNumber = (id) => {
        if (!id) return 'General Area';
        const r = rooms.find(r => r.id === id);
        return r ? `Room ${r.roomNumber}` : `Room ${id}`;
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            LOW: 'bg-slate-100 text-slate-700',
            MEDIUM: 'bg-blue-100 text-blue-700',
            HIGH: 'bg-orange-100 text-orange-700',
            URGENT: 'bg-red-100 text-red-700 animate-pulse'
        };
        return <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${colors[priority] || colors.MEDIUM}`}>{priority}</span>;
    };

    const getStatusBadge = (status) => {
        const colors = {
            OPEN: 'bg-yellow text-black',
            IN_PROGRESS: 'bg-blue-500 text-white',
            RESOLVED: 'bg-green-500 text-white',
            CANCELLED: 'bg-slate-300 text-slate-700'
        };
        return <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${colors[status] || 'bg-gray-200'}`}>{status.replace('_', ' ')}</span>;
    };

    const totalPages = Math.ceil(tickets.length / PAGE_SIZE);
    const paginatedTickets = tickets.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    return (
        <div className="flex flex-col">
            <div className="flex justify-end items-center gap-4 mb-8">
                {hasRole('ROLE_HOTEL_ADMIN') && (
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors" onClick={() => setShowIssueTypeModal(true)}>
                        Configure Categories
                    </button>
                )}
                <button className="btn-primary" onClick={() => setShowModal(true)}>+ {t('Report Issue')}</button>
            </div>

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                    <table className="management-table" style={{ minWidth: '800px' }}>
                        <thead>
                            <tr>
                                <th>{t('Location / ID')}</th>
                                <th>{t('Issue Details')}</th>
                                <th>{t('Priority')}</th>
                                <th>{t('Status')}</th>
                                <th>{t('Assigned To')}</th>
                                <th className="text-right">{t('Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTickets.length > 0 ? (
                                paginatedTickets.map(ticket => (
                                    <tr key={ticket.id} className={ticket.status === 'RESOLVED' ? 'opacity-60' : ''}>
                                        <td>
                                            <div className="font-bold text-text-dark">{getRoomNumber(ticket.roomId)}</div>
                                            <div className="text-xs text-text-slate">TK-{ticket.id} • {formatDate(ticket.createdAt)}</div>
                                        </td>
                                        <td>
                                            <div className="font-bold text-[13px]">{ticket.issueTypeName}</div>
                                            <div className="text-[12px] text-text-slate truncate max-w-[250px]" title={ticket.description}>{ticket.description}</div>
                                        </td>
                                        <td>{getPriorityBadge(ticket.priority)}</td>
                                        <td>{getStatusBadge(ticket.status)}</td>
                                        <td>
                                            <span className="text-[13px] font-medium">{getUserName(ticket.assignedTo)}</span>
                                            <div className="text-[10px] text-text-slate">{t('Reported by')}: {getUserName(ticket.reportedBy)}</div>
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2 pr-2">
                                                {ticket.status === 'OPEN' && isMaintenanceStaff && (
                                                    <button onClick={() => handleAssignToMe(ticket.id)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-bold transition-all">
                                                        {t('Assign to Me')}
                                                    </button>
                                                )}
                                                {ticket.status === 'IN_PROGRESS' && ticket.assignedTo === user.id && (
                                                    <button onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')} className="bg-green-50 text-green-600 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-bold transition-all">
                                                        {t('Resolve')}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 text-text-slate italic">{t('No maintenance requests found.')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {!loading && tickets.length > 0 && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={tickets.length}
                    pageSize={PAGE_SIZE}
                />
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Report Maintenance Issue"
                size="md"
                customClasses="!w-[90%] !max-w-[600px]"
            >
                <form onSubmit={handleCreateTicket} className="form-grid">
                            <div className="form-group full-width">
                                <label>Location</label>
                                <select value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})}>
                                    <option value="">General Area (No Specific Room)</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>Room {r.roomNumber} - Floor {r.floor}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t('Issue Type')}</label>
                                <div className="flex gap-2">
                                    <select className="flex-1" required value={formData.issueTypeId} onChange={e => setFormData({...formData, issueTypeId: e.target.value})}>
                                        {issueTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button"
                                        className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-colors"
                                        onClick={() => setShowIssueTypeModal(true)}
                                        title="Add New Category"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{t('Priority')}</label>
                                <select required value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent (Blocks check-in)</option>
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label>{t('Description')}</label>
                                <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the issue in detail..." />
                            </div>

                            <div className="modal-footer col-span-full">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">{t('Cancel')}</button>
                                <button type="submit" className="btn-primary">{t('Submit')}</button>
                            </div>
                        </form>
            </Modal>

            <Modal
                isOpen={showIssueTypeModal}
                onClose={() => setShowIssueTypeModal(false)}
                title="Add Issue Category"
                size="sm"
                customClasses="!w-[90%] !max-w-[500px]"
                overlayClasses="z-[1001]"
            >
                <form onSubmit={handleCreateIssueType} className="form-grid">
                            <div className="form-group full-width">
                                <label>{t('Category Name')}</label>
                                <input type="text" required value={issueTypeFormData.name} onChange={e => setIssueTypeFormData({...issueTypeFormData, name: e.target.value})} placeholder="e.g. Electrical, Plumbing" />
                            </div>
                            <div className="form-group full-width">
                                <label>Short Description</label>
                                <textarea required value={issueTypeFormData.description} onChange={e => setIssueTypeFormData({...issueTypeFormData, description: e.target.value})} placeholder="What kind of issues fall under this category?" />
                            </div>
                            <div className="modal-footer col-span-full">
                                <button type="button" onClick={() => setShowIssueTypeModal(false)} className="btn-secondary">{t('Cancel')}</button>
                                <button type="submit" className="btn-primary">{t('Create')}</button>
                            </div>
                        </form>
            </Modal>

            <Modal
                isOpen={showResolveModal}
                onClose={() => setShowResolveModal(false)}
                title="Resolve Ticket"
                size="sm"
                customClasses="!w-[90%] !max-w-[500px]"
            >
                <form onSubmit={submitResolve} className="form-grid">
                            <div className="form-group full-width">
                                <label>Resolution Notes</label>
                                <textarea required rows="4" value={resolveData.notes} onChange={e => setResolveData({...resolveData, notes: e.target.value})} placeholder="What was done to fix the issue?" />
                            </div>
                            <div className="modal-footer col-span-full">
                                <button type="button" onClick={() => setShowResolveModal(false)} className="btn-secondary">{t('Cancel')}</button>
                                <button type="submit" className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors">{t('Resolved')}</button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default Maintenance;
