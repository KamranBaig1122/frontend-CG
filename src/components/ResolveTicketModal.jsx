import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Upload, CheckCircle } from 'lucide-react';

const ResolveTicketModal = ({ ticket, user, onClose, onSuccess }) => {
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [resolutionImages, setResolutionImages] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setResolutionImages(prev => [...prev, {
                    file,
                    preview: reader.result
                }]);
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        e.target.value = '';
    };

    const removeImage = (index) => {
        setResolutionImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!resolutionNotes.trim()) {
            toast.error('Please provide resolution notes');
            return;
        }

        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };

            // Extract base64 images
            const imageData = resolutionImages.map(img => img.preview);

            // Update ticket with resolution data
            await axios.put(`http://localhost:5000/api/tickets/${ticket._id}`, {
                title: ticket.title,
                description: ticket.description,
                location: ticket.location._id || ticket.location,
                priority: ticket.priority,
                status: 'resolved',
                resolutionNotes,
                resolutionImages: imageData,
                resolvedBy: user._id,
                resolvedAt: new Date()
            }, config);

            toast.success('Ticket resolved successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to resolve ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Resolve Ticket</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="ticket-info">
                    <h3>{ticket.title}</h3>
                    <p className="ticket-desc">{ticket.description}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Resolution Notes *</label>
                        <textarea
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            placeholder="Describe what was done to resolve this ticket..."
                            rows="4"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Resolution Images (Optional)</label>
                        <div className="image-upload-area">
                            <input
                                type="file"
                                id="resolution-images"
                                accept="image/*"
                                onChange={handleImageChange}
                                multiple
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="resolution-images" className="upload-label">
                                <Upload size={24} />
                                <span>Click to upload images (multiple allowed)</span>
                            </label>
                        </div>
                        {resolutionImages.length > 0 && (
                            <div className="images-grid">
                                {resolutionImages.map((image, index) => (
                                    <div key={index} className="image-preview">
                                        <img src={image.preview} alt={`Resolution ${index + 1}`} />
                                        <button
                                            type="button"
                                            className="remove-image"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-success" disabled={loading}>
                            <CheckCircle size={18} />
                            {loading ? 'Resolving...' : 'Resolve Ticket'}
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
                        background: rgba(0, 0, 0, 0.6);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 20px;
                    }

                    .modal-content {
                        background: white;
                        border-radius: 16px;
                        max-width: 550px;
                        width: 100%;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    }

                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 24px 24px 16px;
                        border-bottom: 1px solid #f1f5f9;
                    }

                    .modal-header h2 {
                        margin: 0;
                        font-size: 20px;
                        font-weight: 700;
                        color: var(--text-dark);
                    }

                    .close-btn {
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: var(--text-muted);
                        padding: 4px;
                        border-radius: 6px;
                        transition: all 0.2s;
                    }

                    .close-btn:hover {
                        background: #f1f5f9;
                        color: var(--text-dark);
                    }

                    .ticket-info {
                        padding: 16px 24px;
                        background: #f8fafc;
                        border-bottom: 1px solid #f1f5f9;
                    }

                    .ticket-info h3 {
                        margin: 0 0 8px 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: var(--text-dark);
                    }

                    .ticket-desc {
                        margin: 0;
                        font-size: 14px;
                        color: var(--text-muted);
                    }

                    form {
                        padding: 24px;
                    }

                    .form-group {
                        margin-bottom: 20px;
                    }

                    .form-group label {
                        display: block;
                        font-weight: 600;
                        font-size: 14px;
                        color: var(--text-dark);
                        margin-bottom: 8px;
                    }

                    .form-group textarea {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e2e8f0;
                        border-radius: 8px;
                        font-size: 14px;
                        font-family: inherit;
                        color: var(--text-dark);
                        transition: all 0.2s;
                        resize: vertical;
                    }

                    .form-group textarea:focus {
                        outline: none;
                        border-color: var(--primary-color);
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                    }

                    .image-upload-area {
                        border: 2px dashed #e2e8f0;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        transition: all 0.2s;
                    }

                    .image-upload-area:hover {
                        border-color: #cbd5e1;
                        background: #f8fafc;
                    }

                    .upload-label {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        cursor: pointer;
                        color: var(--text-muted);
                        transition: color 0.2s;
                    }

                    .upload-label:hover {
                        color: var(--primary-color);
                    }

                    .images-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                        gap: 12px;
                        margin-top: 16px;
                    }

                    .image-preview {
                        position: relative;
                        border-radius: 8px;
                        overflow: hidden;
                        aspect-ratio: 1;
                    }

                    .image-preview img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        border: 2px solid #e2e8f0;
                        border-radius: 8px;
                    }

                    .remove-image {
                        position: absolute;
                        top: 4px;
                        right: 4px;
                        background: rgba(0, 0, 0, 0.7);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .remove-image:hover {
                        background: rgba(0, 0, 0, 0.9);
                    }

                    .modal-actions {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                        margin-top: 24px;
                        padding-top: 20px;
                        border-top: 1px solid #f1f5f9;
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
                        gap: 6px;
                    }

                    .btn-secondary {
                        background: #64748b;
                        color: white;
                    }

                    .btn-secondary:hover {
                        background: #475569;
                    }

                    .btn-success {
                        background: #10b981;
                        color: white;
                    }

                    .btn-success:hover {
                        background: #059669;
                    }

                    .btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default ResolveTicketModal;
