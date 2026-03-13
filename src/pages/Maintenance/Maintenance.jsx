import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const Maintenance = () => {
    const { user, hasRole } = useAuthStore();
    const [tickets, setTickets] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [issueTypes, setIssueTypes] = useState([]);
    const [formData, setFormData] = useState({
        roomId: '',
        issueTypeId: '',
        priority: 'MEDIUM',
        description: ''
    });

    const [showResolveModal, setShowResolveModal] = useState(false);
    const [resolveData, setResolveData] = useState({
        ticketId: null,
        notes: ''
    });

    const isMaintenanceStaff = hasRole('ROLE_MAINTENANCE') || hasRole('ROLE_HOTEL_ADMIN') || hasRole('ROLE_MANAGER');

    const fetchAllData = async () => {
        setLoading(true);
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
            if (issueTypesRes.data.length > 0) {
                setFormData(prev => ({ ...prev, issueTypeId: issueTypesRes.data[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch maintenance data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

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

    return (
        <div className="flex flex-col">
            <div className="flex justify-end items-center mb-8">
                <button className="btn-primary" onClick={() => setShowModal(true)}>+ Report Issue</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading maintenance tickets...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Location / ID</th>
                                <th>Issue Details</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.length > 0 ? (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} className={ticket.status === 'RESOLVED' ? 'opacity-60' : ''}>
                                        <td>
                                            <div className="font-bold text-text-dark">{getRoomNumber(ticket.roomId)}</div>
                                            <div className="text-xs text-text-slate">TK-{ticket.id} • {new Date(ticket.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="max-w-[300px]">
                                            <div className="font-bold text-[13px]">{ticket.issueTypeName}</div>
                                            <div className="text-[12px] text-text-slate truncate" title={ticket.description}>{ticket.description}</div>
                                        </td>
                                        <td>{getPriorityBadge(ticket.priority)}</td>
                                        <td>{getStatusBadge(ticket.status)}</td>
                                        <td>
                                            <span className="text-[13px] font-medium">{getUserName(ticket.assignedTo)}</span>
                                            <div className="text-[10px] text-text-slate">Reported by: {getUserName(ticket.reportedBy)}</div>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                {ticket.status === 'OPEN' && isMaintenanceStaff && (
                                                    <button onClick={() => handleAssignToMe(ticket.id)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-bold transition-all">
                                                        Assign to Me
                                                    </button>
                                                )}
                                                {ticket.status === 'IN_PROGRESS' && ticket.assignedTo === user.id && (
                                                    <button onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')} className="bg-green-50 text-green-600 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-bold transition-all">
                                                        Resolve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 text-text-slate italic">No maintenance tickets found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[90%] !max-w-[600px]">
                        <div className="modal-header">
                            <h2>Report Maintenance Issue</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
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
                                <label>Issue Type</label>
                                <select required value={formData.issueTypeId} onChange={e => setFormData({...formData, issueTypeId: e.target.value})}>
                                    {issueTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Priority</label>
                                <select required value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent (Blocks check-in)</option>
                                </select>
                            </div>

                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea required rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the issue in detail..." />
                            </div>

                            <div className="modal-footer col-span-full">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Submit Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showResolveModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[90%] !max-w-[500px]">
                        <div className="modal-header">
                            <h2>Resolve Ticket</h2>
                            <button className="close-modal-btn" onClick={() => setShowResolveModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={submitResolve} className="form-grid">
                            <div className="form-group full-width">
                                <label>Resolution Notes</label>
                                <textarea required rows="4" value={resolveData.notes} onChange={e => setResolveData({...resolveData, notes: e.target.value})} placeholder="What was done to fix the issue?" />
                            </div>
                            <div className="modal-footer col-span-full">
                                <button type="button" onClick={() => setShowResolveModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors">Mark as Resolved</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Maintenance;
