import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';

const InventoryCategories = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const { t } = useLanguage();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: ''
    });

    const fetchCategories = async () => {
        try {
            const res = await api.get('/inventory-categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
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
                name: category.name
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/inventory-categories/${editingCategory.id}`, formData);
            } else {
                await api.post('/inventory-categories', formData);
            }
            setShowModal(false);
            fetchCategories();
        } catch (err) {
            console.error('Failed to save category:', err);
            alert('Failed to save category.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await api.delete(`/inventory-categories/${id}`);
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
                <button className="btn-primary" onClick={() => handleOpenModal()}>{t('Add Category')}</button>
            </div>

            <div className="premium-card">
                <div className="overflow-x-auto w-full">
                    {loading ? (
                        <div className="text-center py-20 text-text-slate animate-pulse">{t('Loading categories...')}</div>
                    ) : (
                        <table className="management-table" style={{ minWidth: '400px' }}>
                            <thead>
                                <tr>
                                    <th>{t('Category Name')}</th>
                                    <th className="text-right">{t('Actions')}</th>
                                </tr>
                            </thead>
                        <tbody>
                            {paginatedCategories.length > 0 ? paginatedCategories.map((cat) => (
                                <tr key={cat.id}>
                                    <td className="font-bold text-text-dark">{cat.name}</td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(cat)}>{t('Edit')}</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-300 ml-2" onClick={() => handleDelete(cat.id)}>{t('Delete')}</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="2" className="text-center py-20 text-slate-400 italic">
                                        {t('No inventory categories found.')}
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
                title={editingCategory ? t('Edit Category') : t('Add New Category')}
                size="sm"
                customClasses="!w-[70%] !max-w-[500px]"
            >
                <form onSubmit={handleSubmit}>
                            <div className="form-grid !grid-cols-1">
                                <div className="form-group">
                                    <label>{t('Category Name')}</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder={t('e.g. Toiletries, Perishables')} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">{t('Cancel')}</button>
                                <button type="submit" className="btn-primary !px-10">{editingCategory ? t('Save Changes') : t('Save Category')}</button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default InventoryCategories;
