import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { Users, Plus, Edit2, Trash2, Search, X, Eye, EyeOff, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const UserManagement = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'supervisor',
        assignedLocations: []
    });

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchUsers();
        fetchLocations();
    }, [user, navigate]);

    const fetchUsers = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${apiBaseUrl}/users`, config);
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load users');
            setLoading(false);
        }
    };

    const fetchLocations = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${apiBaseUrl}/locations`, config);
            setLocations(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load locations');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };

            if (editingUser) {
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;

                await axios.put(`${apiBaseUrl}/users/${editingUser._id}`, updateData, config);
                toast.success('User updated successfully');
            } else {
                await axios.post(`${apiBaseUrl}/users`, formData, config);
                toast.success('User created successfully');
            }

            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${apiBaseUrl}/users/${userId}`, config);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete user');
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            assignedLocations: user.assignedLocations || []
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'supervisor', assignedLocations: [] });
        setShowPassword(false);
    };

    const handleLocationToggle = (locationId) => {
        setFormData(prev => ({
            ...prev,
            assignedLocations: prev.assignedLocations.includes(locationId)
                ? prev.assignedLocations.filter(id => id !== locationId)
                : [...prev.assignedLocations, locationId]
        }));
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingSpinner message="Loading users..." type="three-dots" color="#3b82f6" height={60} width={60} />;

    return (
        <div className="user-management">
            <div className="page-header">
                <h1><Users size={24} /> User Management</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setShowModal(true); }}
                >
                    <Plus size={18} /> Add User
                </button>
            </div>

            <div className="search-bar">
                <Search size={20} />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="users-grid">
                {filteredUsers.map(u => (
                    <div key={u._id} className="user-card">
                        <div className="user-info">
                            <div className="user-avatar">
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3>{u.name}</h3>
                                <p className="email">{u.email}</p>
                                <span className={`role-badge ${u.role}`}>{u.role.replace('_', ' ')}</span>
                                {u.role === 'client' && u.assignedLocations?.length > 0 && (
                                    <p className="location-count">{u.assignedLocations.length} location(s)</p>
                                )}
                                <div className="permissions-indicator">
                                    {u.role === 'admin' && <span title="Full Access">👑 Full Access</span>}
                                    {u.role === 'sub_admin' && <span title="Manage Users & Reports">🛡️ Manager</span>}
                                    {u.role === 'supervisor' && <span title="Inspections & Tickets">📋 Field Ops</span>}
                                    {u.role === 'client' && <span title="View Only">👀 View Only</span>}
                                </div>
                            </div>
                        </div>
                        <div className="user-actions">
                            <button
                                onClick={() => openEditModal(u)}
                                className="action-btn edit"
                                title="Edit User"
                            >
                                <Edit2 size={18} />
                            </button>
                            {u._id !== user._id && (
                                <button
                                    onClick={() => handleDelete(u._id)}
                                    className="action-btn delete"
                                    title="Delete User"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                            <button onClick={() => setShowModal(false)} className="close-btn">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="form-control"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="sub_admin">Sub Admin</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="client">Client</option>
                                </select>
                            </div>

                            {formData.role === 'client' && (
                                <div className="form-group">
                                    <label>Assigned Locations</label>
                                    <div className="location-select-container">
                                        {locations.length > 0 ? (
                                            locations.map(location => (
                                                <label key={location._id} className="location-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.assignedLocations.includes(location._id)}
                                                        onChange={() => handleLocationToggle(location._id)}
                                                    />
                                                    <span>{location.name}</span>
                                                </label>
                                            ))
                                        ) : (
                                            <p className="text-muted">No locations available. Create locations first.</p>
                                        )}
                                    </div>
                                    {formData.assignedLocations.length === 0 && locations.length > 0 && (
                                        <small className="text-muted">Select at least one location for the client</small>
                                    )}
                                </div>
                            )}

                            <div className="form-group">
                                <label>
                                    {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                                </label>
                                <div className="password-input">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                        className="form-control"
                                        placeholder={editingUser ? "••••••••" : "Enter password"}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {editingUser && (
                                    <small className="text-muted">
                                        Note: Existing passwords cannot be viewed for security. Enter a new one to reset.
                                    </small>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={18} /> {editingUser ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .user-management { max-width: 1000px; margin: 0 auto; padding: 20px; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .page-header h1 { display: flex; align-items: center; gap: 10px; margin: 0; }
                
                .search-bar { display: flex; align-items: center; gap: 10px; background: white; padding: 12px 20px; border-radius: 12px; margin-bottom: 30px; box-shadow: var(--shadow-sm); }
                .search-bar input { border: none; outline: none; width: 100%; font-size: 16px; }
                
                .users-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
                .user-card { background: white; padding: 20px; border-radius: 12px; box-shadow: var(--shadow-sm); display: flex; justify-content: space-between; align-items: center; gap: 10px; overflow: hidden; }
                .user-info { display: flex; align-items: center; gap: 15px; flex: 1; min-width: 0; }
                .user-info > div:last-child { min-width: 0; }
                .user-avatar { width: 48px; height: 48px; background: var(--primary-color); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; flex-shrink: 0; }
                .user-info h3 { margin: 0 0 4px 0; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .email { margin: 0 0 8px 0; font-size: 13px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .location-count { margin: 4px 0 0 0; font-size: 12px; color: var(--primary-color); font-weight: 500; }
                .permissions-indicator { margin-top: 6px; font-size: 11px; color: var(--text-muted); display: flex; gap: 8px; }
                .role-badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; font-weight: 600; }
                .role-badge.admin { background: #fee2e2; color: #991b1b; }
                .role-badge.sub_admin { background: #fef3c7; color: #92400e; }
                .role-badge.supervisor { background: #dbeafe; color: #1e40af; }
                .role-badge.client { background: #dcfce7; color: #166534; }
                
                .user-actions { display: flex; gap: 8px; flex-shrink: 0; }
                .action-btn { background: none; border: none; padding: 8px; border-radius: 8px; cursor: pointer; color: var(--text-muted); transition: all 0.2s; }
                .action-btn:hover { background: #f1f5f9; color: var(--text-dark); }
                .action-btn.delete:hover { background: #fee2e2; color: #ef4444; }
                
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; border-radius: 12px; padding: 30px; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .modal-header h2 { margin: 0; }
                .close-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); }
                .close-btn:hover { color: var(--text-dark); }
                
                .form-group { margin-bottom: 20px; }
                .form-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; }
                .form-control { width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
                .form-control:focus { outline: none; border-color: var(--primary-color); }
                
                .password-input { position: relative; }
                .toggle-password { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); }
                
                .location-select-container { max-height: 200px; overflow-y: auto; border: 2px solid #e2e8f0; border-radius: 8px; padding: 12px; }
                .location-checkbox { display: flex; align-items: center; gap: 10px; padding: 8px; margin-bottom: 8px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
                .location-checkbox:hover { background: #f8fafc; }
                .location-checkbox input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
                .location-checkbox span { font-size: 14px; }
                
                .text-muted { font-size: 12px; color: var(--text-muted); margin-top: 4px; display: block; }
                .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
            `}</style>
        </div>
    );
};

export default UserManagement;
