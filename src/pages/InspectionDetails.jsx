import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, Download, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';

const InspectionDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [inspection, setInspection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showBulkModal, setShowBulkModal] = useState(false);

    useEffect(() => {
        const fetchInspection = async () => {
            if (!user || !user.token) return;
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                const { data } = await axios.get(`http://localhost:5000/api/inspections/${id}`, config);
                setInspection(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load inspection details');
                setLoading(false);
            }
        };
        fetchInspection();
    }, [id, user]);

    const handleDownloadPDF = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob',
            };
            const { data } = await axios.get(`http://localhost:5000/api/inspections/${id}/pdf`, config);

            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inspection-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('PDF downloaded!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to download PDF');
        }
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'bg-green-100 text-green-800';
        if (score >= 75) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getAllFailedItems = () => {
        if (!inspection) return [];
        const failedItems = [];
        inspection.sections?.forEach(section => {
            section.items?.forEach(item => {
                if (item.status === 'fail') {
                    failedItems.push({ ...item, sectionName: section.name });
                }
            });
        });
        return failedItems;
    };

    const handleCreateCollectiveTicket = () => {
        const failedItems = getAllFailedItems();
        const title = `Multiple Issues - ${inspection.location?.name}`;
        const description = failedItems.map((item, idx) =>
            `${idx + 1}. ${item.sectionName} - ${item.name}: ${item.comment || 'Failed'}`
        ).join('\n');

        navigate('/tickets/new', {
            state: {
                title,
                description,
                location: inspection.location?._id,
                inspection: inspection._id,
                priority: 'high'
            }
        });
        setShowBulkModal(false);
    };

    const handleCreateSeparateTickets = () => {
        const failedItems = getAllFailedItems();
        navigate('/tickets/bulk', {
            state: {
                failedItems,
                location: inspection.location?._id,
                inspection: inspection._id
            }
        });
        setShowBulkModal(false);
    };

    if (loading) return <div className="p-8 text-center">Loading details...</div>;
    if (!inspection) return <div className="p-8 text-center">Inspection not found</div>;

    return (
        <div className="details-container">
            <div className="page-header">
                <Link to="/inspections" className="back-link">
                    <ArrowLeft size={18} /> Back to Inspections
                </Link>
                <div className="header-actions">
                    {(user?.role === 'admin' || user?.role === 'sub_admin') && getAllFailedItems().length > 1 && (
                        <button onClick={() => setShowBulkModal(true)} className="btn btn-secondary">
                            Create Tickets ({getAllFailedItems().length} failures)
                        </button>
                    )}
                    <button onClick={handleDownloadPDF} className="btn btn-primary">
                        <Download size={18} /> Download PDF
                    </button>
                </div>
            </div>

            <div className="details-card">
                <div className="header-section">
                    <div>
                        <h1>{inspection.location?.name || 'Unknown Location'}</h1>
                        <p className="subtitle">
                            <Calendar size={14} /> {new Date(inspection.createdAt).toLocaleDateString()} •
                            <User size={14} /> {inspection.inspector?.name || 'Unknown'}
                        </p>
                    </div>
                    <div className={`score-badge ${getScoreColor(inspection.totalScore)}`}>
                        {inspection.totalScore}%
                    </div>
                </div>

                <div className="summary-section">
                    <h3>Summary</h3>
                    <p>{inspection.summaryComment || 'No summary provided.'}</p>
                </div>

                <div className="sections-list">
                    {inspection.sections?.map((section, idx) => (
                        <div key={idx} className="section-item">
                            <h3>{section.name}</h3>
                            <div className="items-grid">
                                {section.items?.map((item, itemIdx) => (
                                    <div key={itemIdx} className={`item-row ${item.status}`}>
                                        <div className="item-name">
                                            <span className={`status-dot ${item.status}`}></span>
                                            {item.name}
                                        </div>
                                        <div className="item-details">
                                            {item.score && <span className="item-score">{item.score}/5</span>}
                                            {item.comment && <span className="item-comment">{item.comment}</span>}
                                            {item.status === 'fail' && (user?.role === 'admin' || user?.role === 'sub_admin') && (
                                                <button
                                                    className="create-ticket-btn"
                                                    onClick={() => {
                                                        navigate('/tickets/new', {
                                                            state: {
                                                                title: `Issue: ${item.name}`,
                                                                description: item.comment || `Failed inspection item: ${item.name}`,
                                                                location: inspection.location?._id,
                                                                inspection: inspection._id,
                                                                priority: 'high'
                                                            }
                                                        });
                                                    }}
                                                >
                                                    Create Ticket
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showBulkModal && (
                <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Create Tickets for Failures</h2>
                        <p>You have {getAllFailedItems().length} failed items. How would you like to create tickets?</p>

                        <div className="modal-options">
                            <button
                                className="option-btn collective"
                                onClick={handleCreateCollectiveTicket}
                            >
                                <div className="option-icon">📋</div>
                                <div className="option-details">
                                    <h3>One Collective Ticket</h3>
                                    <p>Create a single ticket listing all {getAllFailedItems().length} failures</p>
                                </div>
                            </button>

                            <button
                                className="option-btn separate"
                                onClick={handleCreateSeparateTickets}
                            >
                                <div className="option-icon">📝</div>
                                <div className="option-details">
                                    <h3>Separate Tickets</h3>
                                    <p>Create {getAllFailedItems().length} individual tickets for each failure</p>
                                </div>
                            </button>
                        </div>

                        <button className="modal-close" onClick={() => setShowBulkModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

            <style>{`
                .details-container { max-width: 800px; margin: 0 auto; padding: 20px; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .back-link { display: flex; align-items: center; gap: 8px; color: var(--text-muted); text-decoration: none; font-weight: 500; }
                .back-link:hover { color: var(--primary-color); }
                .details-card { background: white; border-radius: 12px; box-shadow: var(--shadow-sm); overflow: hidden; }
                .header-section { padding: 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start; }
                .header-section h1 { margin: 0 0 8px 0; font-size: 24px; }
                .subtitle { display: flex; align-items: center; gap: 12px; color: var(--text-muted); font-size: 14px; margin: 0; }
                .score-badge { padding: 8px 16px; border-radius: 20px; font-size: 24px; font-weight: 700; }
                .bg-green-100 { background: #dcfce7; color: #166534; }
                .bg-yellow-100 { background: #fef3c7; color: #92400e; }
                .bg-red-100 { background: #fee2e2; color: #991b1b; }
                .summary-section { padding: 24px; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
                .summary-section h3 { margin: 0 0 8px 0; font-size: 16px; }
                .summary-section p { margin: 0; color: var(--text-light); }
                .sections-list { padding: 24px; }
                .section-item { margin-bottom: 24px; }
                .section-item h3 { margin: 0 0 12px 0; font-size: 18px; color: var(--text-dark); border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }
                .items-grid { display: grid; gap: 12px; }
                .item-row { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-radius: 6px; }
                .item-row.fail { background: #fee2e2; }
                .item-name { display: flex; align-items: center; gap: 8px; font-weight: 500; }
                .status-dot { width: 8px; height: 8px; border-radius: 50%; }
                .status-dot.pass { background: #10b981; }
                .status-dot.fail { background: #ef4444; }
                .item-details { display: flex; align-items: center; gap: 12px; }
                .item-score { font-weight: 600; color: var(--text-light); }
                .item-comment { font-size: 13px; color: var(--text-muted); font-style: italic; }
                .create-ticket-btn {
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-left: 12px;
                    transition: background 0.2s;
                }
                .create-ticket-btn:hover { background: #dc2626; }
                .header-actions { display: flex; gap: 12px; align-items: center; }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }
                .modal-content h2 {
                    margin: 0 0 12px 0;
                    font-size: 24px;
                    color: var(--text-dark);
                }
                .modal-content > p {
                    margin: 0 0 24px 0;
                    color: var(--text-muted);
                }
                .modal-options {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .option-btn {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                }
                .option-btn:hover {
                    border-color: var(--primary-color);
                    background: #f8fafc;
                    transform: translateY(-2px);
                }
                .option-icon {
                    font-size: 32px;
                }
                .option-details h3 {
                    margin: 0 0 4px 0;
                    font-size: 16px;
                    color: var(--text-dark);
                }
                .option-details p {
                    margin: 0;
                    font-size: 13px;
                    color: var(--text-muted);
                }
                .modal-close {
                    width: 100%;
                    padding: 12px;
                    background: #f1f5f9;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .modal-close:hover {
                    background: #e2e8f0;
                }
            `}</style>
        </div>
    );
};

export default InspectionDetails;
