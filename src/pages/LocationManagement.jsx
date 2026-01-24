import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import toast from 'react-hot-toast';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const LocationManagement = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'building',
        address: '',
    });

    useEffect(() => {
        if (user?.role !== 'admin' && user?.role !== 'sub_admin') {
            navigate('/');
            return;
        }
        fetchLocations();
    }, [user, navigate]);

    const fetchLocations = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${apiBaseUrl}/locations`, config);
            setLocations(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load locations');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            if (editingLocation) {
                await axios.put(`${apiBaseUrl}/locations/${editingLocation._id}`, formData, config);
                toast.success('Location updated successfully');
            } else {
                await axios.post(`${apiBaseUrl}/locations`, formData, config);
                toast.success('Location created successfully');
            }
            setShowForm(false);
            setEditingLocation(null);
            setFormData({ name: '', type: 'building', address: '' });
            fetchLocations();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save location');
        }
    };

    const handleEdit = (location) => {
        setEditingLocation(location);
        setFormData({
            name: location.name,
            type: location.type,
            address: location.address || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this location?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${apiBaseUrl}/locations/${id}`, config);
            toast.success('Location deleted successfully');
            fetchLocations();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete location');
        }
    };

    if (loading) return <LoadingSpinner message="Loading locations..." type="three-dots" color="#3b82f6" height={60} width={60} />;

    return (
        <div className="location-management">
            <div className="page-header">
                <h1><Building2 size={24} /> Location Management</h1>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} /> Add Location
                </button>
            </div>

            {showForm && (
                <div className="form-card">
                    <h2>{editingLocation ? 'Edit Location' : 'New Location'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Type</label>
                            <select
                                className="form-control"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="building">Building</option>
                                <option value="floor">Floor</option>
                                <option value="room">Room</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => {
                                setShowForm(false);
                                setEditingLocation(null);
                                setFormData({ name: '', type: 'building', address: '' });
                            }}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingLocation ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="locations-grid">
                {locations.map(location => (
                    <div key={location._id} className="location-card">
                        <div className="location-header">
                            <h3>{location.name}</h3>
                            <div className="location-actions">
                                <button className="icon-btn" onClick={() => handleEdit(location)}>
                                    <Pencil size={16} />
                                </button>
                                <button className="icon-btn delete" onClick={() => handleDelete(location._id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="location-info">
                            <span className="type-badge">{location.type}</span>
                            {location.address && <p>{location.address}</p>}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .location-management { padding: 20px; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .page-header h1 { display: flex; align-items: center; gap: 10px; margin: 0; }
                .form-card { background: white; padding: 24px; border-radius: 12px; box-shadow: var(--shadow-sm); margin-bottom: 24px; }
                .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
                .locations-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
                .location-card { background: white; padding: 20px; border-radius: 12px; box-shadow: var(--shadow-sm); }
                .location-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
                .location-header h3 { margin: 0; font-size: 18px; }
                .location-actions { display: flex; gap: 8px; }
                .icon-btn { background: none; border: none; padding: 6px; border-radius: 4px; cursor: pointer; }
                .icon-btn:hover { background: #f3f4f6; }
                .icon-btn.delete:hover { background: #fee2e2; color: #dc2626; }
                .type-badge { display: inline-block; padding: 4px 10px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
                .location-info p { margin: 8px 0 0 0; font-size: 14px; color: var(--text-muted); }
            `}</style>
        </div>
    );
};

export default LocationManagement;
