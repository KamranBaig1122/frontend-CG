import { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import toast from 'react-hot-toast';
import { X, User } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const AssignTicketModal = ({ ticket, onClose, onSuccess, users }) => {
    const { user } = useContext(AuthContext);
    const [assignedTo, setAssignedTo] = useState(ticket.assignedTo?._id || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            await axios.patch(`${apiBaseUrl}/tickets/${ticket._id}/assign`,
                { assignedTo },
                config
            );
            toast.success('Ticket assigned successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to assign ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><User size={20} /> Assign Ticket</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {loading && (
                            <div style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                                <LoadingSpinner message="Assigning ticket..." type="tail-spin" color="#3b82f6" height={30} width={30} />
                            </div>
                        )}
                        <p className="ticket-title">{ticket.title}</p>
                        <div className="form-group">
                            <label>Assign To</label>
                            <select
                                className="form-control"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                required
                                disabled={loading}
                            >
                                <option value="">Select Supervisor</option>
                                {users.filter(u => u.role === 'supervisor').map(u => (
                                    <option key={u._id} value={u._id}>{u.name}</option>
                                ))}
                            </select>
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
                                    Assigning...
                                </span>
                            ) : 'Assign Ticket'}
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
                    .ticket-title {
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

export default AssignTicketModal;
