import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { BarChart3, TrendingDown, MapPin, Download, Calendar, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const OverallReport = () => {
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
            const { data } = await axios.get(`${apiBaseUrl}/reports/overall`, config);
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

            const response = await axios.get(`${apiBaseUrl}/reports/overall/export`, config);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `overall-report-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Report exported successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export report');
        }
    };

    if (loading) return <LoadingSpinner message="Loading report data..." type="tail-spin" color="#3b82f6" />;

    return (
        <div className="fade-in">
            <div className="page-header" style={{ 
                marginBottom: '32px',
                padding: '24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 10px 25px -5px rgba(102, 126, 234, 0.4)'
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
                                <BarChart3 size={32} />
                                Overall Report
                            </h1>
                            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '15px' }}>
                                How is my organization doing? What are our lowest-performing locations?
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleExport} 
                        className="btn"
                        style={{
                            padding: '12px 24px',
                            background: 'white',
                            color: '#667eea',
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
                            <Calendar size={16} style={{ color: '#3b82f6' }} />
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
                            <Calendar size={16} style={{ color: '#3b82f6' }} />
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
                            <MapPin size={16} style={{ color: '#3b82f6' }} />
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
                    {/* Overall Statistics */}
                    <div className="grid-cards" style={{ 
                        marginBottom: '32px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px'
                    }}>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Total Inspections</div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.overall.totalInspections}
                            </div>
                        </div>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Average Score</div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.overall.avgScore}%
                            </div>
                        </div>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Avg APPA Score</div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.overall.avgAppaScore}
                            </div>
                        </div>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Total Tickets</div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.overall.totalTickets}
                            </div>
                        </div>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Open Tickets</div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.overall.openTickets}
                            </div>
                        </div>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(6, 182, 212, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Resolved Tickets</div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.overall.resolvedTickets}
                            </div>
                        </div>
                    </div>

                    {/* Trend Charts */}
                    <div className="grid-cards" style={{ 
                        marginBottom: '32px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                        gap: '24px'
                    }}>
                        <div className="card" style={{ 
                            padding: '24px',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px',
                                marginBottom: '24px',
                                paddingBottom: '16px',
                                borderBottom: '2px solid #f1f5f9'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <BarChart3 size={20} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                                    Inspections Over Time
                                </h3>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={reportData.trendData.inspectionsOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{
                                            background: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="count" fill="#3b82f6" name="Inspections" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="card" style={{ 
                            padding: '24px',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px',
                                marginBottom: '24px',
                                paddingBottom: '16px',
                                borderBottom: '2px solid #f1f5f9'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <AlertCircle size={20} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                                    Tickets Over Time
                                </h3>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={reportData.trendData.ticketsOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{
                                            background: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="count" fill="#ef4444" name="Tickets" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Lowest-Performing Locations */}
                    <div className="card" style={{
                        padding: '28px',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            marginBottom: '24px',
                            paddingBottom: '20px',
                            borderBottom: '2px solid #f1f5f9'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <TrendingDown size={24} />
                            </div>
                            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>
                                Lowest-Performing Locations
                            </h2>
                        </div>
                        {reportData.locationPerformance.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                                No location data available for the selected period
                            </p>
                        ) : (
                            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                                    <thead>
                                        <tr style={{ 
                                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                            borderBottom: '2px solid #e2e8f0'
                                        }}>
                                            <th style={{ 
                                                padding: '16px', 
                                                textAlign: 'left', 
                                                fontWeight: '600', 
                                                color: '#475569',
                                                fontSize: '13px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>Location</th>
                                            <th style={{ 
                                                padding: '16px', 
                                                textAlign: 'center', 
                                                fontWeight: '600', 
                                                color: '#475569',
                                                fontSize: '13px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>Inspections</th>
                                            <th style={{ 
                                                padding: '16px', 
                                                textAlign: 'center', 
                                                fontWeight: '600', 
                                                color: '#475569',
                                                fontSize: '13px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>Avg Score</th>
                                            <th style={{ 
                                                padding: '16px', 
                                                textAlign: 'center', 
                                                fontWeight: '600', 
                                                color: '#475569',
                                                fontSize: '13px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>APPA Score</th>
                                            <th style={{ 
                                                padding: '16px', 
                                                textAlign: 'center', 
                                                fontWeight: '600', 
                                                color: '#475569',
                                                fontSize: '13px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>Tickets</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.locationPerformance.map((loc, index) => (
                                            <tr 
                                                key={loc.locationId} 
                                                style={{ 
                                                    borderBottom: '1px solid #f1f5f9',
                                                    transition: 'all 0.2s',
                                                    background: index % 2 === 0 ? 'white' : '#f8fafc'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#f1f5f9';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f8fafc';
                                                }}
                                            >
                                                <td style={{ padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '8px',
                                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white'
                                                        }}>
                                                            <MapPin size={16} />
                                                        </div>
                                                        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                                                            {loc.locationName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>
                                                    {loc.inspectionCount}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <span 
                                                        className={`badge ${loc.averageScore >= 90 ? 'badge-success' : loc.averageScore >= 75 ? 'badge-warning' : 'badge-danger'}`}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            fontWeight: '600',
                                                            fontSize: '13px'
                                                        }}
                                                    >
                                                        {loc.averageScore}%
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>
                                                    {loc.avgAppaScore}
                                                </td>
                                                <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#475569' }}>
                                                    {loc.ticketCount}
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

export default OverallReport;
