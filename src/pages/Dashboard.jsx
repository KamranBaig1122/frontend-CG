import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ClipboardList, AlertCircle, CheckCircle, Clock, Calendar, ArrowRight, MapPin, Building2, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [inspections, setInspections] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [locations, setLocations] = useState([]);
    const [dateRange, setDateRange] = useState([new Date(new Date().setDate(new Date().getDate() - 30)), new Date()]);
    const [startDate, endDate] = dateRange;
    const [loading, setLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [dashboardMetrics, setDashboardMetrics] = useState({
        totalInspections: 0,
        averageScore: 0,
        openIssues: 0,
        resolvedIssues: 0,
        avgAppaScore: 5,
        avgResponseTime: 0
    });
    const [inspectionsChartData, setInspectionsChartData] = useState([]);
    const [ticketsChartData, setTicketsChartData] = useState([]);
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [activeDateFilter, setActiveDateFilter] = useState('last_30_days');

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            if (!user || !user.token) {
                if (isMounted) setLoading(false);
                return;
            }
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const requests = [
                    axios.get(`${apiBaseUrl}/inspections`, config),
                    axios.get(`${apiBaseUrl}/tickets`, config),
                    axios.get(`${apiBaseUrl}/locations`, config)
                ];

                const responses = await Promise.all(requests);

                if (isMounted) {
                    setInspections(responses[0].data);
                    setTickets(responses[1].data);
                    setLocations(responses[2].data);
                    setLoading(false);
                }
            } catch (error) {
                if (isMounted) {
                    console.error(error);
                    if (error.response?.status !== 429) { // Don't show error toast for rate limit (handled by interceptor)
                        toast.error('Failed to load dashboard data');
                    }
                    setLoading(false);
                }
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [user]);

    // Fetch dashboard metrics when filters change
    useEffect(() => {
        let isMounted = true;
        const fetchDashboardMetrics = async () => {
            if (!user || !user.token || !startDate || !endDate) return;
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const params = {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    location_id: selectedLocation
                };

                const [summary, inspectionsChart, ticketsChart] = await Promise.all([
                    axios.get(`${apiBaseUrl}/dashboard/summary`, { ...config, params }),
                    axios.get(`${apiBaseUrl}/dashboard/inspections_over_time`, { ...config, params }),
                    axios.get(`${apiBaseUrl}/dashboard/tickets_over_time`, { ...config, params })
                ]);

                if (isMounted) {
                    setDashboardMetrics(summary.data);
                    setInspectionsChartData(inspectionsChart.data);
                    setTicketsChartData(ticketsChart.data);
                }
            } catch (error) {
                if (isMounted && error.response?.status !== 429) {
                    console.error('Failed to fetch dashboard metrics:', error);
                }
            }
        };

        if ((user?.role === 'admin' || user?.role === 'sub_admin') && startDate && endDate) {
            fetchDashboardMetrics();
        }
        return () => { isMounted = false; };
    }, [user, startDate, endDate, selectedLocation]);

    // Date range quick filter functions
    const setDateRangeFilter = (filterType) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let start, end = new Date();
        end.setHours(23, 59, 59, 999);

        switch (filterType) {
            case 'today':
                start = new Date(today);
                break;
            case 'this_week':
                const dayOfWeek = today.getDay();
                const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                start = new Date(today);
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                break;
            case 'this_month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'last_month':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'last_30_days':
                start = new Date(today);
                start.setDate(start.getDate() - 30);
                break;
            case 'last_60_days':
                start = new Date(today);
                start.setDate(start.getDate() - 60);
                break;
            case 'custom':
                setShowCustomDatePicker(true);
                setActiveDateFilter('custom');
                return;
            default:
                return;
        }

        setDateRange([start, end]);
        setShowCustomDatePicker(false);
        setActiveDateFilter(filterType);
    };

    // Filter data based on date range
    const filteredInspections = inspections.filter(item => {
        const date = new Date(item.createdAt);
        return date >= startDate && date <= endDate;
    });

    const filteredTickets = tickets.filter(item => {
        const date = new Date(item.createdAt);
        return date >= startDate && date <= endDate;
    });

    if (loading) return <LoadingSpinner message="Loading dashboard..." type="three-dots" color="#3b82f6" height={60} width={60} />;

    // --- SUPERVISOR VIEW ---
    if (user?.role === 'supervisor') {
        const myPendingInspections = inspections.filter(i => i.status === 'in_progress' || (i.scheduledDate && new Date(i.scheduledDate) >= new Date()));
        const myOpenTickets = tickets.filter(t => ['open', 'in_progress'].includes(t.status));

        return (
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome back, {user.name}</h1>
                        <p className="subtitle">Here are your assigned tasks</p>
                    </div>
                    <div className="date-display">
                        <Calendar size={18} /> {new Date().toLocaleDateString()}
                    </div>
                </div>

                <div className="supervisor-grid">
                    <div className="task-section">
                        <div className="section-header">
                            <h2><ClipboardList size={20} /> My Inspections</h2>
                            <div className="flex gap-2">
                                <Link to="/inspections/new" className="btn-sm perform-btn flex items-center gap-1">
                                    <ClipboardList size={14} /> Start New
                                </Link>
                                <Link to="/inspections" className="view-all">View All <ArrowRight size={16} /></Link>
                            </div>
                        </div>
                        {myPendingInspections.length > 0 ? (
                            <div className="task-list">
                                {myPendingInspections.slice(0, 5).map(inspection => (
                                    <div key={inspection._id} className="task-card">
                                        <div className="task-info">
                                            <h3>{inspection.location?.name || 'Unknown Location'}</h3>
                                            <p>{inspection.template?.name}</p>
                                            <span className={`status-badge ${inspection.status}`}>{inspection.status.replace('_', ' ')}</span>
                                        </div>
                                        {inspection.status === 'in_progress' ? (
                                            <Link to={`/inspections/${inspection._id}/perform`} className="btn-sm perform-btn">Perform</Link>
                                        ) : (
                                            <Link to={`/inspections/${inspection._id}`} className="btn-sm">View</Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-tasks">No pending inspections.</div>
                        )}
                    </div>

                    <div className="task-section">
                        <div className="section-header">
                            <h2><AlertCircle size={20} /> My Tickets</h2>
                            <Link to="/tickets" className="view-all">View All <ArrowRight size={16} /></Link>
                        </div>
                        {myOpenTickets.length > 0 ? (
                            <div className="task-list">
                                {myOpenTickets.slice(0, 5).map(ticket => (
                                    <div key={ticket._id} className="task-card">
                                        <div className="task-info">
                                            <h3>{ticket.title}</h3>
                                            <p><MapPin size={12} /> {ticket.location?.name}</p>
                                            <span className={`priority-badge ${ticket.priority}`}>{ticket.priority}</span>
                                        </div>
                                        <Link to="/tickets" className="btn-sm">View</Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-tasks">No open tickets.</div>
                        )}
                    </div>
                </div>

                <style>{`
                    .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                    .subtitle { color: var(--text-muted); margin: 5px 0 0 0; }
                    .date-display { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-weight: 500; background: white; padding: 8px 16px; border-radius: 8px; }
                    
                    .supervisor-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 30px; }
                    .task-section { background: white; padding: 24px; border-radius: 12px; box-shadow: var(--shadow-sm); }
                    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
                    .section-header h2 { margin: 0; font-size: 18px; display: flex; align-items: center; gap: 10px; }
                    .view-all { display: flex; align-items: center; gap: 5px; font-size: 13px; color: var(--primary-color); text-decoration: none; font-weight: 500; }
                    
                    .task-list { display: flex; flex-direction: column; gap: 15px; }
                    .task-card { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
                    .task-info h3 { margin: 0 0 5px 0; font-size: 15px; font-weight: 600; }
                    .task-info p { margin: 0 0 8px 0; font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 5px; }
                    
                    .status-badge, .priority-badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; font-weight: 600; }
                    .status-badge.in_progress { background: #dbeafe; color: #1e40af; }
                    .status-badge.scheduled { background: #f3e8ff; color: #6b21a8; }
                    .priority-badge.high, .priority-badge.urgent { background: #fee2e2; color: #991b1b; }
                    .priority-badge.medium { background: #fef3c7; color: #92400e; }
                    .priority-badge.low { background: #dcfce7; color: #166534; }
                    
                    .btn-sm { padding: 6px 12px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; text-decoration: none; color: var(--text-dark); font-size: 12px; font-weight: 500; transition: all 0.2s; }
                    .btn-sm:hover { background: #f1f5f9; border-color: #94a3b8; }
                    .perform-btn { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
                    .perform-btn:hover { background: #bfdbfe; }
                    .empty-tasks { text-align: center; padding: 30px; color: var(--text-muted); font-style: italic; }
                `}</style>
            </div>
        );
    }

    // --- CLIENT VIEW ---
    if (user?.role === 'client') {
        const myLocations = locations;
        const openTicketsCount = tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length;
        const resolvedTicketsCount = tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;
        const recentInspections = inspections.slice(0, 5);

        return (
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1>Welcome, {user.name}</h1>
                        <p className="subtitle">Your Locations Dashboard</p>
                    </div>
                    <div className="date-display">
                        <Calendar size={18} /> {new Date().toLocaleDateString()}
                    </div>
                </div>

                <div className="client-stats-grid">
                    <div className="client-stat-card">
                        <div className="stat-icon bg-blue-100 text-blue-600">
                            <Building2 size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>Locations</h3>
                            <p className="stat-value">{myLocations.length}</p>
                        </div>
                    </div>
                    <div className="client-stat-card">
                        <div className="stat-icon bg-red-100 text-red-600">
                            <AlertCircle size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>Open Issues</h3>
                            <p className="stat-value">{openTicketsCount}</p>
                        </div>
                    </div>
                    <div className="client-stat-card">
                        <div className="stat-icon bg-green-100 text-green-600">
                            <CheckCircle size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>Resolved</h3>
                            <p className="stat-value">{resolvedTicketsCount}</p>
                        </div>
                    </div>
                    <div className="client-stat-card">
                        <div className="stat-icon bg-purple-100 text-purple-600">
                            <ClipboardList size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>Inspections</h3>
                            <p className="stat-value">{inspections.length}</p>
                        </div>
                    </div>
                </div>

                <div className="client-sections">
                    <div className="client-section">
                        <div className="section-header">
                            <h2><MapPin size={20} /> My Locations</h2>
                        </div>
                        {myLocations.length > 0 ? (
                            <div className="inspection-list">
                                {myLocations.map(location => (
                                    <div key={location._id} className="client-card">
                                        <div className="card-content">
                                            <h4>{location.name}</h4>
                                            <p>{location.address}</p>
                                            <span className="status-badge scheduled">{location.type}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-message">No locations assigned</div>
                        )}
                    </div>

                    <div className="client-section">
                        <div className="section-header">
                            <h2><ClipboardList size={20} /> Recent Inspections</h2>
                            <Link to="/inspections" className="view-all">View All <ArrowRight size={16} /></Link>
                        </div>
                        {recentInspections.length > 0 ? (
                            <div className="inspection-list">
                                {recentInspections.map(inspection => (
                                    <div key={inspection._id} className="client-card">
                                        <div className="card-content">
                                            <h4>{inspection.location?.name || 'Unknown Location'}</h4>
                                            <p>{inspection.template?.name}</p>
                                            <span className={`status-badge ${inspection.status}`}>
                                                {inspection.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        {inspection.totalScore !== undefined && (
                                            <div className="score-badge">{inspection.totalScore}%</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-message">No inspections yet</div>
                        )}
                    </div>

                    <div className="client-section">
                        <div className="section-header">
                            <h2><AlertCircle size={20} /> Active Tickets</h2>
                            <Link to="/tickets" className="view-all">View All <ArrowRight size={16} /></Link>
                        </div>
                        {openTicketsCount > 0 ? (
                            <div className="ticket-list">
                                {tickets.filter(t => ['open', 'in_progress'].includes(t.status)).slice(0, 5).map(ticket => (
                                    <div key={ticket._id} className="client-card">
                                        <div className="card-content">
                                            <h4>{ticket.title}</h4>
                                            <p><MapPin size={12} /> {ticket.location?.name}</p>
                                            <span className={`priority-badge ${ticket.priority}`}>{ticket.priority}</span>
                                        </div>
                                        <span className={`status-badge ${ticket.status}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-message">No active tickets</div>
                        )}
                    </div>
                </div>

                <style>{`
                    .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                    .subtitle { color: var(--text-muted); margin: 5px 0 0 0; }
                    .date-display { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-weight: 500; background: white; padding: 8px 16px; border-radius: 8px; }
                    
                    .client-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
                    .client-stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 15px; }
                    .stat-icon { width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
                    .bg-blue-100 { background: #dbeafe; }
                    .text-blue-600 { color: #2563eb; }
                    .bg-red-100 { background: #fee2e2; }
                    .text-red-600 { color: #dc2626; }
                    .bg-green-100 { background: #dcfce7; }
                    .text-green-600 { color: #16a34a; }
                    .bg-purple-100 { background: #f3e8ff; }
                    .text-purple-600 { color: #9333ea; }
                    .stat-info h3 { margin: 0 0 5px 0; font-size: 14px; color: var(--text-muted); }
                    .stat-value { margin: 0; font-size: 24px; font-weight: 700; color: var(--text-dark); }
                    
                    .client-sections { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 20px; }
                    .client-section { background: white; padding: 24px; border-radius: 12px; box-shadow: var(--shadow-sm); }
                    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
                    .section-header h2 { margin: 0; font-size: 18px; display: flex; align-items: center; gap: 10px; }
                    .view-all { display: flex; align-items: center; gap: 5px; font-size: 13px; color: var(--primary-color); text-decoration: none; font-weight: 500; }
                    
                    .inspection-list, .ticket-list { display: flex; flex-direction: column; gap: 12px; }
                    .client-card { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
                    .card-content h4 { margin: 0 0 4px 0; font-size: 14px; font-weight: 600; }
                    .card-content p { margin: 0 0 6px 0; font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
                    
                    .status-badge, .priority-badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; font-weight: 600; }
                    .status-badge.pending { background: #fef3c7; color: #92400e; }
                    .status-badge.in_progress { background: #dbeafe; color: #1e40af; }
                    .status-badge.completed { background: #dcfce7; color: #166534; }
                    .status-badge.open { background: #fee2e2; color: #991b1b; }
                    .status-badge.resolved { background: #dcfce7; color: #166534; }
                    .priority-badge.high, .priority-badge.urgent { background: #fee2e2; color: #991b1b; }
                    .priority-badge.medium { background: #fef3c7; color: #92400e; }
                    .priority-badge.low { background: #dcfce7; color: #166534; }
                    
                    .score-badge { background: var(--primary-color); color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 700; }
                    .empty-message { text-align: center; padding: 30px; color: var(--text-muted); font-style: italic; }
                `}</style>
            </div >
        );
    }

    // --- ADMIN AND SUB-ADMIN VIEW ---
    const formatChartDate = (dateString) => {
        const date = new Date(dateString);
        const month = date.toLocaleString('default', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
    };

    const formattedInspectionsData = inspectionsChartData.map(item => ({
        date: formatChartDate(item.date),
        count: item.count,
        fullDate: item.date
    }));

    const formattedTicketsData = ticketsChartData.map(item => ({
        date: formatChartDate(item.date),
        count: item.count,
        fullDate: item.date
    }));

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="subtitle">Overview of your cleaning operations</p>
                </div>
            </div>

            {/* Filters Section */}
            <div className="filters-section">
                <div className="filter-group">
                    <label className="filter-label">
                        <MapPin size={16} />
                        Location
                    </label>
                    <select
                        className="location-filter"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                        <option value="all">All areas</option>
                        {locations.map(location => (
                            <option key={location._id} value={location._id}>
                                {location.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">
                        <Calendar size={16} />
                        Date Range
                    </label>
                    <div className="date-filter-buttons">
                        <button
                            className={`date-filter-btn ${activeDateFilter === 'today' ? 'active' : ''}`}
                            onClick={() => setDateRangeFilter('today')}
                        >
                            Today
                        </button>
                        <button
                            className={`date-filter-btn ${activeDateFilter === 'this_week' ? 'active' : ''}`}
                            onClick={() => setDateRangeFilter('this_week')}
                        >
                            This week
                        </button>
                        <button
                            className={`date-filter-btn ${activeDateFilter === 'this_month' ? 'active' : ''}`}
                            onClick={() => setDateRangeFilter('this_month')}
                        >
                            This month
                        </button>
                        <button
                            className={`date-filter-btn ${activeDateFilter === 'last_month' ? 'active' : ''}`}
                            onClick={() => setDateRangeFilter('last_month')}
                        >
                            Last month
                        </button>
                        <button
                            className={`date-filter-btn ${activeDateFilter === 'last_30_days' ? 'active' : ''}`}
                            onClick={() => setDateRangeFilter('last_30_days')}
                        >
                            Last 30 days
                        </button>
                        <button
                            className={`date-filter-btn ${activeDateFilter === 'last_60_days' ? 'active' : ''}`}
                            onClick={() => setDateRangeFilter('last_60_days')}
                        >
                            Last 60 days
                        </button>
                        <button
                            className={`date-filter-btn ${activeDateFilter === 'custom' ? 'active' : ''}`}
                            onClick={() => setDateRangeFilter('custom')}
                        >
                            Custom
                        </button>
                    </div>
                    {showCustomDatePicker && (
                        <div className="custom-date-picker-wrapper">
                            <DatePicker
                                selectsRange={true}
                                startDate={startDate}
                                endDate={endDate}
                                onChange={(update) => {
                                    setDateRange(update);
                                    if (update[0] && update[1]) {
                                        setShowCustomDatePicker(false);
                                        setActiveDateFilter('custom');
                                    }
                                }}
                                isClearable={true}
                                className="custom-date-picker"
                                placeholderText="Select date range"
                            />
                            <button
                                className="close-date-picker"
                                onClick={() => setShowCustomDatePicker(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon bg-blue-100 text-blue-600">
                        <ClipboardList size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Total Inspections</h3>
                        <p className="stat-value">{dashboardMetrics.totalInspections}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-green-100 text-green-600">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Average Score</h3>
                        <p className="stat-value">{dashboardMetrics.averageScore}%</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-red-100 text-red-600">
                        <AlertCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Open Issues</h3>
                        <p className="stat-value">{dashboardMetrics.openIssues}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-purple-100 text-purple-600">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Resolved Issues</h3>
                        <p className="stat-value">{dashboardMetrics.resolvedIssues}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-amber-100 text-amber-600">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Avg APPA Score</h3>
                        <p className="stat-value">
                            {dashboardMetrics.avgAppaScore}
                            <span className="text-xs text-muted font-normal ml-1">(Level)</span>
                        </p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-indigo-100 text-indigo-600">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Avg Response Time</h3>
                        <p className="stat-value">
                            {dashboardMetrics.avgResponseTime}
                            <span className="text-xs text-muted font-normal ml-1">hrs</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Inspections Performed</h3>
                    <div className="chart-container">
                        {formattedInspectionsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={formattedInspectionsData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="chart-tooltip">
                                                        <p>{payload[0].payload.fullDate}</p>
                                                        <p><strong>{payload[0].value}</strong> inspections</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty">No data available for selected period</div>
                        )}
                    </div>
                </div>
                <div className="chart-card">
                    <h3>Tickets Created</h3>
                    <div className="chart-container">
                        {formattedTicketsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={formattedTicketsData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="chart-tooltip">
                                                        <p>{payload[0].payload.fullDate}</p>
                                                        <p><strong>{payload[0].value}</strong> tickets</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-empty">No data available for selected period</div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .subtitle { color: var(--text-muted); margin: 5px 0 0 0; }
                
                .filters-section { background: white; padding: 20px; border-radius: 12px; box-shadow: var(--shadow-sm); margin-bottom: 30px; }
                .filter-group { margin-bottom: 15px; }
                .filter-group:last-child { margin-bottom: 0; }
                .filter-label { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--text-dark); margin-bottom: 10px; }
                .location-filter { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; background: white; }
                .date-filter-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
                .date-filter-btn { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; font-size: 13px; font-weight: 500; color: var(--text-dark); cursor: pointer; transition: all 0.2s; }
                .date-filter-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
                .date-filter-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
                .custom-date-picker-wrapper { margin-top: 12px; display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8fafc; border-radius: 8px; }
                .custom-date-picker { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
                .close-date-picker { padding: 6px; border: none; background: transparent; cursor: pointer; color: var(--text-muted); }
                .close-date-picker:hover { color: var(--text-dark); }
                
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 15px; }
                .stat-icon { width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
                .bg-blue-100 { background: #dbeafe; }
                .text-blue-600 { color: #2563eb; }
                .bg-green-100 { background: #dcfce7; }
                .text-green-600 { color: #16a34a; }
                .bg-red-100 { background: #fee2e2; }
                .text-red-600 { color: #dc2626; }
                .bg-purple-100 { background: #f3e8ff; }
                .text-purple-600 { color: #9333ea; }
                .bg-amber-100 { background: #fef3c7; }
                .text-amber-600 { color: #d97706; }
                .bg-indigo-100 { background: #e0e7ff; }
                .text-indigo-600 { color: #4f46e5; }
                .stat-info h3 { margin: 0 0 5px 0; font-size: 14px; color: var(--text-muted); }
                .stat-value { margin: 0; font-size: 24px; font-weight: 700; color: var(--text-dark); }
                
                .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 20px; }
                .chart-card { background: white; padding: 24px; border-radius: 12px; box-shadow: var(--shadow-sm); }
                .chart-card h3 { margin: 0 0 20px 0; font-size: 16px; font-weight: 600; }
                .chart-container { height: 300px; }
                .chart-empty { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-style: italic; }
                .chart-tooltip { background: white; padding: 10px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
                .chart-tooltip p { margin: 4px 0; font-size: 12px; }
                .chart-tooltip p strong { font-size: 14px; }
            `}</style>
        </div>
    );
};

export default Dashboard;
