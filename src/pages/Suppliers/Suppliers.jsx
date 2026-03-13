import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        category: 'GENERAL'
    });
    const [serverErrors, setServerErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/suppliers');
            setSuppliers(res.data);
        } catch (err) {
            console.error('Failed to fetch suppliers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                contactPerson: supplier.contactPerson || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || '',
                category: supplier.category || 'GENERAL'
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '',
                contactPerson: '',
                phone: '',
                email: '',
                address: '',
                category: 'GENERAL'
            });
        }
        setServerErrors({});
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerErrors({});
        setIsSaving(true);
        try {
            if (editingSupplier) {
                await api.put(`/suppliers/${editingSupplier.id}`, formData);
            } else {
                await api.post('/suppliers', formData);
            }
            setShowModal(false);
            fetchSuppliers();
        } catch (err) {
            console.error('Failed to save supplier:', err);
            if (err.response && (err.response.status === 400 || err.response.status === 409)) {
                setServerErrors(err.response.data);
            } else {
                alert('Failed to save supplier. Please verify your information.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            try {
                await api.delete(`/suppliers/${id}`);
                fetchSuppliers();
            } catch (err) {
                console.error('Failed to delete supplier:', err);
                alert('Failed to delete supplier.');
            }
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-end items-center mb-8">
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Supplier</button>
            </div>

            <div className="premium-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading suppliers...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Supplier Name</th>
                                <th>Contact Person</th>
                                <th>Phone & Email</th>
                                <th>Category</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((supplier) => (
                                <tr key={supplier.id}>
                                    <td className="font-bold text-text-dark">{supplier.name}</td>
                                    <td>{supplier.contactPerson}</td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{supplier.phone}</span>
                                            <span className="text-[12px] text-text-slate">{supplier.email}</span>
                                        </div>
                                    </td>
                                    <td><span className="status-badge info">{supplier.category}</span></td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(supplier)}>Edit</button>
                                            <button className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-300 ml-2" onClick={() => handleDelete(supplier.id)}>Delete</button>
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
                    <div className="modal-content premium-card !w-[80%] !max-w-[1000px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        {serverErrors.error && (
                            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                                {serverErrors.error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Company Name</label>
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Fresh Foods Ltd" />
                                    {serverErrors.name && <p className="text-red-500 text-xs mt-1">{serverErrors.name}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Contact Person</label>
                                    <input type="text" required value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})} placeholder="Full name" />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+254..." />
                                    {serverErrors.phone && <p className="text-red-500 text-xs mt-1">{serverErrors.phone}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="orders@vendor.com" />
                                    {serverErrors.email && <p className="text-red-500 text-xs mt-1">{serverErrors.email}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Supply Category</label>
                                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                        <option value="FOOD">Food</option>
                                        <option value="BEVERAGE">Beverage</option>
                                        <option value="HOUSEKEEPING">Housekeeping Supplies</option>
                                        <option value="MAINTENANCE">Maintenance & Tools</option>
                                        <option value="OFFICE">Office Stationery</option>
                                        <option value="GENERAL">General Vendor</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="form-group full-width">
                                    <label>Office Address</label>
                                    <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Physical location or mailing address..." rows="2" className="min-h-[80px]" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10" disabled={isSaving}>
                                    {isSaving ? 'Processing...' : editingSupplier ? 'Save Updates' : 'Add Supplier'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
