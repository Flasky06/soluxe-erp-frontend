import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal/Modal';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Pagination/Pagination';

const MenuItems = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        categoryId: '',
        available: true,
        prepTimeMins: 15
    });
    const [serverErrors, setServerErrors] = useState({});

    // Quick Category Add
    const [showQuickCatModal, setShowQuickCatModal] = useState(false);
    const [quickCatData, setQuickCatData] = useState({ name: '' });
    const [quickCatLoading, setQuickCatLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [itemsRes, catsRes] = await Promise.all([
                api.get('/menu-items'),
                api.get('/menu-categories')
            ]);
            setItems(itemsRes.data);
            setCategories(catsRes.data);
            if (catsRes.data.length > 0 && !formData.categoryId) {
                setFormData(prev => ({ ...prev, categoryId: catsRes.data[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch menu data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleQuickAddCategory = async (e) => {
        e.preventDefault();
        if (!quickCatData.name) return;
        setQuickCatLoading(true);
        try {
            const res = await api.post('/menu-categories', quickCatData);
            // Refresh categories
            const catsRes = await api.get('/menu-categories');
            setCategories(catsRes.data);
            // Select the new category
            setFormData(prev => ({ ...prev, categoryId: res.data.id }));
            setShowQuickCatModal(false);
            setQuickCatData({ name: '' });
        } catch (err) {
            console.error('Failed to quick add category:', err);
            alert('Failed to add category.');
        } finally {
            setQuickCatLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                price: item.price,
                categoryId: item.categoryId || (categories.length > 0 ? categories[0].id : ''),
                available: item.available,
                prepTimeMins: item.prepTimeMins || 15
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                price: '',
                categoryId: categories.length > 0 ? categories[0].id : '',
                available: true,
                prepTimeMins: 15
            });
        }
        setServerErrors({});
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerErrors({});
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price) || 0,
                prepTimeMins: parseInt(formData.prepTimeMins) || 15,
                categoryId: parseInt(formData.categoryId)
            };
            if (editingItem) {
                await api.put(`/menu-items/${editingItem.id}`, payload);
            } else {
                await api.post('/menu-items', payload);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save menu item:', err);
            if (err.response && (err.response.status === 400 || err.response.status === 409)) {
                setServerErrors(err.response.data);
            } else {
                alert('Failed to save menu item. Please try again.');
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this menu item?')) {
            try {
                await api.delete(`/menu-items/${id}`);
                fetchData();
            } catch (err) {
                console.error('Failed to delete menu item:', err);
                alert('Failed to delete menu item.');
            }
        }
    };

    const totalPages = Math.ceil(items.length / PAGE_SIZE);
    const paginatedItems = items.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    return (
        <div className="flex flex-col">
            <div className="flex justify-end items-center gap-4 mb-8">
                <button 
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors" 
                    onClick={() => setShowQuickCatModal(true)}
                >
                    Manage Categories
                </button>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Menu Item</button>
            </div>

            <div className="table-card">
                <div className="overflow-x-auto w-full">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading menu...</div>
                ) : (
                    <table className="management-table" style={{ minWidth: '800px' }}>
                        <thead>
                            <tr>
                                <th>{t('Item Name')}</th>
                                <th>{t('Category')}</th>
                                <th>{t('Prep Time')}</th>
                                <th>{t('Price')}</th>
                                <th>{t('Status')}</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedItems.length > 0 ? paginatedItems.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-text-dark">{item.name}</span>
                                        </div>
                                    </td>
                                    <td><span className="status-badge info">{categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized'}</span></td>
                                    <td>{item.prepTimeMins} Min</td>
                                    <td className="font-bold text-primary">$ {parseFloat(item.price || 0).toLocaleString()}</td>
                                    <td>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${item.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {item.available ? 'Available' : 'Out of Stock'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(item)}>Edit</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-300 ml-2" onClick={() => handleDelete(item.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-20 text-slate-400 italic">
                                        No menu items found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            {!loading && items.length > 0 && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={items.length}
                    pageSize={PAGE_SIZE}
                />
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                size="md"
                customClasses="!w-[80%] !max-w-[900px]"
            >
                {serverErrors.error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                        {serverErrors.error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>{t('Item Name')}</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Grilled Salmon" />
                                    {serverErrors.name && <p className="text-red-500 text-[10px] mt-1">{serverErrors.name}</p>}
                                </div>
                                <div className="form-group">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="mb-0">Category</label>
                                    </div>
                                    <select required value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})}>
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    {serverErrors.categoryId && <p className="text-red-500 text-[10px] mt-1">{serverErrors.categoryId}</p>}
                                </div>
                                <div className="form-group">
                                    <label>{t('Price ($)')}</label>
                                    <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                                    {serverErrors.price && <p className="text-red-500 text-[10px] mt-1">{serverErrors.price}</p>}
                                </div>
                                <div className="form-group">
                                    <label>{t('Prep Time (Minutes)')}</label>
                                    <input type="number" required value={formData.prepTimeMins} onChange={(e) => setFormData({...formData, prepTimeMins: parseInt(e.target.value)})} />
                                    {serverErrors.prepTimeMins && <p className="text-red-500 text-[10px] mt-1">{serverErrors.prepTimeMins}</p>}
                                </div>
                                <div className="flex items-center gap-2.5 mt-6">
                                    <input type="checkbox" id="available" checked={formData.available} onChange={(e) => setFormData({...formData, available: e.target.checked})} className="w-4 h-4" />
                                    <label htmlFor="available" className="mb-0">Item available for orders</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">{editingItem ? 'Save Changes' : 'Save Item'}</button>
                            </div>
                        </form>
            </Modal>

            {/* Quick Category Modal */}
            <Modal
                isOpen={showQuickCatModal}
                onClose={() => setShowQuickCatModal(false)}
                title="Quick Add Category"
                size="sm"
                customClasses="!w-[90%] !max-w-[500px]"
                overlayClasses="z-[1000]"
            >
                <form onSubmit={handleQuickAddCategory} className="p-4">
                            <div className="form-group full-width">
                                <label>{t('Category Name')}</label>
                                <input 
                                    type="text" 
                                    required 
                                    autoFocus
                                    value={quickCatData.name} 
                                    onChange={(e) => setQuickCatData({...quickCatData, name: e.target.value})} 
                                    placeholder="e.g. Desserts" 
                                />
                            </div>
                            <div className="modal-footer !px-0 mt-6">
                                <button type="button" onClick={() => setShowQuickCatModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary" disabled={quickCatLoading}>
                                    {quickCatLoading ? 'Adding...' : 'Add Category'}
                                </button>
                            </div>
                        </form>
            </Modal>
        </div>
    );
};

export default MenuItems;
