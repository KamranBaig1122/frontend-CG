import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { Lock, Users, Download, Calendar, ArrowLeft, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PrivateInspectionsReport = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
    const [endDate, setEndDate] = useState(new Date());

    useEffect(() => {
        fetchReportData();
    }, [startDate, endDate]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            };
            const { data } = await axios.get(`${apiBaseUrl}/reports/private_inspections`, config);
            setReportData(data);
        } catch (error) {
            console.error(error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('Failed to load report data');
            }
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
                    endDate: endDate.toISOString()
                }
            };

            const response = await axios.get(`${apiBaseUrl}/reports/private_inspections/export`, config);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `private-inspections-report-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Report exported successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export report');
        }
    };

    if (loading) return <LoadingSpinner message="Loading report data..." type="tail-spin" color="#8b5cf6" />;

    if (reportData?.message) {
        return (
            <div className="fade-in">
                <div className="page-header" style={{ marginBottom: '24px' }}>
                    <button
                        onClick={() => navigate('/reports')}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px' }}
                    >
                        <ArrowLeft size={18} style={{ marginRight: '8px' }} />
                        Back to Reports
                    </button>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <Lock size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p style={{ color: 'var(--text-muted)' }}>{reportData.message}</p>
                </div>
            </div>
        );
    }

    const chartData = reportData ? reportData.inspectorPerformance.map(perf => ({
        name: perf.inspectorName,
        avgScore: perf.averageScore,
        inspections: perf.inspectionCount
    })) : [];

    return (
        <div className="fade-in">
            <div className="page-header" style={{ 
                marginBottom: '32px',
                padding: '24px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4)'
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
                                <Lock size={32} />
                                Private Inspections Report
                            </h1>
                            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '15px' }}>
                                How is my team doing internally?
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleExport} 
                        className="btn"
                        style={{
                            padding: '12px 24px',
                            background: 'white',
                            color: '#8b5cf6',
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
                            <Calendar size={16} style={{ color: '#8b5cf6' }} />
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
                            <Calendar size={16} style={{ color: '#8b5cf6' }} />
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
                </div>
            </div>

            {reportData && (
                <>
                    {/* Summary Statistics */}
                    <div className="grid-cards" style={{ marginBottom: '24px' }}>
                        <div className="card">
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Private Inspections</div>
                            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-dark)' }}>
                                {reportData.summary.totalPrivateInspections}
                            </div>
                        </div>
                        <div className="card">
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Average Score</div>
                            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-color)' }}>
                                {reportData.summary.avgScore}%
                            </div>
                        </div>
                        <div className="card">
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Avg APPA Score</div>
                            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-dark)' }}>
                                {reportData.summary.avgAppaScore}
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Private Inspections Over Time</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reportData.trendData.privateInspectionsOverTime}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#8b5cf6" name="Private Inspections" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Inspector Performance */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <TrendingUp size={24} className="text-primary" />
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Inspector Performance (Internal)</h2>
                        </div>
                        {reportData.inspectorPerformance.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                                No private inspection data available for the selected period
                            </p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-dark)' }}>Inspector</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>Inspections</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>Avg Score</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>APPA Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.inspectorPerformance.map((perf, index) => (
                                            <tr key={perf.inspectorId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Users size={16} className="text-muted" />
                                                        <span style={{ fontWeight: '500' }}>{perf.inspectorName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>{perf.inspectionCount}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span className={`badge ${perf.averageScore >= 90 ? 'badge-success' : perf.averageScore >= 75 ? 'badge-warning' : 'badge-danger'}`}>
                                                        {perf.averageScore}%
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{perf.avgAppaScore}</td>
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

export default PrivateInspectionsReport;
