import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Check } from 'lucide-react';

const BulkTicketCreate = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const { failedItems, location: locId, inspection } = location.state || {};

    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState(0);

    useEffect(() => {
        if (!failedItems || failedItems.length === 0) {
            toast.error('No failed items found');
            navigate('/inspections');
        }
    }, [failedItems, navigate]);

    const handleCreateAll = async () => {
        setCreating(true);
        let successCount = 0;

        for (const item of failedItems) {
            try {
                const ticketData = {
                    title: `Issue: ${item.name}`,
                    description: item.comment || `Failed inspection item from ${item.sectionName}: ${item.name}`,
                    location: locId,
                    inspection: inspection,
                    priority: 'high',
                    status: 'open'
                };

                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };

                await axios.post(`${apiBaseUrl}/tickets`, ticketData, config);
                successCount++;
                setCreated(successCount);
            } catch (error) {
                console.error(`Failed to create ticket for ${item.name}:`, error);
            }
        }

        setCreating(false);
        toast.success(`Created ${successCount} tickets successfully!`);
        setTimeout(() => navigate('/tickets'), 1500);
    };

    if (!failedItems) return null;

    return (
        <div className="bulk-ticket-container">
            <div className="form-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={20} />
                </button>
                <h1>Create Multiple Tickets</h1>
            </div>

            <div className="bulk-card">
                <h2>Review Failed Items</h2>
                <p>You're about to create {failedItems.length} individual tickets for the following failures:</p>

                <div className="failed-items-list">
                    {failedItems.map((item, idx) => (
                        <div key={idx} className="failed-item">
                            <div className="item-icon">
                                {created > idx ? <Check size={18} color="#10b981" /> : <span className="item-number">{idx + 1}</span>}
                            </div>
                            <div className="item-info">
                                <strong>{item.name}</strong>
                                <span className="item-section">{item.sectionName}</span>
                                {item.comment && <p className="item-comment">{item.comment}</p>}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    className="btn btn-primary btn-block"
                    onClick={handleCreateAll}
                    disabled={creating}
                >
                    {creating ? `Creating ${created}/${failedItems.length}...` : `Create ${failedItems.length} Tickets`}
                </button>
            </div>

            <style>{`
                .bulk-ticket-container {
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .form-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .back-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-muted);
                    padding: 5px;
                    border-radius: 50%;
                }
                .back-btn:hover {
                    background: #f1f5f9;
                }
                .bulk-card {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: var(--shadow-sm);
                }
                .bulk-card h2 {
                    margin: 0 0 8px 0;
                    font-size: 20px;
                }
                .bulk-card > p {
                    margin: 0 0 24px 0;
                    color: var(--text-muted);
                }
                .failed-items-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                    max-height: 400px;
                    overflow-y: auto;
                }
                .failed-item {
                    display: flex;
                    gap: 12px;
                    padding: 12px;
                    background: #fee2e2;
                    border-radius: 8px;
                }
                .item-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .item-number {
                    font-weight: 700;
                    font-size: 14px;
                    color: #ef4444;
                }
                .item-info {
                    flex: 1;
                }
                .item-info strong {
                    display: block;
                    margin-bottom: 2px;
                    color: var(--text-dark);
                }
                .item-section {
                    font-size: 12px;
                    color: var(--text-muted);
                }
                .item-comment {
                    margin: 4px 0 0 0;
                    font-size: 13px;
                    color: var(--text-light);
                    font-style: italic;
                }
            `}</style>
        </div>
    );
};

export default BulkTicketCreate;
