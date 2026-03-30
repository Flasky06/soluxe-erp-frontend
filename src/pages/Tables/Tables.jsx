import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';

const Tables = () => {
    const { t } = useLanguage();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [formData, setFormData] = useState({
        tableName: '',
        capacity: 2,
        location: 'MAIN_HALL',
        isVip: false,
        notes: '',
        status: 'AVAILABLE'
    });

    const fetchTables = async () => {
        setLoading(true);
        try {
            const res = await api.get('/restaurant-tables');
            setTables(res.data);
        } catch (err) {
            console.error('Failed to fetch tables:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    const handleOpenModal = (table = null) => {
        if (table) {
            setEditingTable(table);
            setFormData({
                tableName: table.tableName,
                capacity: table.capacity,
                location: table.location,
                isVip: table.isVip ?? table.vip,
                notes: table.notes || '',
                status: table.status
            });
        } else {
            setEditingTable(null);
            setFormData({
                tableName: '',
                capacity: 2,
                location: 'MAIN_HALL',
                isVip: false,
                notes: '',
                status: 'AVAILABLE'
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                capacity: parseInt(formData.capacity) || 1
            };
            if (editingTable) {
                await api.put(`/restaurant-tables/${editingTable.id}`, payload);
            } else {
                await api.post('/restaurant-tables', payload);
            }
            setShowModal(false);
            fetchTables();
        } catch (err) {
            console.error('Failed to save table:', err);
            alert('Failed to save table.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this table?')) {
            try {
                await api.delete(`/restaurant-tables/${id}`);
                fetchTables();
            } catch (err) {
                console.error('Failed to delete table:', err);
                alert('Failed to delete table.');
            }
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Restaurant Table Management</h1>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add New Table</button>
            </div>

            <div className="table-card">
                <div className="overflow-x-auto w-full">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading tables...</div>
                ) : (
                    <table className="management-table" style={{ minWidth: '800px' }}>
                        <thead>
                            <tr>
                                <th>{t('Table Name')}</th>
                                <th>{t('Capacity')}</th>
                                <th>{t('Location')}</th>
                                <th>{t('Type')}</th>
                                <th>{t('Status')}</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tables.length > 0 ? (
                                tables.map((table) => (
                                    <tr key={table.id}>
                                        <td className="font-bold text-text-dark">{table.tableName}</td>
                                        <td>{table.capacity} Pax</td>
                                        <td>{table.location.replace('_', ' ')}</td>
                                        <td>
                                            {(table.isVip ?? table.vip) ? (
                                                <span className="text-amber-600 font-bold text-[10px] uppercase tracking-wider">VIP Table</span>
                                            ) : (
                                                <span className="text-text-slate text-[10px] uppercase tracking-wider">Standard</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                                table.status === 'AVAILABLE' ? 'bg-green-50 text-green-600' : 
                                                table.status === 'OCCUPIED' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                                {table.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="view-btn" onClick={() => handleOpenModal(table)}>Edit</button>
                                                <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-300" onClick={() => handleDelete(table.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 text-text-slate italic">No tables found. Add your first table to get started.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingTable ? 'Edit Table' : 'Add New Table'}
                size="lg"
                customClasses="!w-[80%] !max-w-[1000px]"
            >
                <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>{t('Table Name / Number')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.tableName}
                                        onChange={(e) => setFormData({...formData, tableName: e.target.value})}
                                        placeholder="e.g. Table 12 or Window Corner"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('Capacity (Pax)')}</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 1})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('Location')}</label>
                                    <select
                                        value={formData.location}
                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    >
                                        <option value="MAIN_HALL">Main Hall</option>
                                        <option value="PRIVATE_ROOM">Private Room</option>
                                        <option value="GARDEN">Garden</option>
                                        <option value="BAR">Bar</option>
                                        <option value="TAKEAWAY">Takeaway</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>{t('Current Status')}</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="AVAILABLE">Available</option>
                                        <option value="OCCUPIED">Occupied</option>
                                        <option value="RESERVED">Reserved</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2.5 mt-6">
                                    <input
                                        type="checkbox"
                                        id="isVip"
                                        checked={formData.isVip}
                                        onChange={(e) => setFormData({...formData, isVip: e.target.checked})}
                                        className="w-4 h-4"
                                    />
                                    <label htmlFor="isVip" className="mb-0">VIP Table</label>
                                </div>
                                <div className="form-group full-width">
                                    <label>{t('Internal Service Notes')}</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                        placeholder="Special setup requirements, preferred server, or location-specific notes..."
                                        rows="3"
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">
                                    {editingTable ? 'Save Changes' : 'Save Table'}
                                </button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default Tables;
