import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const ITEM_TYPES = [
    { value: 'pass_fail', label: 'Pass / Fail' },
    { value: 'rating_1_5', label: 'Rating (1-5)' },
    { value: 'yes_no', label: 'Yes / No' },
];

const emptyItem = () => ({ name: '', type: 'pass_fail', weight: 1 });
const emptySection = () => ({ name: '', items: [emptyItem()] });

const TemplateForm = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [sections, setSections] = useState([emptySection()]);

    useEffect(() => {
        if (!isEdit) return;
        const fetchTemplate = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`${apiBaseUrl}/templates/${id}`, config);
                setName(data.name);
                setDescription(data.description || '');
                setSections(
                    data.sections?.length
                        ? data.sections.map(s => ({
                              name: s.name,
                              items: s.items?.length
                                  ? s.items.map(i => ({ name: i.name, type: i.type, weight: i.weight ?? 1 }))
                                  : [emptyItem()],
                          }))
                        : [emptySection()],
                );
            } catch (err) {
                console.error(err);
                toast.error('Failed to load template');
                navigate('/templates');
            } finally {
                setLoading(false);
            }
        };
        fetchTemplate();
    }, [id, isEdit, user, navigate]);

    const updateSection = (sIdx, field, value) => {
        setSections(prev => prev.map((s, i) => (i === sIdx ? { ...s, [field]: value } : s)));
    };

    const addSection = () => setSections(prev => [...prev, emptySection()]);

    const removeSection = (sIdx) => {
        if (sections.length <= 1) return toast.error('At least one section is required');
        setSections(prev => prev.filter((_, i) => i !== sIdx));
    };

    const updateItem = (sIdx, iIdx, field, value) => {
        setSections(prev =>
            prev.map((s, si) =>
                si === sIdx
                    ? { ...s, items: s.items.map((item, ii) => (ii === iIdx ? { ...item, [field]: value } : item)) }
                    : s,
            ),
        );
    };

    const addItem = (sIdx) => {
        setSections(prev =>
            prev.map((s, i) => (i === sIdx ? { ...s, items: [...s.items, emptyItem()] } : s)),
        );
    };

    const removeItem = (sIdx, iIdx) => {
        if (sections[sIdx].items.length <= 1) return toast.error('At least one item per section is required');
        setSections(prev =>
            prev.map((s, si) => (si === sIdx ? { ...s, items: s.items.filter((_, ii) => ii !== iIdx) } : s)),
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) return toast.error('Template name is required');
        for (let s = 0; s < sections.length; s++) {
            if (!sections[s].name.trim()) return toast.error(`Section ${s + 1} needs a name`);
            for (let i = 0; i < sections[s].items.length; i++) {
                if (!sections[s].items[i].name.trim())
                    return toast.error(`Item ${i + 1} in "${sections[s].name}" needs a name`);
            }
        }

        setSaving(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const payload = { name: name.trim(), description: description.trim(), sections };

            if (isEdit) {
                await axios.put(`${apiBaseUrl}/templates/${id}`, payload, config);
                toast.success('Template updated successfully');
            } else {
                await axios.post(`${apiBaseUrl}/templates`, payload, config);
                toast.success('Template created successfully');
            }
            navigate('/templates');
        } catch (err) {
            console.error(err);
            toast.error(isEdit ? 'Failed to update template' : 'Failed to create template');
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return <LoadingSpinner message="Loading template..." type="three-dots" color="#3b82f6" height={60} width={60} />;

    return (
        <div className="template-form-container">
            <div className="form-header">
                <button onClick={() => navigate('/templates')} className="back-btn" type="button">
                    <ArrowLeft size={20} />
                </button>
                <h1>{isEdit ? 'Edit Template' : 'Create Template'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="template-form">
                <div className="form-group">
                    <label>Template Name</label>
                    <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Daily Facility Inspection"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        className="form-control"
                        rows="3"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what this template is used for..."
                    />
                </div>

                <div className="sections-wrapper">
                    <div className="sections-header">
                        <h2>Sections</h2>
                        <button type="button" className="btn btn-outline btn-sm" onClick={addSection}>
                            <Plus size={16} /> Add Section
                        </button>
                    </div>

                    {sections.map((section, sIdx) => (
                        <div key={sIdx} className="section-card">
                            <div className="section-title-row">
                                <GripVertical size={18} className="grip-icon" />
                                <input
                                    type="text"
                                    className="form-control section-name-input"
                                    value={section.name}
                                    onChange={(e) => updateSection(sIdx, 'name', e.target.value)}
                                    placeholder={`Section ${sIdx + 1} name (e.g., Lobby)`}
                                    required
                                />
                                <button
                                    type="button"
                                    className="icon-btn delete"
                                    onClick={() => removeSection(sIdx)}
                                    title="Remove section"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="items-list">
                                {section.items.map((item, iIdx) => (
                                    <div key={iIdx} className="item-row">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={item.name}
                                            onChange={(e) => updateItem(sIdx, iIdx, 'name', e.target.value)}
                                            placeholder={`Item name (e.g., Floor cleanliness)`}
                                            required
                                        />
                                        <select
                                            className="form-control type-select"
                                            value={item.type}
                                            onChange={(e) => updateItem(sIdx, iIdx, 'type', e.target.value)}
                                        >
                                            {ITEM_TYPES.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            className="form-control weight-input"
                                            value={item.weight}
                                            onChange={(e) => updateItem(sIdx, iIdx, 'weight', Number(e.target.value))}
                                            min="1"
                                            max="10"
                                            title="Weight"
                                        />
                                        <button
                                            type="button"
                                            className="icon-btn delete"
                                            onClick={() => removeItem(sIdx, iIdx)}
                                            title="Remove item"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => addItem(sIdx)}>
                                <Plus size={14} /> Add Item
                            </button>
                        </div>
                    ))}
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
                    <Save size={18} /> {saving ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
                </button>
            </form>

            <style>{`
                .template-form-container { padding: 20px; max-width: 900px; margin: 0 auto; }
                .form-header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
                .form-header h1 { margin: 0; }
                .back-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 5px; border-radius: 50%; }
                .back-btn:hover { background: #f1f5f9; }
                .template-form { background: white; padding: 30px; border-radius: 12px; box-shadow: var(--shadow-sm); }
                .sections-wrapper { margin-top: 24px; }
                .sections-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .sections-header h2 { margin: 0; font-size: 18px; }
                .section-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 16px; }
                .section-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
                .grip-icon { color: #94a3b8; flex-shrink: 0; }
                .section-name-input { flex: 1; font-weight: 600; }
                .items-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
                .item-row { display: flex; gap: 10px; align-items: center; }
                .item-row .form-control:first-child { flex: 1; }
                .type-select { width: 150px; flex-shrink: 0; }
                .weight-input { width: 70px; flex-shrink: 0; text-align: center; }
                .icon-btn { background: none; border: none; padding: 6px; border-radius: 4px; cursor: pointer; color: #64748b; flex-shrink: 0; }
                .icon-btn:hover { background: #f3f4f6; }
                .icon-btn.delete:hover { background: #fee2e2; color: #dc2626; }
                .btn-outline { background: white; border: 1px solid #e2e8f0; padding: 6px 14px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #475569; }
                .btn-outline:hover { background: #f1f5f9; border-color: #cbd5e1; }
                .btn-ghost { background: none; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; color: #3b82f6; }
                .btn-ghost:hover { background: #eff6ff; }
                .btn-sm { font-size: 13px; }
                .btn-block { width: 100%; margin-top: 24px; }
                @media (max-width: 640px) {
                    .item-row { flex-wrap: wrap; }
                    .type-select { width: 100%; }
                    .weight-input { width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default TemplateForm;
