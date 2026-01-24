import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { AlertCircle, Clock, MapPin, Download, Calendar, ArrowLeft, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TicketsReport = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
    const [endDate, setEndDate] = useState(new Date());
    const [locationFilter, setLocationFilter] = useState('all');
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        fetchLocations();
        fetchReportData();
    }, [startDate, endDate, locationFilter]);

    const fetchLocations = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${apiBaseUrl}/locations`, config);
            setLocations(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    locationId: locationFilter
                }
            };
            const { data } = await axios.get(`${apiBaseUrl}/reports/tickets`, config);
            setReportData(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob',
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    locationId: locationFilter
                }
            };

            const response = await axios.get(`${apiBaseUrl}/reports/tickets/export`, config);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tickets-report-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Report exported successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export report');
        }
    };

    if (loading) return <LoadingSpinner message="Loading report data..." type="tail-spin" color="#ef4444" />;

    const statusColors = {
        open: '#ef4444',
        in_progress: '#f59e0b',
        resolved: '#10b981',
        verified: '#3b82f6'
    };

    const priorityColors = {
        low: '#10b981',
        medium: '#f59e0b',
        high: '#f97316',
        urgent: '#ef4444'
    };

    const statusData = reportData ? Object.entries(reportData.statusDistribution).map(([key, value]) => ({
        name: key.replace('_', ' ').toUpperCase(),
        value,
        color: statusColors[key]
    })).filter(item => item.value > 0) : [];

    const priorityData = reportData ? Object.entries(reportData.priorityDistribution).map(([key, value]) => ({
        name: key.toUpperCase(),
        value,
        color: priorityColors[key]
    })).filter(item => item.value > 0) : [];

    return (
        <div className="fade-in">
            <div className="page-header" style={{ 
                marginBottom: '32px',
                padding: '24px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                        <button
                            onClick={() => navigate('/reports')}
                            className="btn"
                            style={{ 
                                padding: '10px 18px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                borderRadius: '8px',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            }}
                        >
                            <ArrowLeft size={18} style={{ marginRight: '8px' }} />
                            Back to Reports
                        </button>
                        <div>
                            <h1 style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                margin: 0,
                                fontSize: '28px',
                                fontWeight: '700'
                            }}>
                                <AlertCircle size={32} />
                                Tickets Report
                            </h1>
                            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '15px' }}>
                                How responsive is my team? Which locations have the most complaints?
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleExport} 
                        className="btn"
                        style={{
                            padding: '12px 24px',
                            background: 'white',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '15px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 12px -1px rgba(0, 0, 0, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                        }}
                    >
                        <Download size={20} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ 
                marginBottom: '32px', 
                padding: '24px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                    gap: '20px' 
                }}>
                    <div>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            fontSize: '13px', 
                            fontWeight: '600', 
                            marginBottom: '8px', 
                            color: '#475569' 
                        }}>
                            <Calendar size={16} style={{ color: '#ef4444' }} />
                            Start Date
                        </label>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            dateFormat="MMM d, yyyy"
                            className="date-picker-input"
                            style={{ 
                                width: '100%', 
                                padding: '10px 12px', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '8px', 
                                fontSize: '14px',
                                transition: 'all 0.2s',
                                background: 'white'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            fontSize: '13px', 
                            fontWeight: '600', 
                            marginBottom: '8px', 
                            color: '#475569' 
                        }}>
                            <Calendar size={16} style={{ color: '#ef4444' }} />
                            End Date
                        </label>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            dateFormat="MMM d, yyyy"
                            className="date-picker-input"
                            style={{ 
                                width: '100%', 
                                padding: '10px 12px', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '8px', 
                                fontSize: '14px',
                                transition: 'all 0.2s',
                                background: 'white'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            fontSize: '13px', 
                            fontWeight: '600', 
                            marginBottom: '8px', 
                            color: '#475569' 
                        }}>
                            <MapPin size={16} style={{ color: '#ef4444' }} />
                            Location
                        </label>
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '10px 12px', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '8px', 
                                fontSize: '14px',
                                background: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <option value="all">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc._id} value={loc._id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {reportData && (
                <>
                    {/* Responsiveness Metrics */}
                    <div className="grid-cards" style={{ 
                        marginBottom: '32px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px'
                    }}>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Total Tickets</div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.responsiveness.totalTickets}
                            </div>
                        </div>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={16} />
                                Avg Response Time
                            </div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.responsiveness.avgResponseTime}h
                            </div>
                        </div>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Avg Resolution Time</div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.responsiveness.avgResolutionTime}h
                            </div>
                        </div>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Response Rate</div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.responsiveness.responseRate}%
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid-cards" style={{ marginBottom: '24px' }}>
                        <div className="card">
                            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Status Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="card">
                            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Priority Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={priorityData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {priorityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="card" style={{ gridColumn: 'span 2' }}>
                            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Tickets Over Time</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reportData.trendData.ticketsOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#ef4444" name="Tickets Created" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Location Complaints */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <TrendingUp size={24} className="text-warning" />
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Locations with Most Complaints</h2>
                        </div>
                        {reportData.locationComplaints.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                                No ticket data available for the selected period
                            </p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-dark)' }}>Location</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>Total Tickets</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>Open</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>Resolved</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>Avg Response Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.locationComplaints.map((loc, index) => (
                                            <tr key={loc.locationId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <MapPin size={16} className="text-muted" />
                                                        <span style={{ fontWeight: '500' }}>{loc.locationName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>{loc.totalTickets}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span className="badge badge-danger">{loc.openTickets}</span>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span className="badge badge-success">{loc.resolvedTickets}</span>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    {loc.avgResponseTime > 0 ? `${loc.avgResponseTime}h` : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TicketsReport;
