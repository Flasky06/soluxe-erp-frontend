import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const MenuCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sortOrder: 0,
        isActive: true
    });

    const fetchCategories = async () => {
        try {
            const res = await api.get('/menu-categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Failed to fetch menu categories:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                sortOrder: category.sortOrder || 0,
                isActive: category.isActive !== undefined ? category.isActive : true
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                sortOrder: categories.length,
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/menu-categories/${editingCategory.id}`, formData);
            } else {
                await api.post('/menu-categories', formData);
            }
            setShowModal(false);
            fetchCategories();
        } catch (err) {
            console.error('Failed to save menu category:', err);
            alert('Failed to save menu category.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category? All items in this category will be uncategorized.')) {
            try {
                await api.delete(`/menu-categories/${id}`);
                fetchCategories();
            } catch (err) {
                console.error('Failed to delete category:', err);
                alert('Failed to delete category.');
            }
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Menu Categories</h1>
                    <p className="text-text-slate text-base">Organize your restaurant menu into sections like Starters, Mains, Drinks.</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Category</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading categories...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th>Description</th>
                                <th>Sort Order</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id}>
                                    <td className="font-bold text-text-dark">{cat.name}</td>
                                    <td className="text-text-slate text-sm italic">{cat.description || 'No description'}</td>
                                    <td>{cat.sortOrder}</td>
                                    <td>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cat.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {cat.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(cat)}>Edit</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-300 ml-2" onClick={() => handleDelete(cat.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[70%] !max-w-[700px]">
                        <div className="modal-header">
                            <div>
                                <h2 className="text-xl font-bold text-primary">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                                <p className="text-sm text-text-slate mt-0.5">Define menu sections for the POS and Kitchen.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Category Name</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Appetizers, Main Course, House Wines" />
                                </div>
                                <div className="form-group">
                                    <label>Sort Order</label>
                                    <input type="number" value={formData.sortOrder} onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value)})} />
                                </div>
                                <div className="flex items-center gap-2.5 mt-6">
                                    <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4" />
                                    <label htmlFor="isActive" className="mb-0">Active / Visible on Menu</label>
                                </div>
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Internal notes or public description..." rows="3" className="min-h-[100px]" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">{editingCategory ? 'Save Changes' : 'Create Category'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuCategories;
