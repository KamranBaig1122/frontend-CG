import { useState, useEffect, useContext } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const Schedule = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'my_tasks'

    useEffect(() => {
        fetchScheduleData();
    }, [user]);

    const fetchScheduleData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const [inspectionsRes, ticketsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/inspections', config),
                axios.get('http://localhost:5000/api/tickets', config)
            ]);

            const inspectionEvents = inspectionsRes.data
                .filter(i => i.scheduledDate)
                .map(i => ({
                    id: i._id,
                    title: `Inspection: ${i.location?.name || 'Unknown'}`,
                    start: new Date(i.scheduledDate),
                    end: new Date(new Date(i.scheduledDate).setHours(new Date(i.scheduledDate).getHours() + 1)),
                    type: 'inspection',
                    status: i.status,
                    assignee: i.inspector?._id,
                    locationName: i.location?.name,
                    inspectorName: i.inspector?.name
                }));

            const ticketEvents = ticketsRes.data
                .filter(t => t.dueDate)
                .map(t => ({
                    id: t._id,
                    title: `Ticket: ${t.title}`,
                    start: new Date(t.dueDate),
                    end: new Date(new Date(t.dueDate).setHours(new Date(t.dueDate).getHours() + 1)),
                    type: 'ticket',
                    status: t.status,
                    assignee: t.assignedTo?._id,
                    priority: t.priority,
                    assigneeName: t.assignedTo?.name
                }));

            setEvents([...inspectionEvents, ...ticketEvents]);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load schedule');
            setLoading(false);
        }
    };

    const filteredEvents = filter === 'my_tasks'
        ? events.filter(e => e.assignee === user._id)
        : events;

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3b82f6'; // Blue for inspections
        if (event.type === 'ticket') {
            backgroundColor = '#ef4444'; // Red for tickets
        }
        if (event.status === 'completed' || event.status === 'resolved' || event.status === 'closed') {
            backgroundColor = '#10b981'; // Green for completed
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
    };

    const closeEventModal = () => {
        setSelectedEvent(null);
    };

    if (loading) return <LoadingSpinner message="Loading schedule..." />;

    return (
        <div className="schedule-container fade-in">
            <div className="page-header">
                <div>
                    <h1><CalendarIcon size={24} /> Schedule</h1>
                    <p className="text-muted">Manage upcoming inspections and ticket due dates</p>
                </div>
                <div className="filter-controls">
                    <div className="filter-btn-group">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All Tasks
                        </button>
                        <button
                            className={`filter-btn ${filter === 'my_tasks' ? 'active' : ''}`}
                            onClick={() => setFilter('my_tasks')}
                        >
                            My Tasks
                        </button>
                    </div>
                </div>
            </div>

            <div className="calendar-wrapper card">
                <Calendar
                    localizer={localizer}
                    events={filteredEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 700 }}
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'week', 'day', 'agenda']}
                    popup
                    onSelectEvent={handleSelectEvent}
                />
            </div>

            <div className="legend">
                <div className="legend-item">
                    <span className="dot inspection"></span> Inspections
                </div>
                <div className="legend-item">
                    <span className="dot ticket"></span> Tickets
                </div>
                <div className="legend-item">
                    <span className="dot completed"></span> Completed/Resolved
                </div>
            </div>

            {selectedEvent && (
                <div className="modal-overlay" onClick={closeEventModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedEvent.type === 'inspection' ? 'Inspection Details' : 'Ticket Details'}</h2>
                            <button onClick={closeEventModal} className="close-btn">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-row">
                                <span className="label">Title:</span>
                                <span className="value">{selectedEvent.title}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Date:</span>
                                <span className="value">{selectedEvent.start.toLocaleString()}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Status:</span>
                                <span className={`status-badge ${selectedEvent.status}`}>
                                    {selectedEvent.status.replace('_', ' ')}
                                </span>
                            </div>
                            {selectedEvent.type === 'inspection' && (
                                <>
                                    <div className="detail-row">
                                        <span className="label">Location:</span>
                                        <span className="value">{selectedEvent.locationName || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Inspector:</span>
                                        <span className="value">{selectedEvent.inspectorName || 'Unassigned'}</span>
                                    </div>
                                </>
                            )}
                            {selectedEvent.type === 'ticket' && (
                                <>
                                    <div className="detail-row">
                                        <span className="label">Priority:</span>
                                        <span className={`priority-badge ${selectedEvent.priority}`}>
                                            {selectedEvent.priority}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Assigned To:</span>
                                        <span className="value">{selectedEvent.assigneeName || 'Unassigned'}</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button onClick={closeEventModal} className="btn btn-secondary">Close</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .schedule-container { max-width: 1400px; margin: 0 auto; padding: 20px; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .page-header h1 { display: flex; align-items: center; gap: 10px; margin: 0; }
                
                .filter-btn-group { display: flex; background: white; padding: 4px; border-radius: 8px; border: 1px solid #e2e8f0; }
                .filter-btn { padding: 8px 16px; border: none; background: none; border-radius: 6px; font-size: 14px; font-weight: 500; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
                .filter-btn.active { background: var(--primary-color); color: white; }
                
                .calendar-wrapper { padding: 20px; background: white; border-radius: 12px; box-shadow: var(--shadow-sm); }
                
                .legend { display: flex; gap: 20px; margin-top: 20px; justify-content: center; }
                .legend-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-dark); }
                .dot { width: 10px; height: 10px; border-radius: 50%; }
                .dot.inspection { background: #3b82f6; }
                .dot.ticket { background: #ef4444; }
                .dot.completed { background: #10b981; }

                /* Calendar Customization */
                .rbc-toolbar button { border: 1px solid #e2e8f0; color: var(--text-dark); }
                .rbc-toolbar button.rbc-active { background: var(--primary-color); color: white; border-color: var(--primary-color); }
                .rbc-header { padding: 10px; font-weight: 600; color: var(--text-dark); }
                .rbc-today { background-color: #f8fafc; }

                /* Modal Styles */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-content { background: white; width: 90%; max-width: 500px; border-radius: 12px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
                .modal-header h2 { margin: 0; font-size: 20px; color: var(--text-dark); }
                .close-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); transition: color 0.2s; }
                .close-btn:hover { color: var(--text-dark); }
                
                .modal-body { display: flex; flex-direction: column; gap: 16px; }
                .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
                .detail-row:last-child { border-bottom: none; }
                .label { font-weight: 600; color: var(--text-muted); font-size: 14px; }
                .value { font-weight: 500; color: var(--text-dark); font-size: 14px; }
                
                .status-badge, .priority-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase; font-weight: 600; }
                .status-badge.in_progress { background: #dbeafe; color: #1e40af; }
                .status-badge.scheduled { background: #f3e8ff; color: #6b21a8; }
                .status-badge.completed, .status-badge.resolved { background: #dcfce7; color: #166534; }
                .status-badge.open { background: #fee2e2; color: #991b1b; }
                
                .priority-badge.high, .priority-badge.urgent { background: #fee2e2; color: #991b1b; }
                .priority-badge.medium { background: #fef3c7; color: #92400e; }
                .priority-badge.low { background: #dcfce7; color: #166534; }
                
                .modal-footer { margin-top: 24px; display: flex; justify-content: flex-end; }
            `}</style>
        </div>
    );
};

export default Schedule;
