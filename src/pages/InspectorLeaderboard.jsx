import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { Users, Trophy, Download, Calendar, ArrowLeft, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const InspectorLeaderboard = () => {
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
            const { data } = await axios.get(`${apiBaseUrl}/reports/inspectors`, config);
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
                    endDate: endDate.toISOString()
                }
            };

            const response = await axios.get(`${apiBaseUrl}/reports/inspectors/export`, config);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inspector-leaderboard-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Report exported successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export report');
        }
    };

    if (loading) return <LoadingSpinner message="Loading report data..." type="tail-spin" color="#f59e0b" />;

    const chartData = reportData ? reportData.leaderboard.map(inspector => ({
        name: inspector.inspectorName,
        inspections: inspector.inspectionCount,
        avgScore: inspector.averageScore
    })) : [];

    return (
        <div className="fade-in">
            <div className="page-header" style={{ 
                marginBottom: '32px',
                padding: '24px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)'
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
                                <Trophy size={32} />
                                Inspector Leaderboard
                            </h1>
                            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '15px' }}>
                                How many inspections is my team performing? What kind of scores do my inspectors tend to give?
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleExport} 
                        className="btn"
                        style={{
                            padding: '12px 24px',
                            background: 'white',
                            color: '#f59e0b',
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
                            <Calendar size={16} style={{ color: '#f59e0b' }} />
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
                            <Calendar size={16} style={{ color: '#f59e0b' }} />
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
                    <div className="grid-cards" style={{ 
                        marginBottom: '32px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px'
                    }}>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Total Inspectors</div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.summary.totalInspectors}
                            </div>
                        </div>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Total Inspections</div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.summary.totalInspections}
                            </div>
                        </div>
                        <div className="card" style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                        }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: '500' }}>Overall Avg Score</div>
                            <div style={{ fontSize: '36px', fontWeight: '700' }}>
                                {reportData.summary.overallAvgScore}%
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Inspections by Inspector</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                <YAxis yAxisId="left" />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="inspections" fill="#3b82f6" name="Inspection Count" />
                                <Bar yAxisId="right" dataKey="avgScore" fill="#10b981" name="Avg Score %" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Leaderboard Table */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <Award size={24} className="text-primary" />
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Inspector Rankings</h2>
                        </div>
                        {reportData.leaderboard.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                                No inspector data available for the selected period
                            </p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)', width: '60px' }}>Rank</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-dark)' }}>Inspector</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>Inspections</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>Avg Score</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>APPA Score</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>Locations</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>Score Distribution</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.leaderboard.map((inspector, index) => (
                                            <tr key={inspector.inspectorId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    {index === 0 && <Trophy size={20} className="text-warning" />}
                                                    {index === 1 && <Trophy size={20} className="text-muted" />}
                                                    {index === 2 && <Trophy size={20} className="text-amber" />}
                                                    {index > 2 && <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>#{index + 1}</span>}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Users size={16} className="text-muted" />
                                                        <span style={{ fontWeight: '500' }}>{inspector.inspectorName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>{inspector.inspectionCount}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span className={`badge ${inspector.averageScore >= 90 ? 'badge-success' : inspector.averageScore >= 75 ? 'badge-warning' : 'badge-danger'}`}>
                                                        {inspector.averageScore}%
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{inspector.avgAppaScore}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{inspector.locationsInspected}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', fontSize: '12px' }}>
                                                        <span style={{ color: '#10b981' }}>E: {inspector.scoreDistribution.excellent}</span>
                                                        <span style={{ color: '#f59e0b' }}>G: {inspector.scoreDistribution.good}</span>
                                                        <span style={{ color: '#ef4444' }}>P: {inspector.scoreDistribution.poor}</span>
                                                    </div>
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

export default InspectorLeaderboard;
