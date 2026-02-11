import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { Play, Clock, MapPin, ClipboardList, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const StartWork = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [scheduledInspections, setScheduledInspections] = useState([]);
    const [assignedTickets, setAssignedTickets] = useState([]);
    const [activeWork, setActiveWork] = useState(null);
    const [workHistory, setWorkHistory] = useState([]);

    useEffect(() => {
        if (!user || !user.token) {
            navigate('/login');
            return;
        }
        fetchWorkData();
    }, [user, navigate]);

    const fetchWorkData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const [inspectionsRes, ticketsRes] = await Promise.all([
                axios.get(`${apiBaseUrl}/inspections`, config),
                axios.get(`${apiBaseUrl}/tickets`, config)
            ]);

            // Get scheduled inspections for today assigned to user
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const scheduled = inspectionsRes.data.filter(inspection => {
                if (inspection.inspector?._id !== user._id && inspection.inspector !== user._id) return false;
                if (!inspection.scheduledDate) return false;
                const scheduled = new Date(inspection.scheduledDate);
                return scheduled >= today && scheduled < tomorrow;
            });

            // Get assigned tickets that are open
            const assigned = ticketsRes.data.filter(ticket => {
                return ticket.assignedTo?._id === user._id || ticket.assignedTo === user._id;
            }).filter(ticket => ['open', 'in_progress'].includes(ticket.status));

            setScheduledInspections(scheduled);
            setAssignedTickets(assigned);

            // Check for active work session
            const activeSession = localStorage.getItem('activeWorkSession');
            if (activeSession) {
                try {
                    const session = JSON.parse(activeSession);
                    if (session.userId === user._id) {
                        setActiveWork(session);
                    }
                } catch (e) {
                    localStorage.removeItem('activeWorkSession');
                }
            }

            // Load work history
            const history = localStorage.getItem('workHistory');
            if (history) {
                try {
                    const parsed = JSON.parse(history);
                    setWorkHistory(parsed.filter(h => h.userId === user._id).slice(0, 10));
                } catch (e) {
                    setWorkHistory([]);
                }
            }

            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load work data');
            setLoading(false);
        }
    };

    const startWorkSession = (type, item) => {
        const session = {
            userId: user._id,
            type, // 'inspection' or 'ticket'
            itemId: item._id,
            itemName: type === 'inspection'
                ? `${item.location?.name || 'Location'} - ${item.template?.name || 'Inspection'}`
                : item.title,
            startTime: new Date().toISOString(),
            location: item.location?.name || item.location?.name || 'Unknown'
        };

        localStorage.setItem('activeWorkSession', JSON.stringify(session));
        setActiveWork(session);

        if (type === 'inspection') {
            navigate(`/inspections/${item._id}/perform`);
        } else {
            navigate(`/tickets`);
        }

        toast.success('Work session started!');
    };

    const endWorkSession = () => {
        if (!activeWork) return;

        const endTime = new Date().toISOString();
        const duration = Math.round((new Date(endTime) - new Date(activeWork.startTime)) / 1000 / 60); // minutes

        const historyEntry = {
            ...activeWork,
            endTime,
            duration
        };

        const history = JSON.parse(localStorage.getItem('workHistory') || '[]');
        history.unshift(historyEntry);
        localStorage.setItem('workHistory', JSON.stringify(history.slice(0, 50))); // Keep last 50

        localStorage.removeItem('activeWorkSession');
        setActiveWork(null);
        setWorkHistory([historyEntry, ...workHistory].slice(0, 10));

        toast.success(`Work session ended. Duration: ${duration} minutes`);
    };

    if (loading) return <LoadingSpinner message="Loading your work schedule..." type="three-dots" color="#3b82f6" height={60} width={60} />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Play size={28} className="text-primary" />
                        Start Work
                    </h1>
                    <p className="text-muted">Begin your assigned inspections and tickets</p>
                </div>
            </div>

            {/* Active Work Session */}
            {activeWork && (
                <div className="card" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    marginBottom: '24px',
                    border: 'none'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                        <div>
                            <h3 style={{ color: 'white', marginBottom: '8px' }}>Active Work Session</h3>
                            <p style={{ margin: 0, opacity: 0.9 }}>
                                {activeWork.itemName}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.8 }}>
                                Started: {new Date(activeWork.startTime).toLocaleTimeString()}
                            </p>
                        </div>
                        <button
                            onClick={endWorkSession}
                            className="btn"
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.3)',
                                width: 'auto',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            End Session
                        </button>
                    </div>
                </div>
            )}

            {/* Scheduled Inspections */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} />
                    Today's Scheduled Inspections ({scheduledInspections.length})
                </h2>
                {scheduledInspections.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p>No inspections scheduled for today</p>
                    </div>
                ) : (
                    <div className="grid-cards">
                        {scheduledInspections.map(inspection => (
                            <div key={inspection._id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '8px' }}>
                                            <MapPin size={16} style={{ display: 'inline', marginRight: '6px', color: 'var(--primary-color)' }} />
                                            {inspection.location?.name || 'Unknown Location'}
                                        </h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                                            {inspection.template?.name || 'Template'}
                                        </p>
                                    </div>
                                    {inspection.scheduledDate && (
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scheduled</div>
                                            <div style={{ fontSize: '14px', fontWeight: '600' }}>
                                                {new Date(inspection.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-soft)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                                        <span className={`badge ${inspection.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>
                                            {inspection.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {inspection.totalScore !== undefined && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Score:</span>
                                            <span style={{ fontWeight: '600' }}>{inspection.totalScore}%</span>
                                        </div>
                                    )}
                                </div>

                                {['completed', 'submitted'].includes(inspection.status) ? (
                                    <button className="btn btn-secondary" style={{ width: '100%', opacity: 0.7, cursor: 'not-allowed' }} disabled>
                                        <CheckCircle size={18} style={{ marginRight: '8px' }} />
                                        Completed
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => startWorkSession('inspection', inspection)}
                                        className="btn"
                                        style={{ width: '100%' }}
                                        disabled={!!activeWork}
                                    >
                                        <Play size={18} style={{ marginRight: '8px' }} />
                                        {inspection.status === 'in_progress' ? 'Continue Inspection' : 'Start Inspection'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assigned Tickets */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={20} />
                    Assigned Tickets ({assignedTickets.length})
                </h2>
                {assignedTickets.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p>No tickets assigned to you</p>
                    </div>
                ) : (
                    <div className="grid-cards">
                        {assignedTickets.slice(0, 5).map(ticket => (
                            <div key={ticket._id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px' }}>{ticket.title}</h3>
                                    <span className={`badge ${ticket.priority === 'urgent' ? 'badge-danger' : ticket.priority === 'high' ? 'badge-warning' : 'badge-info'}`}>
                                        {ticket.priority}
                                    </span>
                                </div>

                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px', lineClamp: 2 }}>
                                    {ticket.description || 'No description'}
                                </p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '14px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>
                                        <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                        {ticket.location?.name || 'Unknown'}
                                    </span>
                                    <span className={`badge ${ticket.status === 'open' ? 'badge-secondary' : 'badge-info'}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {['resolved', 'closed', 'completed'].includes(ticket.status) ? (
                                    <button className="btn btn-secondary" style={{ width: '100%', opacity: 0.7, cursor: 'not-allowed' }} disabled>
                                        <CheckCircle size={18} style={{ marginRight: '8px' }} />
                                        Resolved
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => startWorkSession('ticket', ticket)}
                                        className="btn btn-secondary"
                                        style={{ width: '100%' }}
                                        disabled={!!activeWork}
                                    >
                                        <Play size={18} style={{ marginRight: '8px' }} />
                                        Start Work
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Work History */}
            {workHistory.length > 0 && (
                <div>
                    <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={20} />
                        Recent Work History
                    </h2>
                    <div className="card">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {workHistory.map((entry, index) => (
                                <div key={index} style={{
                                    padding: '12px',
                                    background: index % 2 === 0 ? 'var(--bg-soft)' : 'transparent',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{entry.itemName}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(entry.startTime).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-color)' }}>
                                            {entry.duration} min
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {entry.type === 'inspection' ? 'Inspection' : 'Ticket'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StartWork;
