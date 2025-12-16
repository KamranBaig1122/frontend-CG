import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ClipboardList, AlertCircle, CheckCircle, Clock, Calendar, ArrowRight, MapPin, Building2 } from 'lucide-react';
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

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !user.token) return;
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const requests = [
                    axios.get('http://localhost:5000/api/inspections', config),
                    axios.get('http://localhost:5000/api/tickets', config)
                ];

                if (user.role === 'client') {
                    requests.push(axios.get('http://localhost:5000/api/locations', config));
                }

                const responses = await Promise.all(requests);

                setInspections(responses[0].data);
                setTickets(responses[1].data);

                if (user.role === 'client') {
                    setLocations(responses[2].data);
                }
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load dashboard  data');
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Filter data based on date range
    const filteredInspections = inspections.filter(item => {
        const date = new Date(item.createdAt);
        return date >= startDate && date <= endDate;
    });

    const filteredTickets = tickets.filter(item => {
        const date = new Date(item.createdAt);
        return date >= startDate && date <= endDate;
    });

    if (loading) return <LoadingSpinner message="Loading dashboard..." />;

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
    const totalInspections = filteredInspections.length;
    const avgScore = totalInspections > 0
        ? Math.round(filteredInspections.reduce((acc, curr) => acc + (curr.totalScore || 0), 0) / totalInspections)
        : 0;
    const openTickets = filteredTickets.filter(t => ['open', 'in_progress'].includes(t.status)).length;
    const resolvedTickets = filteredTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;

    // Prepare chart data
    const inspectionsByDate = filteredInspections.reduce((acc, curr) => {
        const date = new Date(curr.createdAt).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const inspectionChartData = Object.keys(inspectionsByDate).map(date => ({
        date,
        count: inspectionsByDate[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    const ticketStatusData = [
        { name: 'Open', value: filteredTickets.filter(t => t.status === 'open').length, color: '#ef4444' },
        { name: 'In Progress', value: filteredTickets.filter(t => t.status === 'in_progress').length, color: '#f59e0b' },
        { name: 'Resolved', value: filteredTickets.filter(t => t.status === 'resolved').length, color: '#10b981' },
        { name: 'Closed', value: filteredTickets.filter(t => t.status === 'closed').length, color: '#6b7280' },
    ].filter(item => item.value > 0);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="subtitle">Overview of your cleaning operations</p>
                </div>
                <div className="date-filter">
                    <Calendar size={20} className="calendar-icon" />
                    <DatePicker
                        selectsRange={true}
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(update) => setDateRange(update)}
                        isClearable={true}
                        className="date-picker-input"
                        placeholderText="Select date range"
                    />
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon bg-blue-100 text-blue-600">
                        <ClipboardList size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Total Inspections</h3>
                        <p className="stat-value">{totalInspections}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-green-100 text-green-600">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Average Score</h3>
                        <p className="stat-value">{avgScore}%</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-red-100 text-red-600">
                        <AlertCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Open Issues</h3>
                        <p className="stat-value">{openTickets}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-purple-100 text-purple-600">
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Resolved Issues</h3>
                        <p className="stat-value">{resolvedTickets}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-amber-100 text-amber-600">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Avg APPA Score</h3>
                        <p className="stat-value">
                            {avgScore >= 90 ? '1' : avgScore >= 80 ? '2' : avgScore >= 70 ? '3' : avgScore >= 60 ? '4' : '5'}
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
                            {filteredTickets.filter(t => t.firstResponseAt).length > 0
                                ? Math.round(filteredTickets.filter(t => t.firstResponseAt).reduce((acc, curr) => {
                                    const created = new Date(curr.createdAt);
                                    const responded = new Date(curr.firstResponseAt);
                                    return acc + (responded - created);
                                }, 0) / filteredTickets.filter(t => t.firstResponseAt).length / (1000 * 60 * 60))
                                : 0}
                            <span className="text-xs text-muted font-normal ml-1">hrs</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Inspections Over Time</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={inspectionChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="chart-card">
                    <h3>Ticket Status Distribution</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={ticketStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {ticketStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                .subtitle { color: var(--text-muted); margin: 5px 0 0 0; }
                .date-filter { display: flex; align-items: center; gap: 10px; background: white; padding: 10px 16px; border-radius: 8px; box-shadow: var(--shadow-sm); }
                .calendar-icon { color: var(--text-muted); }
                .date-picker-input { border: none; outline: none; font-size: 14px; }
                
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
                .stat-info h3 { margin: 0 0 5px 0; font-size: 14px; color: var(--text-muted); }
                .stat-value { margin: 0; font-size: 24px; font-weight: 700; color: var(--text-dark); }
                
                .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 20px; }
                .chart-card { background: white; padding: 24px; border-radius: 12px; box-shadow: var(--shadow-sm); }
                .chart-card h3 { margin: 0 0 20px 0; font-size: 16px; }
                .chart-container { height: 300px; }
            `}</style>
        </div>
    );
};

export default Dashboard;
