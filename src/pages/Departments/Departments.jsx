import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Departments.css';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDepartment, setCurrentDepartment] = useState({ name: '', description: '' });
    const [isEditing, setIsEditing] = useState(false);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/departments');
            setDepartments(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching departments:', err);
            setError('Failed to load departments. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleOpenModal = (dept = { name: '', description: '' }) => {
        setCurrentDepartment(dept);
        setIsEditing(!!dept.id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentDepartment({ name: '', description: '' });
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

    if (loading && departments.length === 0) {
        return <div className="loading-state">Loading departments...</div>;
    }

    return (
        <div className="departments-page">
            <header className="page-header">
                <div>
                    <h1>Department Management</h1>
                    <p>Configure and manage hotel departments</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <span className="icon">➕</span> Add Department
                </button>
            </header>

            {error && <div className="error-banner">{error}</div>}

            <div className="premium-card table-container">
                <table className="management-table">
                    <thead>
                        <tr>
                            <th>Department Name</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.map((dept) => (
                            <tr key={dept.id}>
                                <td>
                                    <span className="bold">{dept.name}</span>
                                </td>
                                <td>{dept.description}</td>
                                <td>
                                    <div className="table-actions">
                                        <button className="view-btn" onClick={() => handleOpenModal(dept)}>Edit</button>
                                        <button className="delete-btn-text" onClick={() => handleDelete(dept.id)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card modal-md department-modal">
                        <div className="modal-header">
                            <h2>{isEditing ? 'Edit Department' : 'Add New Department'}</h2>
                            <button className="close-modal-btn" onClick={handleCloseModal}>&times;</button>
                        </div>
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
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea 
                                        value={currentDepartment.description}
                                        onChange={(e) => setCurrentDepartment({...currentDepartment, description: e.target.value})}
                                        placeholder="Briefly describe the department's responsibilities"
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className="btn-primary">
                                    {isEditing ? 'Update Department' : 'Create Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Departments;
