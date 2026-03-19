import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Search, Plus, Building2 } from 'lucide-react';
import Modal from '../../components/Modal/Modal';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDepartment, setCurrentDepartment] = useState({ name: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await api.get('/departments');
            setDepartments(response.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching departments:', err);
            setError('Failed to load departments. Please try again later.');
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDepartments();
    }, [fetchDepartments]);

    const handleOpenModal = (dept = { name: '' }) => {
        setCurrentDepartment(dept);
        setIsEditing(!!dept.id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentDepartment({ name: '' });
        setIsEditing(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/departments/${currentDepartment.id}`, currentDepartment);
            } else {
                await api.post('/departments', currentDepartment);
            }
            fetchDepartments();
            handleCloseModal();
        } catch (err) {
            console.error('Error saving department:', err);
            alert('Failed to save department.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            try {
                await api.delete(`/departments/${id}`);
                fetchDepartments();
            } catch (err) {
                console.error('Error deleting department:', err);
                alert('Failed to delete department. It might be in use.');
            }
        }
    };

    const filteredDepartments = (departments || []).filter(dept => 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search departments..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    Add Department
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-8">
                    {error}
                </div>
            )}

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                <table className="management-table" style={{ minWidth: '400px' }}>
                        <thead>
                            <tr>
                                <th>Department Name</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                    <tbody>
                        {filteredDepartments.length > 0 ? filteredDepartments.map((dept) => (
                            <tr key={dept.id}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-800">{dept.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="table-actions">
                                        <button className="view-btn" onClick={() => handleOpenModal(dept)}>Edit</button>
                                        <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-300" onClick={() => handleDelete(dept.id)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="2" className="text-center py-20 text-slate-400 italic">
                                    {searchTerm ? 'No departments match your search.' : 'No departments found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={isEditing ? 'Edit Department' : 'Add New Department'}
                size="sm"
                customClasses="!w-[50%] !max-w-[600px]"
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Department Name</label>
                            <input 
                                type="text" 
                                value={currentDepartment.name}
                                onChange={(e) => setCurrentDepartment({...currentDepartment, name: e.target.value})}
                                placeholder="e.g. Front Office"
                                required 
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary !px-10" onClick={handleCloseModal}>Cancel</button>
                        <button type="submit" className="btn-primary !px-10">
                            {isEditing ? 'Update Department' : 'Create Department'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Departments;
