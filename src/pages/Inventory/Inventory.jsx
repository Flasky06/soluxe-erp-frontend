import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Plus } from 'lucide-react';

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
        minimumStock: 0,
        unitId: '',
        buyingPrice: 0,
        notes: ''
    });

    // Quick Category Add
    const [showQuickCatModal, setShowQuickCatModal] = useState(false);
    const [quickCatData, setQuickCatData] = useState({ name: '', description: '' });
    const [quickCatLoading, setQuickCatLoading] = useState(false);

    // Quick Unit Add
    const [showUnitModal, setShowUnitModal] = useState(false);

    const fetchData = async () => {
        try {
            const [itemsRes, catsRes, unitsRes] = await Promise.all([
                api.get('/inventory'),
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

    const handleQuickAddCategory = async (e) => {
        e.preventDefault();
        if (!quickCatData.name) return;
        setQuickCatLoading(true);
        try {
            const res = await api.post('/inventory-categories', quickCatData);
            // Refresh categories
            const catsRes = await api.get('/inventory-categories');
            setCategories(catsRes.data);
            // Select the new category
            setFormData(prev => ({ ...prev, categoryId: res.data.id }));
            setShowQuickCatModal(false);
            setQuickCatData({ name: '', description: '' });
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
                name: item.name || '',
                categoryId: item.categoryId || '',
                currentStock: item.currentStock || 0,
                minimumStock: item.minimumStock || 0,
                unitId: item.unitId || '',
                buyingPrice: item.buyingPrice || 0,
                notes: item.notes || ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                categoryId: categories.length > 0 ? categories[0].id : '',
                currentStock: 0,
                minimumStock: 0,
                unitId: units.length > 0 ? units[0].id : '',
                buyingPrice: 0,
                notes: ''
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
                minimumStock: parseFloat(formData.minimumStock) || 0,
                buyingPrice: parseFloat(formData.buyingPrice) || 0,
                notes: formData.notes || ''
            };
            if (editingItem) {
                await api.put(`/inventory/${editingItem.id}`, payload);
            } else {
                await api.post('/inventory', payload);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save inventory item:', err);
            alert('Failed to save inventory item.');
        }
    };

    const handleCreateUnit = async (e) => {
        e.preventDefault();
        try {
            const name = e.target.name.value;
            const description = e.target.description.value;
            const res = await api.post('/inventory-units', { name, description });
            
            // Refresh units list
            const unitsRes = await api.get('/inventory-units');
            setUnits(unitsRes.data);
            
            // Select the new unit in formData
            setFormData(prev => ({ ...prev, unitId: res.data.id }));
            
            setShowUnitModal(false);
        } catch (err) {
            console.error('Failed to create Unit:', err);
            alert('Failed to create inventory unit');
        }
    };
    const getCategoryName = (id) => categories.find(c => c.id === id)?.name || '-';
    const getUnitName = (id) => units.find(u => u.id === id)?.name || '-';

    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryName(item.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search items by name or category..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors" 
                        onClick={() => setShowQuickCatModal(true)}
                    >
                        Manage Categories
                    </button>
                    <button 
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors" 
                        onClick={() => setShowUnitModal(true)}
                    >
                        Manage Units
                    </button>
                    <button className="btn-primary" onClick={() => handleOpenModal()}>Add Item</button>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <div className="premium-card flex gap-12 p-6">
                    <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-bold text-text-slate uppercase tracking-wider">Total Items</span>
                        <span className="text-3xl font-bold text-text-dark">{items.length}</span>
                    </div>
                </div>

                <div className="table-card overflow-x-auto">
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
                                {filteredItems.length > 0 ? filteredItems.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <span className="font-bold text-text-dark">{item.name || '-'}</span>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-base font-bold text-text-dark">
                                                    {item.currentStock ?? '-'} / <span className="text-xs text-text-slate">Min: {item.minimumStock ?? 0}</span>
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-bold uppercase w-fit leading-none">{getCategoryName(item.categoryId)}</span>
                                        </td>
                                        <td>
                                            <span className="text-sm text-text-slate">{getUnitName(item.unitId) || '-'}</span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="view-btn" onClick={() => handleOpenModal(item)}>Edit</button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-slate-400 font-medium italic">
                                            No inventory items found matching "{searchTerm}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[90%] !max-w-[1000px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Item Name</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Toilet Paper" />
                                </div>
                                <div className="form-group">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="mb-0">Category</label>
                                    </div>
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
                                    <div className="flex gap-2">
                                        <select className="flex-1" required value={formData.unitId} onChange={(e) => setFormData({...formData, unitId: e.target.value})}>
                                            {units.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                        <button 
                                            type="button"
                                            className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center transition-colors px-3"
                                            onClick={() => setShowUnitModal(true)}
                                            title="Add New Unit"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Minimum Stock Level</label>
                                    <input type="number" required value={formData.minimumStock} onChange={(e) => setFormData({...formData, minimumStock: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Buying Price (KSh)</label>
                                    <input type="number" step="0.01" required value={formData.buyingPrice} onChange={(e) => setFormData({...formData, buyingPrice: e.target.value})} />
                                </div>
                                <div className="form-group full-width">
                                    <label>Internal Notes / Description</label>
                                    <textarea 
                                        className="w-full min-h-[80px]" 
                                        value={formData.notes} 
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                                        placeholder="Add any specific storage instructions or details..."
                                    />
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

            {/* Quick Category Modal */}
            {showQuickCatModal && (
                <div className="modal-overlay z-[1000]">
                    <div className="modal-content premium-card !w-[90%] !max-w-[400px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">Quick Add Category</h2>
                            <button className="close-modal-btn" onClick={() => setShowQuickCatModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleQuickAddCategory} className="p-4">
                            <div className="form-group full-width">
                                <label>Category Name</label>
                                <input 
                                    type="text" 
                                    required 
                                    autoFocus
                                    value={quickCatData.name} 
                                    onChange={(e) => setQuickCatData({...quickCatData, name: e.target.value})} 
                                    placeholder="e.g. Toiletries" 
                                />
                            </div>
                            <div className="modal-footer !px-0 mt-6">
                                <button type="button" onClick={() => setShowQuickCatModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary" disabled={quickCatLoading}>
                                    {quickCatLoading ? 'Adding...' : 'Add Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Quick Unit Modal */}
            {showUnitModal && (
                <div className="modal-overlay z-[1001]">
                    <div className="modal-content premium-card !w-[90%] !max-w-[400px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">Add Inventory Unit</h2>
                            <button className="close-modal-btn" onClick={() => setShowUnitModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateUnit} className="p-4">
                            <div className="form-group">
                                <label>Unit Name</label>
                                <input name="name" type="text" required placeholder="e.g. Kg, Pcs, Box" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input name="description" type="text" placeholder="e.g. Kilograms" />
                            </div>
                            <div className="modal-footer !px-0 mt-6">
                                <button type="button" onClick={() => setShowUnitModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
