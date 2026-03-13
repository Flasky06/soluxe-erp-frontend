import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [units, setUnits] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        currentStock: 0,
        unitId: '',
        unitCost: 0,
        buyingPrice: 0
    });

    const fetchData = async () => {
        try {
            const [itemsRes, catsRes, unitsRes] = await Promise.all([
                api.get('/inventory-items'),
                api.get('/inventory-categories'),
                api.get('/inventory-units')
            ]);
            setItems(itemsRes.data);
            setCategories(catsRes.data);
            setUnits(unitsRes.data);
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
                unitId: item.unitId || '',
                unitCost: item.unitCost || 0,
                buyingPrice: item.buyingPrice || 0
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                categoryId: categories.length > 0 ? categories[0].id : '',
                currentStock: 0,
                unitId: units.length > 0 ? units[0].id : '',
                unitCost: 0,
                buyingPrice: 0
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
                unitId: parseInt(formData.unitId) || units[0]?.id || 0,
                currentStock: parseFloat(formData.currentStock) || 0,
                unitCost: parseFloat(formData.unitCost) || 0,
                buyingPrice: parseFloat(formData.buyingPrice) || 0
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
    const getUnitName = (id) => units.find(u => u.id === id)?.name || 'N/A';

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
                                    <th>Unit</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <span className="font-bold text-text-dark">{item.name}</span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-base font-bold text-text-dark">
                                                    {item.currentStock}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-bold uppercase w-fit leading-none">{getCategoryName(item.categoryId)}</span>
                                        </td>
                                        <td>
                                            <span className="text-sm text-text-slate">{getUnitName(item.unitId)}</span>
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
                                    <select required value={formData.unitId} onChange={(e) => setFormData({...formData, unitId: e.target.value})}>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Buying Price (KSh)</label>
                                    <input type="number" step="0.01" required value={formData.buyingPrice} onChange={(e) => setFormData({...formData, buyingPrice: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Selling Price (KSh)</label>
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
