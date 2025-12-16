import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const CreateTicketPrompt = ({ item, inspection, onCreateTicket, onSkip }) => {
    const [creating, setCreating] = useState(false);
    const [ticketData, setTicketData] = useState({
        title: `${item.name} - Issue`,
        category: 'Cleaning',
        priority: 'medium',
        description: item.comment || 'Issue found during inspection'
    });

    const handleCreate = async () => {
        setCreating(true);
        await onCreateTicket({
            ...ticketData,
            location: inspection.location,
            relatedInspection: inspection._id,
            inspectionItem: item.name
        });
        setCreating(false);
    };

    return (
        <div className="ticket-prompt-overlay">
            <div className="ticket-prompt">
                <div className="prompt-header">
                    <AlertTriangle size={24} color="#f59e0b" />
                    <h3>Create Ticket for This Issue?</h3>
                </div>

                <div className="item-info">
                    <strong>{item.name}</strong>
                    {item.comment && <p>{item.comment}</p>}
                </div>

                <div className="form-group">
                    <label>Title</label>
                    <input
                        type="text"
                        value={ticketData.title}
                        onChange={(e) => setTicketData({ ...ticketData, title: e.target.value })}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Category</label>
                        <select
                            value={ticketData.category}
                            onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                        >
                            <option value="Cleaning">Cleaning</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Safety">Safety</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Priority</label>
                        <select
                            value={ticketData.priority}
                            onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value })}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        value={ticketData.description}
                        onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                        rows="3"
                    />
                </div>

                <div className="prompt-actions">
                    <button className="btn btn-secondary" onClick={onSkip} disabled={creating}>
                        Skip
                    </button>
                    <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                        {creating ? 'Creating...' : 'Create Ticket'}
                    </button>
                </div>
            </div>

            <style>{`
        .ticket-prompt-overlay {
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
        .ticket-prompt {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
        .prompt-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        .prompt-header h3 {
          margin: 0;
          font-size: 18px;
        }
        .item-info {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .item-info strong {
          display: block;
          margin-bottom: 4px;
        }
        .item-info p {
          margin: 0;
          color: var(--text-muted);
          font-size: 14px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          font-size: 14px;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }
        .prompt-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }
      `}</style>
        </div>
    );
};

export default CreateTicketPrompt;
