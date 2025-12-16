import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

const TicketForm = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [locations, setLocations] = useState([]);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        location: '',
        status: 'open',
        inspection: '',
        scheduledDate: '',
        assignedTo: ''
    });

    useEffect(() => {
        if (location.state) {
            const { title, description, location: locId, priority, inspection: inspId } = location.state;
            setFormData(prev => ({
                ...prev,
                title: title || '',
                description: description || '',
                location: locId || '',
                priority: priority || 'medium',
                inspection: inspId || ''
            }));
        }
    }, [location.state]);

    useEffect(() => {
        const fetchLocations = async () => {
            if (!user || !user.token) return;
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                const { data } = await axios.get('http://localhost:5000/api/locations', config);
                setLocations(data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load locations');
            }
        };
        fetchLocations();
    }, [user]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!user || !user.token) return;
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                const { data } = await axios.get('http://localhost:5000/api/users', config);
                console.log('Fetched users:', data);
                setUsers(data);
            } catch (error) {
                console.error('Error fetching users:', error);
                toast.error('Failed to load users for assignment');
            }
        };
        fetchUsers();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            await axios.post('http://localhost:5000/api/tickets', formData, config);
            toast.success('Ticket created successfully');
            navigate('/tickets');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create ticket');
        }
    };

    return (
        <div className="ticket-form-container">
            <div className="form-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={20} />
                </button>
                <h1>Create New Ticket</h1>
            </div>

            <form onSubmit={handleSubmit} className="ticket-form">
                <div className="form-group">
                    <label>Title</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Broken AC in Lobby"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Location</label>
                    <select
                        className="form-control"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                    >
                        <option value="">Select Location...</option>
                        {locations.map(loc => (
                            <option key={loc._id} value={loc._id}>{loc.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Priority</label>
                        <select
                            className="form-control"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select
                            className="form-control"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Scheduled Date (Optional)</label>
                    <input
                        type="datetime-local"
                        className="form-control"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>Assign To (Optional)</label>
                    <select
                        className="form-control"
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    >
                        <option value="">Unassigned</option>
                        {users.filter(u => u.role === 'supervisor').map(u => (
                            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        className="form-control"
                        rows="5"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe the issue in detail..."
                        required
                    ></textarea>
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                    <Save size={18} /> Create Ticket
                </button>
            </form>

            <style>{`
        .form-header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
        .back-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 5px; border-radius: 50%; }
        .back-btn:hover { background: #f1f5f9; }
        .ticket-form { background: white; padding: 30px; border-radius: 12px; box-shadow: var(--shadow-sm); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      `}</style>
        </div>
    );
};

export default TicketForm;
