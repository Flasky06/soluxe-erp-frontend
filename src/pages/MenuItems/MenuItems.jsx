import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const MenuItems = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'DRINK',
        available: true,
        prepTimeMins: 15
    });

    const fetchItems = async () => {
        try {
            const res = await api.get('/menu-items');
            setItems(res.data);
        } catch (err) {
            console.error('Failed to fetch menu items:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                description: item.description || '',
                price: item.price,
                category: item.category,
                available: item.available,
                prepTimeMins: item.prepTimeMins || 15
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                category: 'DRINK',
                available: true,
                prepTimeMins: 15
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`/menu-items/${editingItem.id}`, formData);
            } else {
                await api.post('/menu-items', formData);
            }
            setShowModal(false);
            fetchItems();
        } catch (err) {
            console.error('Failed to save menu item:', err);
            alert('Failed to save menu item.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this menu item?')) {
            try {
                await api.delete(`/menu-items/${id}`);
                fetchItems();
            } catch (err) {
                console.error('Failed to delete menu item:', err);
                alert('Failed to delete menu item.');
            }
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Menu Item Management</h1>
                    <p className="text-text-slate text-base">Configure and manage restaurant and bar menu items.</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Menu Item</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading menu...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Prep Time</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-text-dark">{item.name}</span>
                                            <span className="text-[12px] text-text-slate line-clamp-1">{item.description}</span>
                                        </div>
                                    </td>
                                    <td><span className="status-badge info">{item.category}</span></td>
                                    <td>{item.prepTimeMins} Min</td>
                                    <td className="font-bold text-primary">KSh {parseFloat(item.price).toLocaleString()}</td>
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
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[80%] !max-w-[900px]">
                        <div className="modal-header">
                            <div>
                                <h2 className="text-xl font-bold text-primary">{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                                <p className="text-sm text-text-slate mt-0.5">Configure item pricing and availability details.</p>
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Item Name</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Grilled Salmon" />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                        <option value="DRINK">Drink</option>
                                        <option value="FOOD">Food</option>
                                        <option value="DESSERT">Dessert</option>
                                        <option value="SNACK">Snack</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Price (KSh)</label>
                                    <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Prep Time (Minutes)</label>
                                    <input type="number" required value={formData.prepTimeMins} onChange={(e) => setFormData({...formData, prepTimeMins: parseInt(e.target.value)})} />
                                </div>
                                <div className="flex items-center gap-2.5 mt-6">
                                    <input type="checkbox" id="available" checked={formData.available} onChange={(e) => setFormData({...formData, available: e.target.checked})} className="w-4 h-4" />
                                    <label htmlFor="available" className="mb-0">Item available for orders</label>
                                </div>
                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Public description shown on the menu..." rows="3" className="min-h-[100px]" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">{editingItem ? 'Save Changes' : 'Save Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuItems;
