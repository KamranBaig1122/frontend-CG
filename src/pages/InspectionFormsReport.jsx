import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { FileText, TrendingDown, Download, Calendar, ArrowLeft, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const InspectionFormsReport = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
    const [endDate, setEndDate] = useState(new Date());
    const [expandedArea, setExpandedArea] = useState(null);

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
            const { data } = await axios.get(`${apiBaseUrl}/reports/inspection_forms`, config);
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

            const response = await axios.get(`${apiBaseUrl}/reports/inspection_forms/export`, config);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inspection-forms-report-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Report exported successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to export report');
        }
    };

    if (loading) return <LoadingSpinner message="Loading report data..." type="tail-spin" color="#10b981" />;

    return (
        <div className="fade-in">
            <div className="page-header" style={{ 
                marginBottom: '32px',
                padding: '24px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
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
                                <FileText size={32} />
                                Inspection Forms Report
                            </h1>
                            <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '15px' }}>
                                Which area types do we need to improve? What are the lowest-performing line items for each area type?
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleExport} 
                        className="btn"
                        style={{
                            padding: '12px 24px',
                            background: 'white',
                            color: '#10b981',
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
                            <Calendar size={16} style={{ color: '#10b981' }} />
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
                            <Calendar size={16} style={{ color: '#10b981' }} />
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
                    {/* Area Type Performance */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <TrendingDown size={24} className="text-warning" />
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Area Type Performance</h2>
                        </div>
                        {reportData.areaTypePerformance.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                                No area type data available for the selected period
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {reportData.areaTypePerformance.map((area, index) => (
                                    <div key={index} className="card" style={{ padding: '16px', background: index % 2 === 0 ? 'var(--bg-soft)' : 'white' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                marginBottom: expandedArea === index ? '12px' : 0
                                            }}
                                            onClick={() => setExpandedArea(expandedArea === index ? null : index)}
                                        >
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                                                    {area.areaType.charAt(0).toUpperCase() + area.areaType.slice(1)}
                                                </h3>
                                                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                                    <span>Inspections: {area.inspectionCount}</span>
                                                    <span>Avg Score: <strong>{area.averageScore}%</strong></span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span className={`badge ${area.averageScore >= 90 ? 'badge-success' : area.averageScore >= 75 ? 'badge-warning' : 'badge-danger'}`}>
                                                    {area.averageScore}%
                                                </span>
                                            </div>
                                        </div>
                                        {expandedArea === index && area.lowestPerformingItems.length > 0 && (
                                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-dark)' }}>
                                                    Lowest-Performing Line Items
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {area.lowestPerformingItems.map((item, itemIndex) => (
                                                        <div
                                                            key={itemIndex}
                                                            style={{
                                                                padding: '12px',
                                                                background: 'white',
                                                                borderRadius: '6px',
                                                                border: '1px solid #e2e8f0',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <div>
                                                                <div style={{ fontWeight: '500', marginBottom: '4px' }}>{item.itemName}</div>
                                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                                    Pass: {item.passCount} | Fail: {item.failCount} | Total: {item.totalCount}
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>
                                                                    {item.failRate}% Fail Rate
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                                    Avg: {item.avgScore}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Template Performance */}
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <FileText size={24} className="text-primary" />
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Template Performance</h2>
                        </div>
                        {reportData.templatePerformance.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                                No template data available for the selected period
                            </p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: 'var(--text-dark)' }}>Template</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>Inspections</th>
                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: 'var(--text-dark)' }}>Avg Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.templatePerformance.map((template, index) => (
                                            <tr key={template.templateId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <FileText size={16} className="text-muted" />
                                                        <span style={{ fontWeight: '500' }}>{template.templateName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>{template.inspectionCount}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span className={`badge ${template.averageScore >= 90 ? 'badge-success' : template.averageScore >= 75 ? 'badge-warning' : 'badge-danger'}`}>
                                                        {template.averageScore}%
                                                    </span>
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

export default InspectionFormsReport;
