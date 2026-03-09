import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        currentStock: 0,
        unit: 'PIECES',
        unitCost: 0
    });

    const fetchData = async () => {
        try {
            const [itemsRes, catsRes] = await Promise.all([
                api.get('/inventory-items'),
                api.get('/inventory-categories')
            ]);
            setItems(itemsRes.data);
            setCategories(catsRes.data);
        } catch (err) {
            console.error('Failed to fetch inventory data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name || '',
                categoryId: item.categoryId || '',
                currentStock: item.currentStock || 0,
                minimumStock: item.minimumStock || 0
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                categoryId: categories.length > 0 ? categories[0].id : '',
                currentStock: 0,
                unit: 'PIECES',
                unitCost: 0
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                categoryId: parseInt(formData.categoryId) || categories[0]?.id || 0,
                currentStock: parseFloat(formData.currentStock) || 0,
                unitCost: parseFloat(formData.unitCost) || 0
            };
            if (editingItem) {
                await api.put(`/inventory-items/${editingItem.id}`, payload);
            } else {
                await api.post('/inventory-items', payload);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save inventory item:', err);
            alert('Failed to save inventory item.');
        }
    };
    const getCategoryName = (id) => categories.find(c => c.id === id)?.name || 'Uncategorized';

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Inventory Management</h1>
                    <p className="text-text-slate text-base">Track stock levels, unit costs, and supply chain records.</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Item</button>
            </div>

            <div className="flex flex-col gap-6">
                <div className="premium-card flex gap-12 p-6">
                    <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-text-slate uppercase tracking-wider">Total Items</span>
                        <span className="text-3xl font-bold text-text-dark">{items.length}</span>
                    </div>
                    <div className="flex flex-col gap-2 border-l border-slate-100 pl-12">
                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Low Stock Alerts</span>
                        <span className="text-3xl font-bold text-amber-600">{items.filter(i => i.currentStock <= i.minimumStock).length}</span>
                    </div>
                </div>

                <div className="premium-card overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-20 text-text-slate animate-pulse">Loading inventory...</div>
                    ) : (
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Stock Level</th>
                                    <th>Category</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id} className={item.currentStock <= item.minimumStock ? 'bg-amber-50/30' : ''}>
                                        <td>
                                            <span className="font-bold text-text-dark">{item.name}</span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`text-base font-bold ${item.currentStock <= item.minimumStock ? 'text-red-500' : 'text-green-600'}`}>
                                                    {item.currentStock}
                                                </span>
                                                <span className="text-[12px] text-text-slate">Min: {item.minimumStock}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-bold uppercase w-fit leading-none">{getCategoryName(item.categoryId)}</span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="view-btn" onClick={() => handleOpenModal(item)}>Edit</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[90%] !max-w-[1000px]">
                        <div className="modal-header">
                            <h2>{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Item Name</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Toilet Paper" />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select required value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})}>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Initial Stock</label>
                                    <input type="number" required value={formData.currentStock} onChange={(e) => setFormData({...formData, currentStock: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Inventory Unit</label>
                                    <select required value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
                                        <option value="KG">Kilograms (kg)</option>
                                        <option value="LITRES">Litres (L)</option>
                                        <option value="PIECES">Pieces (pcs)</option>
                                        <option value="BOXES">Boxes</option>
                                        <option value="PACKETS">Packets</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Unit Cost (KSh)</label>
                                    <input type="number" step="0.01" required value={formData.unitCost} onChange={(e) => setFormData({...formData, unitCost: e.target.value})} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">Update Inventory</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
