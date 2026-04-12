import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus, Calendar } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';

const LeaveTypes = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const { t } = useLanguage();
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLeaveTypes = async () => {
        try {
            const response = await api.get('/leave-types');
            setLeaveTypes(response.data);
        } catch (err) {
            console.error('Failed to fetch leave types:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const handleOpenModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({
                name: type.name
            });
        } else {
            setEditingType(null);
            setFormData({ name: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await api.put(`/leave-types/${editingType.id}`, formData);
            } else {
                await api.post('/leave-types', formData);
            }
            setShowModal(false);
            fetchLeaveTypes();
        } catch (err) {
            console.error('Failed to save leave type:', err);
            alert('Failed to save leave type.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this leave type?')) {
            try {
                await api.delete(`/leave-types/${id}`);
                fetchLeaveTypes();
            } catch (err) {
                console.error('Failed to delete leave type:', err);
                alert('Failed to delete leave type. It might be assigned to some requests.');
            }
        }
    };

    const filteredTypes = leaveTypes.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredTypes.length / PAGE_SIZE);
    const paginatedTypes = filteredTypes.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder={t('Search leave types...')} 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>{t('Add Leave Type')}</button>
            </div>

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse font-medium">{t('Syncing HR records...')}</div>
                ) : (
                    <table className="management-table" style={{ minWidth: '400px' }}>
                        <thead>
                            <tr>
                                <th>{t('Policy Name')}</th>
                                <th className="text-right">{t('Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTypes.length > 0 ? paginatedTypes.map((t) => (
                                <tr key={t.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-800">{t.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(t)}>{t('Edit')}</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all" onClick={() => handleDelete(t.id)}>{t('Delete')}</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="2" className="text-center py-20 text-slate-400 italic font-medium">
                                        {searchTerm ? t('No leave policies match your search.') : t('No leave types registered.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            {!loading && filteredTypes.length > 0 && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredTypes.length}
                    pageSize={PAGE_SIZE}
                />
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingType ? t('Edit Leave Type') : t('Create HR Policy')}
                size="sm"
            >
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-6 p-7">
                        <div className="form-group">
                            <label>{t('Policy Name')}</label>
                            <input 
                                type="text" 
                                required 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                placeholder={t('e.g. Annual Leave, Sick Leave')}
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">{t('Cancel')}</button>
                        <button type="submit" className="btn-primary !px-10">{t('Save Policy')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default LeaveTypes;
