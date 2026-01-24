import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle, Camera, ArrowRight, ArrowLeft } from 'lucide-react';

const InspectionWizard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [locations, setLocations] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [inspectionData, setInspectionData] = useState({ sections: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !user.token) return;
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                console.log('Fetching data...');
                const locRes = await axios.get(`${apiBaseUrl}/locations`, config);
                const tempRes = await axios.get(`${apiBaseUrl}/templates`, config);
                console.log('Locations:', locRes.data);
                console.log('Templates:', tempRes.data);
                setLocations(locRes.data);
                setTemplates(tempRes.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load data');
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handleTemplateSelect = (templateId) => {
        const template = templates.find(t => t._id === templateId);
        setSelectedTemplate(template);
        // Initialize inspection data structure based on template
        const initialSections = template.sections.map(section => ({
            sectionId: section._id,
            name: section.name,
            items: section.items.map(item => ({
                itemId: item._id,
                name: item.name,
                score: null,
                comment: '',
                photos: [],
                status: 'pass'
            }))
        }));
        setInspectionData({ sections: initialSections });
    };

    const handleItemChange = (sectionIndex, itemIndex, field, value) => {
        const newSections = [...inspectionData.sections];
        newSections[sectionIndex].items[itemIndex][field] = value;

        // Auto-fail if score is bad (example logic)
        if (field === 'score' && value === 'fail') {
            newSections[sectionIndex].items[itemIndex].status = 'fail';
        }

        setInspectionData({ ...inspectionData, sections: newSections });
    };

    const calculateScore = () => {
        let totalItems = 0;
        let passedItems = 0;

        inspectionData.sections.forEach(section => {
            section.items.forEach(item => {
                totalItems++;
                if (item.status === 'pass') passedItems++;
            });
        });

        return totalItems === 0 ? 0 : Math.round((passedItems / totalItems) * 100);
    };

    const handleSubmit = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };

            const payload = {
                template: selectedTemplate._id,
                location: selectedLocation,
                sections: inspectionData.sections,
                totalScore: calculateScore(),
                status: 'completed',
                summaryComment: 'Inspection completed via Wizard'
            };

            await axios.post(`${apiBaseUrl}/inspections`, payload, config);
            toast.success('Inspection submitted successfully!');
            navigate('/');
        } catch (error) {
            toast.error('Failed to submit inspection');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading wizard...</div>;

    return (
        <div className="wizard-container">
            <div className="wizard-header">
                <h1>New Inspection</h1>
                <div className="step-indicator">Step {step} of 3</div>
            </div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="wizard-content"
            >
                {step === 1 && (
                    <div className="step-content">
                        <h2>Select Location & Template</h2>
                        <div className="form-group">
                            <label>Location</label>
                            <select
                                className="form-control"
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                            >
                                <option value="">Select a location...</option>
                                {locations.map(loc => (
                                    <option key={loc._id} value={loc._id}>{loc.name} ({loc.type})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Template</label>
                            <div className="template-grid">
                                {templates.map(temp => (
                                    <div
                                        key={temp._id}
                                        className={`template-card ${selectedTemplate?._id === temp._id ? 'selected' : ''}`}
                                        onClick={() => handleTemplateSelect(temp._id)}
                                    >
                                        <h3>{temp.name}</h3>
                                        <p>{temp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            disabled={!selectedLocation || !selectedTemplate}
                            onClick={() => setStep(2)}
                        >
                            Start Inspection <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-content">
                        <h2>{selectedTemplate.name}</h2>
                        {inspectionData.sections.map((section, sIndex) => (
                            <div key={sIndex} className="inspection-section">
                                <h3>{section.name}</h3>
                                {section.items.map((item, iIndex) => (
                                    <div key={iIndex} className="inspection-item">
                                        <div className="item-header">
                                            <span>{item.name}</span>
                                            <div className="status-toggles">
                                                <button
                                                    className={`status-btn pass ${item.status === 'pass' ? 'active' : ''}`}
                                                    onClick={() => handleItemChange(sIndex, iIndex, 'status', 'pass')}
                                                >
                                                    Pass
                                                </button>
                                                <button
                                                    className={`status-btn fail ${item.status === 'fail' ? 'active' : ''}`}
                                                    onClick={() => handleItemChange(sIndex, iIndex, 'status', 'fail')}
                                                >
                                                    Fail
                                                </button>
                                            </div>
                                        </div>
                                        {item.status === 'fail' && (
                                            <div className="failure-details">
                                                <input
                                                    type="text"
                                                    placeholder="Describe the issue..."
                                                    className="form-control"
                                                    value={item.comment}
                                                    onChange={(e) => handleItemChange(sIndex, iIndex, 'comment', e.target.value)}
                                                />
                                                <button className="btn-icon">
                                                    <Camera size={18} /> Add Photo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}

                        <div className="wizard-actions">
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>
                                <ArrowLeft size={18} /> Back
                            </button>
                            <button className="btn btn-primary" onClick={() => setStep(3)}>
                                Review <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-content">
                        <h2>Summary</h2>
                        <div className="score-card">
                            <div className="score-circle">
                                {calculateScore()}%
                            </div>
                            <p>Overall Score</p>
                        </div>

                        <div className="wizard-actions">
                            <button className="btn btn-secondary" onClick={() => setStep(2)}>
                                <ArrowLeft size={18} /> Back
                            </button>
                            <button className="btn btn-success" onClick={handleSubmit}>
                                Submit Inspection <CheckCircle size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>

            <style>{`
        .wizard-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .wizard-header {
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .step-indicator {
          background: var(--primary-light);
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 14px;
        }
        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 10px;
        }
        .template-card {
          border: 2px solid #e2e8f0;
          padding: 15px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .template-card.selected {
          border-color: var(--primary-color);
          background: #eff6ff;
        }
        .inspection-section {
          background: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
        }
        .inspection-item {
          border-bottom: 1px solid #f1f5f9;
          padding: 15px 0;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .status-toggles {
          display: flex;
          gap: 10px;
        }
        .status-btn {
          padding: 5px 15px;
          border-radius: 20px;
          border: 1px solid #cbd5e1;
          background: white;
          cursor: pointer;
        }
        .status-btn.pass.active {
          background: var(--success-color);
          color: white;
          border-color: var(--success-color);
        }
        .status-btn.fail.active {
          background: var(--danger-color);
          color: white;
          border-color: var(--danger-color);
        }
        .failure-details {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        .wizard-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        .score-card {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        .score-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          margin: 0 auto 10px;
        }
      `}</style>
        </div>
    );
};

export default InspectionWizard;
