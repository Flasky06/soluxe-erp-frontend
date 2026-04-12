import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';

const MenuCategories = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const { t } = useLanguage();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
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
                sortOrder: category.sortOrder || 0,
                isActive: (category.isActive ?? category.active) !== undefined ? (category.isActive ?? category.active) : true
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
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

    const totalPages = Math.ceil(categories.length / PAGE_SIZE);
    const paginatedCategories = categories.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    return (
        <div className="flex flex-col">
            <div className="flex justify-end items-center mb-8">
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Category</button>
            </div>

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                    {loading ? (
                        <div className="text-center py-20 text-text-slate animate-pulse">Loading categories...</div>
                    ) : (
                        <table className="management-table" style={{ minWidth: '500px' }}>
                            <thead>
                                <tr>
                                    <th>{t('Category Name')}</th>
                                    <th>{t('Sort Order')}</th>
                                    <th>{t('Status')}</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                        <tbody>
                            {paginatedCategories.length > 0 ? paginatedCategories.map((cat) => (
                                <tr key={cat.id}>
                                    <td className="font-bold text-text-dark">{cat.name}</td>
                                    <td>{cat.sortOrder}</td>
                                    <td>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${(cat.isActive ?? cat.active) ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {(cat.isActive ?? cat.active) ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(cat)}>Edit</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-300 ml-2" onClick={() => handleDelete(cat.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-20 text-slate-400 italic">
                                        No categories found. Click 'Add Category' to start.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            {!loading && categories.length > 0 && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={categories.length}
                    pageSize={PAGE_SIZE}
                />
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCategory ? 'Edit Category' : 'Add New Category'}
                size="md"
                customClasses="!w-[70%] !max-w-[500px]"
            >
                <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>{t('Category Name')}</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Appetizers, Main Course, House Wines" />
                                </div>
                                <div className="form-group">
                                    <label>{t('Sort Order')}</label>
                                    <input type="number" value={formData.sortOrder} onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value)})} />
                                </div>
                                <div className="flex items-center gap-2.5 mt-6">
                                    <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4" />
                                    <label htmlFor="isActive" className="mb-0">Active / Visible on Menu</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">{editingCategory ? 'Save Changes' : 'Create Category'}</button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default MenuCategories;
