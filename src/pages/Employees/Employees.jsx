import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
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

    useEffect(() => {
        fetchData();
    }, []);

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
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            alert('Failed to save employee.');
        }
    };

    const getDepartmentName = (id) => {
        const dept = departments.find(d => d.id === id);
        return dept ? dept.name : 'Unknown';
    };

    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-text-dark">Employee Directory</h1>
                    <p className="text-text-slate text-base">Manage hotel staff, assignments, and professional records.</p>
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>Add Employee</button>
            </div>

            <div className="premium-card overflow-x-auto">
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
                            {employees.map((emp) => (
                                <tr key={emp.id}>
                                    <td>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-text-dark">{emp.fullName}</span>
                                            <span className="text-[12px] text-text-slate">{emp.email} • {emp.phone}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase w-fit leading-none">{getDepartmentName(emp.departmentId)}</span>
                                            <span className="text-sm font-medium text-slate-600">{emp.designation}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold text-slate-800">KSh {parseFloat(emp.basicSalary || 0).toLocaleString()}</span>
                                            <span className="text-[12px] text-text-slate italic">Joined: {emp.dateOfJoining}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold text-text-slate uppercase">{emp.idTypeName}</span>
                                            <span className="text-xs font-mono text-text-dark">{emp.idNumber}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-1.5">
                                            {emp.languagesSpoken?.split(',').map(lang => (
                                                <span key={lang} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">{lang.trim()}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="view-btn" onClick={() => handleOpenModal(emp)}>Edit</button>
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
                    <div className="modal-content premium-card !w-[85%] !max-w-[1200px]">
                        <div className="modal-header">
                            <h2>{editingEmployee ? 'Edit Employee Details' : 'Register New Staff Member'}</h2>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Jane Smith" />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="jane.s@hotel.com" />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="text" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1 555 1234" />
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
                                </div>
                                <div className="form-group full-width">
                                    <label>Languages Spoken (comma separated)</label>
                                    <input type="text" value={formData.languagesSpoken} onChange={(e) => setFormData({...formData, languagesSpoken: e.target.value})} placeholder="English, French, Mandarin" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary !px-10">Cancel</button>
                                <button type="submit" className="btn-primary !px-10">Save Personnel Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
