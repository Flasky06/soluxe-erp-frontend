import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search } from 'lucide-react';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [idTypes, setIdTypes] = useState([]);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        designation: '',
        basicSalary: '',
        dateOfJoining: '',
        languagesSpoken: '',
        departmentId: '',
        nationality: '',
        idTypeId: '',
        idNumber: ''
    });
    const [deptFormData, setDeptFormData] = useState({ name: '', description: '' });
    const [serverErrors, setServerErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        try {
            const [employeesRes, deptsRes, idTypesRes] = await Promise.all([
                api.get('/employees'),
                api.get('/departments'),
                api.get('/id-types')
            ]);
            setEmployees(employeesRes.data);
            setDepartments(deptsRes.data);
            setIdTypes(idTypesRes.data);
            
            if (deptsRes.data.length > 0 && idTypesRes.data.length > 0) {
                setFormData(prev => ({ 
                    ...prev, 
                    departmentId: deptsRes.data[0].id,
                    idTypeId: idTypesRes.data[0].id 
                }));
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            setDepartments(res.data);
        } catch (err) {
            console.error('Failed to fetch departments:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateDept = async (e) => {
        e.preventDefault();
        try {
            await api.post('/departments', deptFormData);
            setShowDeptModal(false);
            setDeptFormData({ name: '', description: '' });
            fetchDepartments();
        } catch (err) {
            console.error('Failed to create department', err);
            alert('Failed to create department.');
        }
    };

    const handleOpenModal = (employee = null) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData({
                fullName: employee.fullName || '',
                phone: employee.phone || '',
                email: employee.email || '',
                designation: employee.designation || '',
                basicSalary: employee.basicSalary || '',
                dateOfJoining: employee.dateOfJoining || '',
                languagesSpoken: employee.languagesSpoken || '',
                departmentId: employee.departmentId || '',
                nationality: employee.nationality || '',
                idTypeId: employee.idTypeId || '',
                idNumber: employee.idNumber || ''
            });
        } else {
            setEditingEmployee(null);
            setFormData({
                fullName: '',
                phone: '',
                email: '',
                designation: '',
                basicSalary: '',
                dateOfJoining: '',
                languagesSpoken: '',
                departmentId: departments.length > 0 ? departments[0].id : '',
                nationality: 'Kenyan',
                idTypeId: idTypes.length > 0 ? idTypes[0].id : '',
                idNumber: ''
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
            const payload = {
                ...formData,
                departmentId: parseInt(formData.departmentId) || 0,
                idTypeId: parseInt(formData.idTypeId) || 0,
                basicSalary: parseFloat(formData.basicSalary) || 0
            };
            if (editingEmployee) {
                await api.put(`/employees/${editingEmployee.id}`, payload);
            } else {
                await api.post('/employees', payload);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Failed to save employee:', err);
            if (err.response && (err.response.status === 400 || err.response.status === 409)) {
                setServerErrors(err.response.data);
            } else {
                alert('Failed to save employee record. Please check your connection.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const getDepartmentName = (id) => {
        const dept = departments.find(d => d.id === id);
        return dept ? dept.name : 'Unknown';
    };

    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = employees.filter(emp => 
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDepartmentName(emp.departmentId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col">
            <div className="table-tools">
                <div className="table-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search staff by name, email, role or department..." 
                        className="search-input w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors" onClick={() => setShowDeptModal(true)}>
                        Manage Departments
                    </button>
                    <button className="btn-primary" onClick={() => handleOpenModal()}>Add Employee</button>
                </div>
            </div>

            <div className="table-card overflow-x-auto">
                {loading ? (
                    <div className="text-center py-20 text-text-slate animate-pulse">Loading staff directory...</div>
                ) : (
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Department & Role</th>
                                <th>Salary & Joining</th>
                                <th>Identity</th>
                                <th>Languages</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length > 0 ? filteredEmployees.map((emp) => (
                                <tr key={emp.id}>
                                    <td>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-text-dark">{emp.fullName || '-'}</span>
                                            <span className="text-[12px] text-text-slate">{emp.email || '-'} • {emp.phone || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase w-fit leading-none">{getDepartmentName(emp.departmentId)}</span>
                                            <span className="text-sm font-medium text-slate-600">{emp.designation || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold text-slate-800">KSh {parseFloat(emp.basicSalary || 0).toLocaleString()}</span>
                                            <span className="text-[12px] text-text-slate italic">Joined: {emp.dateOfJoining || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold text-text-slate uppercase">{emp.idTypeName || '-'}</span>
                                            <span className="text-xs font-mono text-text-dark">{emp.idNumber || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1.5">
                                            {emp.languagesSpoken ? emp.languagesSpoken.split(',').map(lang => (
                                                <span key={lang} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">{lang.trim()}</span>
                                            )) : '-'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(emp)}>Edit</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-slate-400 font-medium italic">
                                        No staff members found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[85%] !max-w-[1200px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">{editingEmployee ? 'Edit Employee Details' : 'Register New Staff Member'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        {serverErrors.error && (
                            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                                {serverErrors.error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Jane Smith" />
                                    {serverErrors.fullName && <p className="text-red-500 text-xs mt-1">{serverErrors.fullName}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="jane.s@hotel.com" />
                                    {serverErrors.email && <p className="text-red-500 text-xs mt-1">{serverErrors.email}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1 555 1234" />
                                    {serverErrors.phone && <p className="text-red-500 text-xs mt-1">{serverErrors.phone}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Department</label>
                                    <select required value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})}>
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Designation</label>
                                    <input type="text" required value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} placeholder="e.g. Senior Receptionist" />
                                    {serverErrors.designation && <p className="text-red-500 text-xs mt-1">{serverErrors.designation}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Basic Salary (KSh)</label>
                                    <input type="number" required value={formData.basicSalary} onChange={(e) => setFormData({...formData, basicSalary: e.target.value})} placeholder="3500" />
                                </div>
                                <div className="form-group">
                                    <label>Date of Joining</label>
                                    <input type="date" required value={formData.dateOfJoining} onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Nationality</label>
                                    <input type="text" required value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} placeholder="e.g. Kenyan" />
                                </div>
                                <div className="form-group">
                                    <label>ID Type</label>
                                    <select required value={formData.idTypeId} onChange={(e) => setFormData({...formData, idTypeId: e.target.value})}>
                                        {idTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Passport / ID Number</label>
                                    <input type="text" required value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} placeholder="A12345678" />
                                    {serverErrors.idNumber && <p className="text-red-500 text-xs mt-1">{serverErrors.idNumber}</p>}
                                </div>
                                <div className="form-group full-width">
                                    <label>Languages Spoken (comma separated)</label>
                                    <input type="text" value={formData.languagesSpoken} onChange={(e) => setFormData({...formData, languagesSpoken: e.target.value})} placeholder="English, French, Mandarin" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10" disabled={isSaving}>
                                    {isSaving ? 'Saving...' : editingEmployee ? 'Save Changes' : 'Add Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showDeptModal && (
                <div className="modal-overlay">
                    <div className="modal-content premium-card !w-[90%] !max-w-[500px]">
                        <div className="modal-header">
                            <h2 className="text-xl font-bold text-primary">Add Department</h2>
                            <button className="close-modal-btn" onClick={() => setShowDeptModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateDept} className="form-grid">
                            <div className="form-group full-width">
                                <label>Department Name</label>
                                <input type="text" required value={deptFormData.name} onChange={e => setDeptFormData({...deptFormData, name: e.target.value})} placeholder="e.g. Housekeeping, Kitchen" />
                            </div>
                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea required value={deptFormData.description} onChange={e => setDeptFormData({...deptFormData, description: e.target.value})} placeholder="Responsibilities..." />
                            </div>
                            <div className="modal-footer col-span-full">
                                <button type="button" onClick={() => setShowDeptModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create Department</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
