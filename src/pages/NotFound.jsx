import { Link } from 'react-router-dom';
import { Home, ArrowLeft, SearchX } from 'lucide-react';

const NotFound = () => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '20px'
        }}>
            <div style={{
                textAlign: 'center',
                maxWidth: '480px',
                width: '100%'
            }}>
                <div style={{
                    display: 'inline-flex',
                    padding: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    marginBottom: '32px',
                    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)'
                }}>
                    <SearchX size={56} style={{ color: '#ef4444' }} />
                </div>

                <h1 style={{
                    fontSize: '96px',
                    fontWeight: '800',
                    margin: '0 0 8px 0',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: '1'
                }}>
                    404
                </h1>

                <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: '0 0 12px 0'
                }}>
                    Page Not Found
                </h2>

                <p style={{
                    fontSize: '16px',
                    color: '#64748b',
                    margin: '0 0 40px 0',
                    lineHeight: '1.6'
                }}>
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <Link
                        to="/"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 28px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            fontSize: '15px',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.45)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.35)';
                        }}
                    >
                        <Home size={18} />
                        Go to Dashboard
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 28px',
                            background: 'white',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            fontWeight: '600',
                            fontSize: '15px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                        }}
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
