import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import PhotoUpload from '../components/PhotoUpload';
import CreateTicketPrompt from '../components/CreateTicketPrompt';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ImprovedInspectionWizard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id } = useParams(); // Get inspection ID if performing existing one

    const [step, setStep] = useState(1);
    const [locations, setLocations] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [inspectors, setInspectors] = useState([]); // Added for assignment

    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedInspector, setSelectedInspector] = useState(''); // Added
    const [performNow, setPerformNow] = useState(true); // Added

    const [template, setTemplate] = useState(null);
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [responses, setResponses] = useState({});
    const [showTicketPrompt, setShowTicketPrompt] = useState(null);
    const [createdTickets, setCreatedTickets] = useState([]);
    const [loading, setLoading] = useState(!!id);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !user.token) return;
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };

                if (id) {
                    // Fetch existing inspection to perform
                    const { data: inspection } = await axios.get(`${apiBaseUrl}/inspections/${id}`, config);

                    // Populate state from inspection
                    const locationId = inspection.location?._id || inspection.location;
                    const templateId = inspection.template?._id || inspection.template;

                    setSelectedLocation(locationId);
                    setSelectedTemplate(templateId);

                    // Fetch the FULL template details if we don't have them in the inspection object
                    let fullTemplate;

                    console.log('Inspection Data:', {
                        hasTemplate: !!inspection.template,
                        hasTemplateSections: !!(inspection.template && inspection.template.sections),
                        sectionsLen: inspection.sections?.length,
                        sections: inspection.sections
                    });

                    if (inspection.sections && inspection.sections.length > 0) {
                        // PRIORITIZE SNAPSHOT: Construct template from inspection snapshot
                        // Map sectionId -> _id and itemId -> _id to match Wizard expectation
                        fullTemplate = {
                            _id: templateId,
                            name: inspection.template?.name || 'Inspection',
                            sections: inspection.sections.map(s => ({
                                ...s,
                                _id: s.sectionId || s._id,
                                items: s.items.map(i => ({
                                    ...i,
                                    _id: i.itemId || i._id
                                }))
                            }))
                        };
                    } else if (inspection.template && inspection.template.sections && inspection.template.sections.length > 0) {
                        fullTemplate = inspection.template;
                    } else {
                        try {
                            const { data: tmpl } = await axios.get(`${apiBaseUrl}/templates/${templateId}`, config);
                            fullTemplate = tmpl;
                        } catch (err) {
                            console.warn('Could not fetch template details, using empty structure', err);
                            fullTemplate = { _id: templateId, name: 'Unknown Template', sections: [] };
                        }
                    }

                    setTemplate(fullTemplate);

                    // If status is pending, update to in_progress as we are starting it now
                    if (inspection.status === 'pending') {
                        try {
                            await axios.put(`${apiBaseUrl}/inspections/${id}`, { status: 'in_progress' }, config);
                            inspection.status = 'in_progress'; // Update local state
                        } catch (err) {
                            console.error('Failed to update status to in_progress', err);
                        }
                    }

                    // Map existing sections/items to responses
                    const initialResponses = {};
                    inspection.sections.forEach(section => {
                        section.items.forEach(item => {
                            initialResponses[`${section.sectionId}-${item.itemId}`] = {
                                value: item.status === 'fail' ? 'fail' : (item.score || 'pass'),
                                comment: item.comment,
                                photos: item.photos
                            };
                        });
                    });
                    setResponses(initialResponses);

                    setStep(2); // Skip to execution step
                    setLoading(false);
                } else {
                    // Fetch lists for new inspection
                    const promises = [
                        axios.get(`${apiBaseUrl}/locations`, config),
                        axios.get(`${apiBaseUrl}/templates`, config),
                    ];

                    if (user.role === 'admin' || user.role === 'sub_admin') {
                        promises.push(axios.get(`${apiBaseUrl}/users`, config));
                    }

                    const results = await Promise.all(promises);
                    setLocations(results[0].data);
                    setTemplates(results[1].data);

                    if (results[2]) {
                        setInspectors(results[2].data.filter(u => u.role === 'supervisor' || u.role === 'inspector'));
                    }
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to load data');
                setLoading(false);
            }
        };
        fetchData();
    }, [user, id]);

    const handleLocationSelect = async () => {
        if (!selectedLocation || !selectedTemplate) {
            toast.error('Please select both location and template');
            return;
        }
        const temp = templates.find(t => t._id === selectedTemplate);
        setTemplate(temp);

        if (!performNow) {
            await createAssignedInspection(temp);
        } else {
            setStep(2);
        }
    };

    const createAssignedInspection = async (temp) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const inspectionData = {
                template: selectedTemplate,
                location: selectedLocation,
                inspector: selectedInspector || user._id,
                status: 'pending', // Set to pending for assigned
                sections: temp.sections.map((section) => ({
                    sectionId: section._id,
                    name: section.name,
                    items: section.items.map((item) => ({
                        itemId: item._id,
                        name: item.name,
                        score: null,
                        comment: '',
                        status: 'pass', // Default status
                    })),
                })),
                totalScore: 0,
            };

            await axios.post(`${apiBaseUrl}/inspections`, inspectionData, config);
            toast.success('Inspection assigned successfully!');
            navigate('/inspections');
        } catch (error) {
            console.error(error);
            toast.error('Failed to assign inspection');
        }
    };

    const handleItemResponse = (sectionId, itemId, value, comment = '', photos = []) => {
        setResponses({
            ...responses,
            [`${sectionId}-${itemId}`]: { value, comment, photos }
        });

        // Check if item failed
        if (value === 'fail' || (typeof value === 'number' && value < 3)) {
            const section = template.sections.find(s => s._id === sectionId);
            const item = section.items.find(i => i._id === itemId);
            setShowTicketPrompt({ item, section, itemId, sectionId });
        }
    };

    const handleCreateTicket = async (ticketData) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.post(`${apiBaseUrl}/tickets`, ticketData, config);
            setCreatedTickets([...createdTickets, data]);
            toast.success('Ticket created!');
            setShowTicketPrompt(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to create ticket');
        }
    };

    const goToNextSection = () => {
        if (currentSectionIndex < template.sections.length - 1) {
            setCurrentSectionIndex(currentSectionIndex + 1);
        } else {
            setStep(3);
        }
    };

    const goToPreviousSection = () => {
        if (currentSectionIndex > 0) {
            setCurrentSectionIndex(currentSectionIndex - 1);
        }
    };

    const calculateScore = () => {
        let totalWeight = 0;
        let earnedWeight = 0;

        template.sections.forEach(section => {
            section.items.forEach(item => {
                const response = responses[`${section._id}-${item._id}`];
                totalWeight += item.weight || 1;

                if (response) {
                    if (response.value === 'pass' || response.value === 'yes') {
                        earnedWeight += item.weight || 1;
                    } else if (typeof response.value === 'number') {
                        earnedWeight += ((response.value / 5) * (item.weight || 1));
                    }
                }
            });
        });

        return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
    };

    const getScoreColor = (score) => {
        if (score >= 90) return '#10b981';
        if (score >= 75) return '#f59e0b';
        return '#ef4444';
    };

    const handleSubmit = async () => {
        try {
            const sections = template.sections.map(section => ({
                sectionId: section._id,
                name: section.name,
                items: section.items.map(item => {
                    const response = responses[`${section._id}-${item._id}`] || {};
                    return {
                        itemId: item._id,
                        name: item.name,
                        score: typeof response.value === 'number' ? response.value : null,
                        status: response.value === 'pass' || response.value === 'yes' ? 'pass' : 'fail',
                        comment: response.comment || '',
                        photos: response.photos || [],
                    };
                }),
            }));

            const inspectionData = {
                template: selectedTemplate,
                location: selectedLocation,
                inspector: user._id,
                sections,
                totalScore: calculateScore(),
                status: 'completed',
            };

            const config = { headers: { Authorization: `Bearer ${user.token}` } };

            if (id) {
                await axios.put(`${apiBaseUrl}/inspections/${id}`, inspectionData, config);
                toast.success('Inspection completed successfully!');
            } else {
                await axios.post(`${apiBaseUrl}/inspections`, inspectionData, config);
                toast.success('Inspection submitted successfully!');
            }

            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            console.error('Inspection submission error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Submission failed';
            toast.error(errorMessage);
        }
    };

    const wizardStyles = `
        .wizard-container { 
            padding: 24px; 
            max-width: 900px; 
            margin: 0 auto;
            min-height: calc(100vh - 100px);
        }
        
        .wizard-header {
            text-align: center;
            margin-bottom: 32px;
        }
        
        .wizard-header h1 {
            font-size: 32px;
            font-weight: 700;
            color: var(--text-dark);
            margin: 0 0 8px 0;
        }
        
        .wizard-header .subtitle {
            font-size: 16px;
            color: var(--text-muted);
            margin: 0;
        }
        
        .wizard-card {
            background: white;
            padding: 32px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .loading-card {
            background: white;
            padding: 48px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e2e8f0;
            border-top-color: var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .loading-card p {
            font-size: 16px;
            color: var(--text-muted);
            margin: 0;
        }

        /* Mobile Optimizations */
        @media (max-width: 768px) {
            .wizard-container {
                padding: 16px;
                min-height: calc(100vh - 80px);
            }
            
            .wizard-card {
                padding: 20px;
                border-radius: 12px;
            }
            
            .wizard-header h1 {
                font-size: 24px;
            }
            
            .section-header {
                font-size: 18px;
                padding: 16px;
            }
            
            .item-card {
                padding: 16px;
                margin-bottom: 12px;
            }
            
            .score-buttons {
                flex-direction: column;
                gap: 8px;
            }
            
            .score-btn {
                width: 100%;
                padding: 16px;
                font-size: 16px;
            }
            
            .navigation-buttons {
                flex-direction: column-reverse;
                gap: 12px;
            }
            
            .navigation-buttons button {
                width: 100%;
                padding: 14px;
                font-size: 16px;
            }
            
            .photo-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
            
            .comment-textarea {
                min-height: 100px;
                font-size: 16px; /* Prevents zoom on iOS */
            }
        }
        
        .form-group {
            margin-bottom: 24px;
        }
        
        .form-group label {
            display: block;
            font-weight: 600;
            font-size: 14px;
            color: var(--text-dark);
            margin-bottom: 8px;
        }
        
        .form-group select {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 15px;
            color: var(--text-dark);
            transition: all 0.2s;
            background: white;
        }
        
        .form-group select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .btn {
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        
        .btn-outline {
            background: white !important;
            color: #475569 !important;
            border: 2px solid #e2e8f0 !important;
        }
        
        .btn-outline:hover {
            border-color: #3b82f6 !important;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            color: white !important;
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3) !important;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            color: white !important;
            border: 2px solid transparent !important;
            box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3) !important;
        }
        
        .btn-primary:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
            box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4) !important;
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #64748b 0%, #475569 100%) !important;
            color: white !important;
            border: 2px solid transparent !important;
            box-shadow: 0 4px 6px -1px rgba(100, 116, 139, 0.3) !important;
        }
        
        .btn-secondary:hover {
            background: linear-gradient(135deg, #475569 0%, #334155 100%) !important;
            box-shadow: 0 6px 12px rgba(100, 116, 139, 0.4) !important;
        }
        
        .progress-bar { 
            height: 10px;
            background: #e2e8f0;
            border-radius: 999px;
            margin-bottom: 32px;
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
        }
        
        .progress-fill { 
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #2563eb);
            transition: width 0.4s ease;
            border-radius: 999px;
        }
        
        .section-info { 
            margin-bottom: 32px;
            padding-bottom: 16px;
            border-bottom: 2px solid #f1f5f9;
        }
        
        .section-info h2 { 
            margin: 0 0 8px 0;
            font-size: 26px;
            font-weight: 700;
            color: var(--text-dark);
        }
        
        .section-count { 
            font-size: 14px;
            font-weight: 500;
            color: var(--text-muted);
            background: #f1f5f9;
            padding: 4px 12px;
            border-radius: 12px;
            display: inline-block;
        }
        
        .items-list { 
            display: flex;
            flex-direction: column;
            gap: 24px;
            margin-bottom: 32px;
        }
        
        .item-card { 
            background: white;
            padding: 24px;
            border-radius: 14px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
            border: 2px solid #f1f5f9;
            transition: all 0.2s;
        }
        
        .item-card:hover {
            border-color: #e2e8f0;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
        }
        
        .item-card h4 { 
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-dark);
        }
        
        .item-desc { 
            font-size: 14px;
            color: var(--text-muted);
            margin: 0 0 16px 0;
            line-height: 1.6;
        }
        
        .item-controls { 
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .button-group, .rating-group { 
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .button-group .btn {
            flex: 1;
            min-width: 120px;
            padding: 12px 20px;
            font-weight: 600;
            border: 2px solid #e2e8f0 !important;
            background: white !important;
            color: #475569 !important;
            transition: all 0.2s;
        }
        
        .button-group .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            border-color: #3b82f6 !important;
            color: white !important;
        }
        
        .button-group .btn.btn-success-active { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
            color: white !important;
            border-color: #10b981 !important;
            box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3) !important;
        }
        
        .button-group .btn.btn-danger-active { 
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
            color: white !important;
            border-color: #ef4444 !important;
            box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3) !important;
        }
        
        .button-group .btn.btn-success-active:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
            box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4) !important;
        }
        
        .button-group .btn.btn-danger-active:hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
            box-shadow: 0 6px 12px rgba(239, 68, 68, 0.4) !important;
        }
        
        .rating-btn { 
            padding: 12px 20px;
            border: 2px solid #e2e8f0 !important;
            background: white !important;
            color: #475569 !important;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 600;
            font-size: 16px;
            min-width: 50px;
        }
        
        .rating-btn:hover {
            border-color: #3b82f6 !important;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            color: white !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3) !important;
        }
        
        .rating-btn.active { 
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            color: white !important;
            border-color: #3b82f6 !important;
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3) !important;
        }
        
        .item-controls textarea {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            font-size: 14px;
            font-family: inherit;
            color: var(--text-dark);
            transition: all 0.2s;
            resize: vertical;
        }
        
        .item-controls textarea:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .wizard-actions { 
            display: flex;
            gap: 16px;
            justify-content: space-between;
            margin-top: 32px;
        }
        
        .wizard-actions .btn {
            padding: 14px 28px;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }
        
        .wizard-actions .btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        
        .wizard-actions .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .review-header { 
            text-align: center;
            padding: 48px 32px;
            background: white;
            border-radius: 16px;
            border-left: 6px solid;
            margin-bottom: 32px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .review-header h1 {
            margin: 16px 0;
            font-size: 32px;
            font-weight: 700;
        }
        
        .score-display { 
            display: inline-block;
            padding: 20px 40px;
            border-radius: 999px;
            color: white;
            font-size: 42px;
            font-weight: 700;
            margin-top: 24px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        
        .tickets-created { 
            background: linear-gradient(135deg, #f0fdf4, #dcfce7);
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 32px;
            border-left: 4px solid #10b981;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
        }
        
        .tickets-created h3 { 
            margin: 0 0 16px 0;
            font-size: 18px;
            font-weight: 600;
            color: #166534;
        }
        
        .ticket-item { 
            padding: 12px 16px;
            background: white;
            border-radius: 8px;
            margin-bottom: 10px;
            font-size: 14px;
            border: 1px solid #bbf7d0;
            transition: all 0.2s;
        }
        
        .ticket-item:hover {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            transform: translateX(4px);
        }
        
        .ticket-item:last-child {
            margin-bottom: 0;
        }
    `;

    if (loading) {
        return (
            <div className="wizard-container">
                <LoadingSpinner message="Loading inspection data..." type="tail-spin" color="#3b82f6" height={80} width={80} />
                <style>{wizardStyles}</style>
            </div>
        );
    }

    if (step === 1) {
        return (
            <div className="wizard-container">
                <div className="wizard-header">
                    <h1>Start New Inspection</h1>
                    <p className="subtitle">Select a location and template to begin</p>
                </div>
                <div className="wizard-card">
                    <div className="form-group">
                        <label>Select Location</label>
                        <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                            <option value="">Choose a location...</option>
                            {locations.map(loc => (
                                <option key={loc._id} value={loc._id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Select Template</label>
                        <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                            <option value="">Choose a template...</option>
                            {templates.map(temp => (
                                <option key={temp._id} value={temp._id}>{temp.name}</option>
                            ))}
                        </select>
                    </div>

                    {(user.role === 'admin' || user.role === 'sub_admin') && (
                        <>
                            <div className="form-group">
                                <label>Assign Inspector (Optional)</label>
                                <select
                                    value={selectedInspector}
                                    onChange={(e) => {
                                        setSelectedInspector(e.target.value);
                                        if (e.target.value) setPerformNow(false);
                                    }}
                                >
                                    <option value="">Myself</option>
                                    {inspectors.map(u => (
                                        <option key={u._id} value={u._id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                    type="checkbox"
                                    id="performNow"
                                    checked={performNow}
                                    onChange={(e) => setPerformNow(e.target.checked)}
                                    style={{ width: '20px', height: '20px' }}
                                />
                                <div>
                                    <label htmlFor="performNow" style={{ margin: 0 }}>Perform Inspection Now</label>
                                    <small style={{ display: 'block', color: '#64748b' }}>
                                        {performNow ? 'Inspection will start immediately.' : 'Inspection will be created as "In Progress".'}
                                    </small>
                                </div>
                            </div>
                        </>
                    )}

                    <button className="btn btn-primary" onClick={handleLocationSelect}>
                        {performNow ? <>{'Continue'} <ChevronRight size={18} /></> : <>{'Assign Inspection'} <CheckCircle size={18} /></>}
                    </button>
                </div>
                <style>{wizardStyles}</style>
            </div>
        );
    }

    if (step === 2 && template) {
        if (!template.sections || template.sections.length === 0) {
            return (
                <div className="wizard-container">
                    <div className="loading-card">
                        <p>Error: This inspection has no sections to perform.</p>
                        <button className="btn btn-secondary" onClick={() => navigate('/inspections')} style={{ marginTop: '16px' }}>
                            Go Back
                        </button>
                    </div>
                    <style>{wizardStyles}</style>
                </div>
            );
        }

        const currentSection = template.sections[currentSectionIndex];
        if (!currentSection) {
            return <div>Error loading section data.</div>;
        }

        const progress = Math.round(((currentSectionIndex + 1) / template.sections.length) * 100);

        return (
            <div className="wizard-container">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="section-info">
                    <h2>{currentSection.name}</h2>
                    <span className="section-count">Section {currentSectionIndex + 1} of {template.sections.length}</span>
                </div>

                <div className="items-list">
                    {currentSection.items.map(item => {
                        const responseKey = `${currentSection._id}-${item._id}`;
                        const currentResponse = responses[responseKey] || {};

                        return (
                            <div key={item._id} className="item-card">
                                <h4>{item.name}</h4>
                                {item.description && <p className="item-desc">{item.description}</p>}

                                <div className="item-controls">
                                    {item.type === 'pass_fail' && (
                                        <div className="button-group">
                                            <button
                                                className={`btn ${currentResponse.value === 'pass' ? 'btn-success-active' : 'btn-outline'}`}
                                                onClick={() => handleItemResponse(currentSection._id, item._id, 'pass')}
                                            >
                                                Pass
                                            </button>
                                            <button
                                                className={`btn ${currentResponse.value === 'fail' ? 'btn-danger-active' : 'btn-outline'}`}
                                                onClick={() => handleItemResponse(currentSection._id, item._id, 'fail')}
                                            >
                                                Fail
                                            </button>
                                        </div>
                                    )}

                                    {item.type === 'rating_1_5' && (
                                        <div className="rating-group">
                                            {[1, 2, 3, 4, 5].map(num => (
                                                <button
                                                    key={num}
                                                    className={`rating-btn ${currentResponse.value === num ? 'active' : ''}`}
                                                    onClick={() => handleItemResponse(currentSection._id, item._id, num)}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <textarea
                                        placeholder="Add comment (optional)"
                                        value={currentResponse.comment || ''}
                                        onChange={(e) => handleItemResponse(currentSection._id, item._id, currentResponse.value, e.target.value, currentResponse.photos)}
                                        rows="2"
                                    />

                                    <PhotoUpload
                                        existingPhotos={currentResponse.photos || []}
                                        onPhotosUploaded={(photos) => handleItemResponse(currentSection._id, item._id, currentResponse.value, currentResponse.comment, photos)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="wizard-actions">
                    <button className="btn btn-secondary" onClick={goToPreviousSection} disabled={currentSectionIndex === 0}>
                        <ChevronLeft size={18} /> Previous
                    </button>
                    <button className="btn btn-primary" onClick={goToNextSection}>
                        {currentSectionIndex === template.sections.length - 1 ? 'Review' : 'Next'} <ChevronRight size={18} />
                    </button>
                </div>

                {showTicketPrompt && (
                    <CreateTicketPrompt
                        item={showTicketPrompt.item}
                        inspection={{ location: selectedLocation, _id: 'pending' }}
                        onCreateTicket={handleCreateTicket}
                        onSkip={() => setShowTicketPrompt(null)}
                    />
                )}
                <style>{wizardStyles}</style>
            </div>
        );
    }

    if (step === 3) {
        const score = calculateScore();
        const scoreColor = getScoreColor(score);

        return (
            <div className="wizard-container">
                <div className="review-header" style={{ borderColor: scoreColor }}>
                    <CheckCircle size={48} color={scoreColor} />
                    <h1>Inspection Complete</h1>
                    <div className="score-display" style={{ background: scoreColor }}>
                        {score}%
                    </div>
                </div>

                {createdTickets.length > 0 && (
                    <div className="tickets-created">
                        <h3>{createdTickets.length} Ticket(s) Created</h3>
                        {createdTickets.map(ticket => (
                            <div key={ticket._id} className="ticket-item">{ticket.title}</div>
                        ))}
                    </div>
                )}

                <div className="wizard-actions">
                    <button className="btn btn-secondary" onClick={() => setStep(2)}>
                        <ChevronLeft size={18} /> Back to Edit
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmit}>
                        Submit Inspection
                    </button>
                </div>

                <style>{wizardStyles}</style>
            </div>
        );
    }

    if (step === 2 && !template) {
        return (
            <div className="wizard-container">
                <div className="loading-card">
                    <p>Error: Could not load inspection template data.</p>
                    <button className="btn btn-secondary" onClick={() => navigate('/inspections')} style={{ marginTop: '16px' }}>
                        Go Back
                    </button>
                </div>
                <style>{wizardStyles}</style>
            </div>
        );
    }

    return null;
};

export default ImprovedInspectionWizard;
