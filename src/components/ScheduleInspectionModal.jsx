import { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import toast from 'react-hot-toast';
import { X, Calendar } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const ScheduleInspectionModal = ({ inspection, onClose, onSuccess }) => {
    const { user } = useContext(AuthContext);
    const [scheduledDate, setScheduledDate] = useState(
        inspection.scheduledDate ? new Date(inspection.scheduledDate).toISOString().slice(0, 16) : ''
    );
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            await axios.patch(`${apiBaseUrl}/inspections/${inspection._id}/schedule`,
                { scheduledDate, status: 'pending' },
                config
            );
            toast.success('Inspection scheduled successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to schedule inspection');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><Calendar size={20} /> Schedule Inspection</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {loading && (
                            <div style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                                <LoadingSpinner message="Scheduling inspection..." type="tail-spin" color="#3b82f6" height={30} width={30} />
                            </div>
                        )}
                        <p className="inspection-title">Location: {inspection.location?.name}</p>
                        <div className="form-group">
                            <label>Scheduled Date & Time</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <LoadingSpinner type="tail-spin" color="white" height={16} width={16} />
                                    Scheduling...
                                </span>
                            ) : 'Schedule Inspection'}
                        </button>
                    </div>
                </form>

                <style>{`
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    }
                    .modal-content {
                        background: white;
                        border-radius: 12px;
                        width: 90%;
                        max-width: 500px;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    }
                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .modal-header h2 {
                        margin: 0;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .close-btn {
                        background: none;
                        border: none;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                    }
                    .close-btn:hover {
                        background: #f3f4f6;
                    }
                    .modal-body {
                        padding: 20px;
                    }
                    .inspection-title {
                        font-weight: 600;
                        margin-bottom: 16px;
                        color: var(--text-dark);
                    }
                    .modal-footer {
                        padding: 16px 20px;
                        border-top: 1px solid #e5e7eb;
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default ScheduleInspectionModal;
