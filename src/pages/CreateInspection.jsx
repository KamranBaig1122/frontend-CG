import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import toast from 'react-hot-toast';
import { ClipboardList, ArrowLeft, Save } from 'lucide-react';

const CreateInspection = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [locations, setLocations] = useState([]);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        template: '',
        location: '',
        inspector: '',
    });

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const [templatesRes, locationsRes, usersRes] = await Promise.all([
                axios.get(`${apiBaseUrl}/templates`, config),
                axios.get(`${apiBaseUrl}/locations`, config),
                axios.get(`${apiBaseUrl}/users`, config),
            ]);
            setTemplates(templatesRes.data);
            setLocations(locationsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load data');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };

            // Get the selected template to use its structure
            const selectedTemplate = templates.find(t => t._id === formData.template);

            if (!selectedTemplate) {
                toast.error('Invalid template selected');
                return;
            }

            // Generate unique IDs for sections and items
            const generateId = () => {
                // Simple ID generator - MongoDB will create real ObjectIds
                return Date.now().toString(36) + Math.random().toString(36).substr(2);
            };

            const inspectionData = {
                template: formData.template,
                location: formData.location,
                inspector: formData.inspector,
                status: 'in_progress',
                sections: selectedTemplate.sections.map((section) => ({
                    sectionId: section._id,
                    name: section.name,
                    items: section.items.map((item) => ({
                        itemId: item._id,
                        name: item.name,
                        score: null,
                        comment: '',
                        status: 'pass',
                    })),
                })),
            };

            console.log('Sending inspection data:', inspectionData);
            await axios.post(`${apiBaseUrl}/inspections`, inspectionData, config);
            toast.success('Inspection created and assigned successfully');
            navigate('/inspections');
        } catch (error) {
            console.error('Error creating inspection:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to create inspection';
            toast.error(errorMsg);
        }
    };

    return (
        <div className="create-inspection">
            <div className="form-header">
                <button onClick={() => navigate('/inspections')} className="back-btn">
                    <ArrowLeft size={20} />
                </button>
                <h1><ClipboardList size={24} /> Create & Assign Inspection</h1>
            </div>

            <form onSubmit={handleSubmit} className="inspection-form">
                <div className="form-group">
                    <label>Template *</label>
                    <select
                        className="form-control"
                        value={formData.template}
                        onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                        required
                    >
                        <option value="">Select a template</option>
                        {templates.map(template => (
                            <option key={template._id} value={template._id}>{template.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Location *</label>
                    <select
                        className="form-control"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                    >
                        <option value="">Select a location</option>
                        {locations.map(location => (
                            <option key={location._id} value={location._id}>{location.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Assign to Supervisor *</label>
                    <select
                        className="form-control"
                        value={formData.inspector}
                        onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                        required
                    >
                        <option value="">Select a supervisor</option>
                        {users.filter(u => u.role === 'supervisor').map(u => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                    </select>
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                    <Save size={18} /> Create Inspection
                </button>
            </form>

            <style>{`
                .create-inspection { max-width: 600px; margin: 0 auto; padding: 20px; }
                .form-header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
                .form-header h1 { display: flex; align-items: center; gap: 10px; margin: 0; }
                .back-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 8px; }
                .back-btn:hover { background: #f3f4f6; }
                .inspection-form { background: white; padding: 30px; border-radius: 12px; box-shadow: var(--shadow-sm); }
                .form-group small { display: block; margin-top: 4px; color: var(--text-muted); font-size: 12px; }
            `}</style>
        </div>
    );
};

export default CreateInspection;
