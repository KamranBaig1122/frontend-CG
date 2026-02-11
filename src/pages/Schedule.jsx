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
import { apiBaseUrl } from '../config/api';
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
    const [allEvents, setAllEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'my_tasks'
    const [timePeriod, setTimePeriod] = useState('this_month'); // 'this_week', 'this_month', 'next_week', 'next_month'
    const [inspectorFilter, setInspectorFilter] = useState('anyone'); // 'anyone', 'me'

    useEffect(() => {
        fetchScheduleData();
    }, [user, filter, inspectorFilter]);

    const fetchScheduleData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };

            // Build query params based on filters
            const inspectionParams = {};
            const ticketParams = {};

            if (inspectorFilter === 'me') {
                inspectionParams.inspector = user._id;
            }

            if (filter === 'my_tasks') {
                ticketParams.assignedTo = user._id;
                // If "My Tasks" is selected, we should also filter inspections to the user
                // unless the inspector filter is explicitly set to something else (though UI might prevent this conflict)
                inspectionParams.inspector = user._id;
            }

            const [inspectionsRes, ticketsRes, usersRes] = await Promise.all([
                axios.get(`${apiBaseUrl}/inspections`, { ...config, params: inspectionParams }),
                axios.get(`${apiBaseUrl}/tickets`, { ...config, params: ticketParams }),
                axios.get(`${apiBaseUrl}/users`, config)
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
                .filter(t => t.dueDate || t.scheduledDate)
                .map(t => ({
                    id: t._id,
                    title: `Ticket: ${t.title}`,
                    start: new Date(t.dueDate || t.scheduledDate),
                    end: new Date(new Date(t.dueDate || t.scheduledDate).setHours(new Date(t.dueDate || t.scheduledDate).getHours() + 1)),
                    type: 'ticket',
                    status: t.status,
                    assignee: t.assignedTo?._id,
                    priority: t.priority,
                    assigneeName: t.assignedTo?.name
                }));

            const allEventsData = [...inspectionEvents, ...ticketEvents];
            setAllEvents(allEventsData);
            setUsers(usersRes.data);

            // Still run client-side date filtering, but user filtering is now server-side
            applyDateFiltersOnly(allEventsData);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load schedule');
            setLoading(false);
        }
    };

    const getTimePeriodRange = () => {
        const now = new Date();
        let start, end;

        switch (timePeriod) {
            case 'this_week':
                start = new Date(now.setDate(now.getDate() - now.getDay()));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'next_week':
                start = new Date(now.setDate(now.getDate() - now.getDay() + 7));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'next_month':
                start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
        }

        return { start, end };
    };

    const applyDateFiltersOnly = (eventsData = allEvents) => {
        let filtered = [...eventsData];

        // Time period filter
        const { start, end } = getTimePeriodRange();
        filtered = filtered.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate >= start && eventDate <= end;
        });

        // Use backend filtering for user/inspector, so no client-side filtering needed here for those

        setEvents(filtered);
    };

    useEffect(() => {
        if (allEvents.length > 0) {
            applyDateFiltersOnly();
        }
    }, [timePeriod]); // Only re-run if time period changes, others trigger fetch



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

    if (loading) return <LoadingSpinner message="Loading schedule..." type="three-dots" color="#3b82f6" height={60} width={60} />;

    return (
        <div className="schedule-container fade-in">
            <div className="page-header">
                <div>
                    <h1><CalendarIcon size={24} /> Schedule</h1>
                    <p className="text-muted">Manage upcoming inspections and ticket due dates</p>
                </div>
                <div className="filter-controls" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Time Period Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-dark)' }}>Time Period:</label>
                        <select
                            value={timePeriod}
                            onChange={(e) => setTimePeriod(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                background: 'white'
                            }}
                        >
                            <option value="this_week">This Week</option>
                            <option value="this_month">This Month</option>
                            <option value="next_week">Next Week</option>
                            <option value="next_month">Next Month</option>
                        </select>
                    </div>

                    {/* Inspector Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-dark)' }}>Inspector:</label>
                        <select
                            value={inspectorFilter}
                            onChange={(e) => setInspectorFilter(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                background: 'white'
                            }}
                        >
                            <option value="anyone">Anyone</option>
                            <option value="me">Me</option>
                        </select>
                    </div>

                    {/* Task Type Filter - Responsive Tabs */}
                    <div className="filter-tabs-container">
                        <div className="filter-tabs">
                            <button
                                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                <span>All Tasks</span>
                            </button>
                            <button
                                className={`filter-tab ${filter === 'my_tasks' ? 'active' : ''}`}
                                onClick={() => setFilter('my_tasks')}
                            >
                                <span>My Tasks</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="calendar-wrapper card">
                <Calendar
                    localizer={localizer}
                    events={events}
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
                
                .filter-tabs-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                .filter-tabs { display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px; gap: 4px; white-space: nowrap; }
                .filter-tab { padding: 8px 16px; border: none; background: none; border-radius: 8px; font-size: 14px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); flex: 1; text-align: center; }
                .filter-tab:hover { color: var(--text-dark); background: rgba(255,255,255,0.5); }
                .filter-tab.active { background: white; color: var(--primary-color); shadow: 0 1px 3px rgba(0,0,0,0.1); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                
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
