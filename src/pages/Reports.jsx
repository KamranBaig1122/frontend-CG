import { Link } from 'react-router-dom';
import { FileText, BarChart3, AlertCircle, Trophy, Lock, ClipboardList, ArrowRight } from 'lucide-react';

const Reports = () => {

    const reportTypes = [
        {
            id: 'overall',
            title: 'Overall Report',
            description: 'How is my organization doing? What are our lowest-performing locations?',
            icon: <BarChart3 size={32} />,
            color: 'from-blue-500 to-cyan-500',
            route: '/reports/overall'
        },
        {
            id: 'tickets',
            title: 'Tickets Report',
            description: 'How responsive is my team? Which locations have the most complaints?',
            icon: <AlertCircle size={32} />,
            color: 'from-red-500 to-pink-500',
            route: '/reports/tickets'
        },
        {
            id: 'inspectors',
            title: 'Inspector Leaderboard',
            description: 'How many inspections is my team performing? What kind of scores do my inspectors tend to give?',
            icon: <Trophy size={32} />,
            color: 'from-yellow-500 to-orange-500',
            route: '/reports/inspectors'
        },
        {
            id: 'private',
            title: 'Private Inspections Report',
            description: 'How is my team doing internally?',
            icon: <Lock size={32} />,
            color: 'from-purple-500 to-indigo-500',
            route: '/reports/private-inspections'
        },
        {
            id: 'forms',
            title: 'Inspection Forms Report',
            description: 'Which area types do we need to improve? What are the lowest-performing line items for each area type?',
            icon: <ClipboardList size={32} />,
            color: 'from-green-500 to-emerald-500',
            route: '/reports/inspection-forms'
        }
    ];

    const gradientColors = {
        'overall': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'tickets': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        'inspectors': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'private': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        'forms': 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    };

    return (
        <div className="fade-in">
            <div className="page-header" style={{ 
                marginBottom: '40px',
                padding: '32px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 10px 25px -5px rgba(102, 126, 234, 0.4)'
            }}>
                <div>
                    <h1 style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px',
                        margin: 0,
                        fontSize: '36px',
                        fontWeight: '700'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '14px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <FileText size={32} />
                        </div>
                        Reports
                    </h1>
                    <p style={{ 
                        margin: '12px 0 0 0', 
                        opacity: 0.95, 
                        fontSize: '17px',
                        fontWeight: '400'
                    }}>
                        Generate detailed performance reports and analytics
                    </p>
                </div>
            </div>

            <div className="grid-cards" style={{ 
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
                gap: '28px' 
            }}>
                {reportTypes.map((report) => (
                    <Link
                        key={report.id}
                        to={report.route}
                        className="card"
                        style={{
                            textDecoration: 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                        }}
                    >
                        <div style={{
                            background: gradientColors[report.id] || 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            padding: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '-50%',
                                right: '-50%',
                                width: '200%',
                                height: '200%',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                                animation: 'pulse 3s ease-in-out infinite'
                            }}></div>
                            <div style={{ 
                                color: 'white',
                                position: 'relative',
                                zIndex: 1,
                                transform: 'scale(1.1)'
                            }}>
                                {report.icon}
                            </div>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <h2 style={{ 
                                marginBottom: '12px', 
                                fontSize: '22px', 
                                fontWeight: '700', 
                                color: '#1e293b',
                                lineHeight: '1.3'
                            }}>
                                {report.title}
                            </h2>
                            <p style={{ 
                                color: '#64748b', 
                                marginBottom: '24px', 
                                lineHeight: '1.7', 
                                fontSize: '15px',
                                minHeight: '48px'
                            }}>
                                {report.description}
                            </p>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                paddingTop: '20px', 
                                borderTop: '2px solid #f1f5f9',
                                marginTop: 'auto'
                            }}>
                                <span style={{ 
                                    fontSize: '15px', 
                                    fontWeight: '600', 
                                    color: '#3b82f6',
                                    letterSpacing: '0.3px'
                                }}>
                                    View Report
                                </span>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    transition: 'transform 0.2s'
                                }}>
                                    <ArrowRight size={18} />
                                </div>
                            </div>
                        </div>
                        <style>{`
                            @keyframes pulse {
                                0%, 100% { opacity: 0.3; }
                                50% { opacity: 0.6; }
                            }
                        `}</style>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Reports;
