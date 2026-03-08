import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Inventory.css';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        nameZh: '',
        categoryId: '',
        defaultSupplierId: '',
        unit: 'PIECE',
        unitCost: '',
        currentStock: 0,
        minimumStock: 0,
        notes: ''
    });

    const fetchData = async () => {
        try {
            const [itemsRes, catsRes, suppsRes] = await Promise.all([
                api.get('/inventory-items'),
                api.get('/inventory-categories'),
                api.get('/suppliers')
            ]);
            setItems(itemsRes.data);
            setCategories(catsRes.data);
            setSuppliers(suppsRes.data);
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
                nameZh: item.nameZh || '',
                categoryId: item.categoryId || '',
                defaultSupplierId: item.defaultSupplierId || '',
                unit: item.unit || 'PIECE',
                unitCost: item.unitCost || '',
                currentStock: item.currentStock || 0,
                minimumStock: item.minimumStock || 0,
                notes: item.notes || ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                nameZh: '',
                categoryId: categories.length > 0 ? categories[0].id : '',
                defaultSupplierId: suppliers.length > 0 ? suppliers[0].id : '',
                unit: 'PIECE',
                unitCost: '',
                currentStock: 0,
                minimumStock: 5,
                notes: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await api.put(`/inventory-items/${editingItem.id}`, formData);
            } else {
                await api.post('/inventory-items', formData);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save inventory item:', err);
            alert('Failed to save inventory item.');
        }
    };

    const getCategoryName = (id) => categories.find(c => c.id === id)?.name || 'Uncategorized';
    const getSupplierName = (id) => suppliers.find(s => s.id === id)?.name || 'Direct Purchase';

    return (
        <div className="inventory-page">
            <div className="page-header">
                <div>
                    <h1>Inventory Management</h1>
                    <p>Track stock levels, unit costs, and supply chain records.</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>+ Add Item</button>
            </div>

            <div className="inventory-grid">
                <div className="premium-card stats-summary">
                    <div className="stat-item">
                        <span className="stat-label">Total Items</span>
                        <span className="stat-value">{items.length}</span>
                    </div>
                    <div className="stat-item warning">
                        <span className="stat-label">Low Stock Alerts</span>
                        <span className="stat-value">{items.filter(i => i.currentStock <= i.minimumStock).length}</span>
                    </div>
                </div>

                <div className="premium-card table-container">
                    {loading ? (
                        <div className="loading">Loading inventory...</div>
                    ) : (
                        <table className="management-table">
                            <thead>
                                <tr>
                                    <th>Item Details</th>
                                    <th>Stock Level</th>
                                    <th>Category & Supplier</th>
                                    <th>Cost</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id} className={item.currentStock <= item.minimumStock ? 'row-warning' : ''}>
                                        <td>
                                            <div className="item-info">
                                                <span className="bold">{item.name}</span>
                                                <span className="sub-text">{item.nameZh}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="stock-info">
                                                <span className={`stock-count ${item.currentStock <= item.minimumStock ? 'text-danger' : 'text-success'}`}>
                                                    {item.currentStock} {item.unit}s
                                                </span>
                                                <span className="sub-text">Min: {item.minimumStock}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="cat-supp">
                                                <span className="badge-secondary">{getCategoryName(item.categoryId)}</span>
                                                <span className="sub-text">{getSupplierName(item.defaultSupplierId)}</span>
                                            </div>
                                        </td>
                                        <td>${item.unitCost}</td>
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
                    <div className="modal-content premium-card modal-lg inventory-modal">
                        <div className="modal-header">
                            <h2>{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Item Name (English)</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Toilet Paper" />
                                </div>
                                <div className="form-group">
                                    <label>Item Name (Chinese)</label>
                                    <input type="text" value={formData.nameZh} onChange={(e) => setFormData({...formData, nameZh: e.target.value})} placeholder="e.g. 卫生纸" />
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
                                    <label>Default Supplier</label>
                                    <select value={formData.defaultSupplierId} onChange={(e) => setFormData({...formData, defaultSupplierId: e.target.value})}>
                                        <option value="">No specific supplier</option>
                                        {suppliers.map(supp => (
                                            <option key={supp.id} value={supp.id}>{supp.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Unit of Measure</label>
                                    <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
                                        <option value="PIECE">Piece</option>
                                        <option value="BOX">Box</option>
                                        <option value="KG">Kilogram</option>
                                        <option value="LITER">Liter</option>
                                        <option value="PACK">Pack</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Unit Cost ($)</label>
                                    <input type="number" step="0.01" required value={formData.unitCost} onChange={(e) => setFormData({...formData, unitCost: e.target.value})} placeholder="0.00" />
                                </div>
                                <div className="form-group">
                                    <label>Initial Stock</label>
                                    <input type="number" required value={formData.currentStock} onChange={(e) => setFormData({...formData, currentStock: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Minimum Stock Level</label>
                                    <input type="number" required value={formData.minimumStock} onChange={(e) => setFormData({...formData, minimumStock: e.target.value})} />
                                </div>
                                <div className="form-group full-width">
                                    <label>Notes</label>
                                    <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Specify storage conditions or quality requirements..." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Update Inventory</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
