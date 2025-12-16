import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, Plus, Pencil, Trash2, Copy } from 'lucide-react';

const TemplateManagement = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role !== 'admin' && user?.role !== 'sub_admin') {
            navigate('/');
            return;
        }
        fetchTemplates();
    }, [user, navigate]);

    const fetchTemplates = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/templates', config);
            setTemplates(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load templates');
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`http://localhost:5000/api/templates/${id}`, config);
            toast.success('Template deleted successfully');
            fetchTemplates();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete template');
        }
    };

    const handleClone = async (template) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const clonedData = {
                name: `${template.name} (Copy)`,
                description: template.description,
                sections: template.sections,
            };
            await axios.post('http://localhost:5000/api/templates', clonedData, config);
            toast.success('Template cloned successfully');
            fetchTemplates();
        } catch (error) {
            console.error(error);
            toast.error('Failed to clone template');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="template-management">
            <div className="page-header">
                <h1><FileText size={24} /> Template Management</h1>
                <button className="btn btn-primary" onClick={() => navigate('/templates/new')}>
                    <Plus size={18} /> Create Template
                </button>
            </div>

            <div className="templates-grid">
                {templates.map(template => (
                    <div key={template._id} className="template-card">
                        <div className="template-header">
                            <h3>{template.name}</h3>
                            <div className="template-actions">
                                <button className="icon-btn" onClick={() => handleClone(template)} title="Clone">
                                    <Copy size={16} />
                                </button>
                                <button className="icon-btn" onClick={() => navigate(`/templates/edit/${template._id}`)} title="Edit">
                                    <Pencil size={16} />
                                </button>
                                <button className="icon-btn delete" onClick={() => handleDelete(template._id)} title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <p className="template-description">{template.description}</p>
                        <div className="template-stats">
                            <span>{template.sections?.length || 0} sections</span>
                            <span>
                                {template.sections?.reduce((sum, section) => sum + (section.items?.length || 0), 0) || 0} items
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="empty-state">
                    <FileText size={48} color="#9ca3af" />
                    <p>No templates yet</p>
                    <button className="btn btn-primary" onClick={() => navigate('/templates/new')}>
                        Create Your First Template
                    </button>
                </div>
            )}

            <style>{`
                .template-management { padding: 20px; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .page-header h1 { display: flex; align-items: center; gap: 10px; margin: 0; }
                .templates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
                .template-card { background: white; padding: 24px; border-radius: 12px; box-shadow: var(--shadow-sm); transition: transform 0.2s; }
                .template-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
                .template-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
                .template-header h3 { margin: 0; font-size: 18px; }
                .template-actions { display: flex; gap: 8px; }
                .icon-btn { background: none; border: none; padding: 6px; border-radius: 4px; cursor: pointer; }
                .icon-btn:hover { background: #f3f4f6; }
                .icon-btn.delete:hover { background: #fee2e2; color: #dc2626; }
                .template-description { font-size: 14px; color: var(--text-muted); margin: 0 0 16px 0; }
                .template-stats { display: flex; gap: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
                .template-stats span { font-size: 13px; color: var(--text-light); }
                .empty-state { text-align: center; padding: 60px 20px; background: white; border-radius: 12px; }
                .empty-state p { margin: 16px 0 24px 0; color: var(--text-muted); }
            `}</style>
        </div>
    );
};

export default TemplateManagement;
