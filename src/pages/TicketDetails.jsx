import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { ArrowLeft, Calendar, User, MapPin, Clock, AlertTriangle, CheckCircle, Lock, Layout, UserPlus, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import AssignTicketModal from '../components/AssignTicketModal';
import ScheduleTicketModal from '../components/ScheduleTicketModal';

const TicketDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize ticket from navigation state if available
    const [ticket, setTicket] = useState(location.state?.ticket || null);
    const [loading, setLoading] = useState(!location.state?.ticket);
    const [assignModal, setAssignModal] = useState(null);
    const [scheduleModal, setScheduleModal] = useState(null);
    const [users, setUsers] = useState([]);

    // Fetch Supervisors/Users for Assignment
    useEffect(() => {
        const fetchUsers = async () => {
            if (!user || !user.token) return;
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`${apiBaseUrl}/users`, config);
                setUsers(data);
            } catch (error) {
                console.error('Error loading users:', error);
                toast.error('Failed to load user list');
            }
        };
        fetchUsers();
    }, [user]);

    useEffect(() => {
        const fetchTicket = async () => {
            console.log('Fetching ticket details', { id, hasToken: !!user?.token });
            if (!user || !user.token) {
                console.warn('No user or token available');
                return;
            }
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                const { data } = await axios.get(`${apiBaseUrl}/tickets/${id}`, config);
                console.log('Ticket loaded successfully', data);
                setTicket(data);
                setLoading(false);
            } catch (error) {
                console.error('Error loading ticket direct:', error.response || error);

                // Fallback: Try to find ticket in the full list (Backend bug workaround)
                try {
                    console.log('Attempting fallback: Fetching all tickets');
                    const config = { headers: { Authorization: `Bearer ${user.token}` } };
                    const { data: allTickets } = await axios.get(`${apiBaseUrl}/tickets`, config);
                    const foundTicket = allTickets.find(t => t._id === id);

                    if (foundTicket) {
                        console.log('Ticket found in fallback list', foundTicket);
                        setTicket(foundTicket);
                        toast('Ticket loaded from backup list.', { icon: '⚠️', style: { background: '#fff7ed', color: '#c2410c' } });
                        setLoading(false);
                        return;
                    }
                } catch (fallbackError) {
                    console.error('Fallback failed:', fallbackError);
                }

                // If fallback also fails (or ticket not in list), show error
                if (ticket) {
                    toast('Using cached ticket data. Some details may be outdated.', {
                        icon: '⚠️',
                        style: { borderRadius: '10px', background: '#fff7ed', color: '#c2410c' }
                    });
                } else {
                    toast.error('Failed to load ticket: ' + (error.response?.data?.message || error.message));
                }
                setLoading(false);
            }
        };
        fetchTicket();
    }, [id, user]);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-green-100 text-green-800';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'verified': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-blue-50 text-blue-600';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <LoadingSpinner message="Loading ticket details..." type="three-dots" color="#3b82f6" height={60} width={60} />;

    if (!ticket) return (
        <div className="fade-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                maxWidth: '500px',
                margin: '0 auto'
            }}>
                <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>Ticket Not Found</h2>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>The ticket you're looking for doesn't exist or has been removed.</p>
                <Link to="/tickets" className="btn" style={{ display: 'inline-block' }}>
                    <ArrowLeft size={18} style={{ marginRight: '8px', display: 'inline' }} />
                    Back to Tickets
                </Link>
            </div>
        </div>
    );

    return (
        <div className="details-container">
            <div className="page-header">
                <Link to="/tickets" className="back-link">
                    <ArrowLeft size={18} /> Back to Tickets
                </Link>
                <div className="header-actions">
                    {(user?.role === 'admin' || user?.role === 'sub_admin') && (
                        <>
                            <button
                                onClick={() => setAssignModal(ticket)}
                                className="btn btn-primary"
                                style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <UserPlus size={18} /> Reassign
                            </button>
                            <button
                                onClick={() => setScheduleModal(ticket)}
                                className="btn btn-secondary"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <CalendarDays size={18} /> Reschedule
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="details-card">
                <div className="header-section">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority} Priority
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h1>{ticket.title}</h1>
                        <p className="subtitle">
                            <MapPin size={16} /> {ticket.location?.name || 'Unknown Location'} •
                            <span style={{ marginLeft: '8px' }}>#{ticket._id.slice(-6).toUpperCase()}</span>
                        </p>
                    </div>
                </div>

                <div className="content-grid">
                    <div className="main-content">
                        <div className="info-block">
                            <h3>Description</h3>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#334155' }}>
                                {ticket.description || 'No description provided.'}
                            </p>
                        </div>

                        {(ticket.images && ticket.images.length > 0) && (
                            <div className="info-block">
                                <h3>Attachments</h3>
                                <div className="images-grid">
                                    {ticket.images.map((img, idx) => (
                                        <div key={idx} className="image-preview">
                                            <img src={img} alt={`Attachment ${idx + 1}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resolution Section */}
                        {(ticket.resolutionNotes || (ticket.resolutionImages && ticket.resolutionImages.length > 0)) && (
                            <div className="info-block">
                                <h3 style={{ color: '#10b981' }}>Resolution Details</h3>
                                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                                    {ticket.resolutionNotes && (
                                        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#166534', marginBottom: ticket.resolutionImages?.length ? '16px' : '0' }}>
                                            {ticket.resolutionNotes}
                                        </p>
                                    )}

                                    {ticket.resolutionImages && ticket.resolutionImages.length > 0 && (
                                        <div>
                                            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', marginBottom: '8px', textTransform: 'uppercase' }}>Resolution Images</h4>
                                            <div className="images-grid">
                                                {ticket.resolutionImages.map((img, idx) => (
                                                    <div key={idx} className="image-preview" style={{ borderColor: '#bbf7d0' }}>
                                                        <img src={img} alt={`Resolution ${idx + 1}`} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="sidebar">
                        <div className="sidebar-card">
                            <div className="info-row">
                                <div className="icon-wrapper bg-blue-50 text-blue-600">
                                    <User size={18} />
                                </div>
                                <div>
                                    <h4>Assigned To</h4>
                                    <p>{ticket.assignedTo?.name || 'Unassigned'}</p>
                                    {ticket.assignedTo?.email && <span className="sub-text">{ticket.assignedTo.email}</span>}
                                </div>
                            </div>

                            <div className="info-row">
                                <div className="icon-wrapper bg-purple-50 text-purple-600">
                                    <User size={18} />
                                </div>
                                <div>
                                    <h4>Created By</h4>
                                    <p>{ticket.createdBy?.name || 'Unknown'}</p>
                                    <span className="sub-text">{new Date(ticket.createdAt).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="info-row">
                                <div className="icon-wrapper bg-orange-50 text-orange-600">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <h4>Scheduled</h4>
                                    <p>{ticket.scheduledDate ? new Date(ticket.scheduledDate).toLocaleDateString() : 'Not Scheduled'}</p>
                                </div>
                            </div>

                            {ticket.resolvedAt && (
                                <div className="info-row">
                                    <div className="icon-wrapper bg-green-50 text-green-600">
                                        <CheckCircle size={18} />
                                    </div>
                                    <div>
                                        <h4>Resolved</h4>
                                        <p>{new Date(ticket.resolvedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {assignModal && (
                <AssignTicketModal
                    ticket={assignModal}
                    users={users}
                    onClose={() => setAssignModal(null)}
                    onSuccess={() => {
                        setAssignModal(null);
                        // Refresh ticket data
                        axios.get(`${apiBaseUrl}/tickets/${id}`, {
                            headers: { Authorization: `Bearer ${user.token}` }
                        }).then(res => setTicket(res.data));
                        toast.success('Ticket reassigned successfully');
                    }}
                />
            )}

            {scheduleModal && (
                <ScheduleTicketModal
                    ticket={scheduleModal}
                    onClose={() => setScheduleModal(null)}
                    onSuccess={() => {
                        setScheduleModal(null);
                        // Refresh ticket data
                        axios.get(`${apiBaseUrl}/tickets/${id}`, {
                            headers: { Authorization: `Bearer ${user.token}` }
                        }).then(res => setTicket(res.data));
                        toast.success('Ticket rescheduled successfully');
                    }}
                />
            )}

            <style>{`
                .details-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .back-link { display: flex; align-items: center; gap: 8px; color: var(--text-muted); text-decoration: none; font-weight: 500; transition: color 0.2s; }
                .back-link:hover { color: var(--primary-color); }
                .header-actions { display: flex; gap: 12px; }
                
                .details-card { background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; }
                .header-section { padding: 32px; border-bottom: 1px solid #f1f5f9; background: linear-gradient(to bottom, #ffffff, #f8fafc); }
                .header-section h1 { margin: 8px 0; font-size: 28px; color: #1e293b; font-weight: 700; }
                .subtitle { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 15px; margin: 0; font-weight: 500; }
                
                .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 0; }
                .main-content { padding: 32px; border-right: 1px solid #f1f5f9; }
                .sidebar { padding: 32px; background: #f8fafc; }
                
                .info-block { margin-bottom: 32px; }
                .info-block:last-child { margin-bottom: 0; }
                .info-block h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin: 0 0 12px 0; font-weight: 700; }
                
                .sidebar-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .info-row { display: flex; gap: 16px; margin-bottom: 20px; align-items: flex-start; }
                .info-row:last-child { margin-bottom: 0; }
                .icon-wrapper { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .info-row h4 { margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; }
                .info-row p { margin: 0; font-weight: 600; color: #1e293b; font-size: 15px; }
                .sub-text { font-size: 13px; color: #94a3b8; display: block; margin-top: 2px; }
                
                .images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; }
                .image-preview { aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
                .image-preview img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
                .image-preview:hover img { transform: scale(1.05); }

                @media (max-width: 768px) {
                    .content-grid { grid-template-columns: 1fr; }
                    .main-content { border-right: none; border-bottom: 1px solid #f1f5f9; }
                }
            `}</style>
        </div>
    );
};

export default TicketDetails;
