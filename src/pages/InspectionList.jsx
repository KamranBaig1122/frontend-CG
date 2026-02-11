import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { Eye, Filter, Calendar, Download, User as UserIcon, CheckCircle, MapPin, FileText, X, ClipboardList, Search, Clock, TrendingUp, AlertTriangle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import AssignInspectionModal from '../components/AssignInspectionModal';
import ScheduleInspectionModal from '../components/ScheduleInspectionModal';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const InspectionList = () => {
    const { user } = useContext(AuthContext);
    const [inspections, setInspections] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scoreFilter, setScoreFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
    const [endDate, setEndDate] = useState(new Date());
    const [users, setUsers] = useState([]);
    const [assignModal, setAssignModal] = useState(null);
    const [scheduleModal, setScheduleModal] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showMyInspections, setShowMyInspections] = useState(false); // Added state

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            if (!user || !user.token) {
                if (isMounted) setLoading(false);
                return;
            }
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                const [inspectionsRes, locationsRes, usersRes] = await Promise.all([
                    axios.get(`${apiBaseUrl}/inspections`, config),
                    axios.get(`${apiBaseUrl}/locations`, config),
                    axios.get(`${apiBaseUrl}/users`, config).catch(() => ({ data: [] })) // Don't fail if users fetch fails
                ]);
                if (isMounted) {
                    setInspections(inspectionsRes.data);
                    setLocations(locationsRes.data);
                    setUsers(usersRes.data);
                    setLoading(false);
                }
            } catch (error) {
                if (isMounted) {
                    console.error(error);
                    if (error.response?.status !== 429) { // Don't show error toast for rate limit (handled by interceptor)
                        toast.error('Failed to load data');
                    }
                    setLoading(false);
                }
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [user]);

    const refetchInspections = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${apiBaseUrl}/inspections`, config);
            setInspections(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDownloadPDF = async (inspectionId) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob',
            };
            const { data } = await axios.get(`${apiBaseUrl}/inspections/${inspectionId}/pdf`, config);

            const url = window.URL.createObjectURL(new Blob([data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inspection-${inspectionId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('PDF downloaded!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to download PDF');
        }
    };

    const getScoreBadgeClass = (score) => {
        if (score >= 90) return 'badge badge-success';
        if (score >= 75) return 'badge badge-warning';
        return 'badge badge-danger';
    };

    const filteredInspections = inspections.filter(inspection => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const locationName = inspection.location?.name?.toLowerCase() || '';
            const templateName = inspection.template?.name?.toLowerCase() || '';
            const inspectorName = inspection.inspector?.name?.toLowerCase() || '';
            const status = inspection.status?.toLowerCase() || '';

            if (!locationName.includes(query) &&
                !templateName.includes(query) &&
                !inspectorName.includes(query) &&
                !status.includes(query) &&
                !inspection._id.toLowerCase().includes(query)) {
                return false;
            }
        }

        // My Inspections Filter
        if (showMyInspections) {
            const inspectorId = typeof inspection.inspector === 'object' ? inspection.inspector?._id : inspection.inspector;
            if (inspectorId !== user._id) return false;
        }

        // Score filter
        if (scoreFilter === 'excellent' && inspection.totalScore < 90) return false;
        if (scoreFilter === 'good' && (inspection.totalScore < 75 || inspection.totalScore >= 90)) return false;
        if (scoreFilter === 'poor' && inspection.totalScore >= 75) return false;

        // Status filter (Deficient, Flagged, Private, and actual Status)
        if (statusFilter === 'deficient' && !inspection.isDeficient) return false;
        if (statusFilter === 'not_deficient' && inspection.isDeficient) return false;
        if (statusFilter === 'flagged' && !inspection.isFlagged) return false;
        if (statusFilter === 'not_flagged' && inspection.isFlagged) return false;
        if (statusFilter === 'private' && !inspection.isPrivate) return false;
        if (statusFilter === 'not_private' && inspection.isPrivate) return false;

        // New status values
        if (['in_progress', 'completed', 'submitted', 'assigned', 'pending'].includes(statusFilter)) {
            if (inspection.status !== statusFilter) return false;
        }

        // Location filter
        if (locationFilter !== 'all' && inspection.location?._id !== locationFilter) return false;

        // Date range filter
        const inspectionDate = new Date(inspection.createdAt);
        if (inspectionDate < startDate || inspectionDate > endDate) return false;

        return true;
    });

    if (loading) return <LoadingSpinner message="Loading inspections..." type="three-dots" color="#3b82f6" height={60} width={60} />;

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                        <ClipboardList size={28} className="text-primary" />
                        Inspections
                    </h1>
                    <p className="text-muted" style={{ margin: '8px 0 0 0' }}>
                        Manage and track all inspection activities
                    </p>
                </div>
                {(user?.role === 'admin' || user?.role === 'sub_admin') && (
                    <Link to="/inspections/new" className="btn" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                    }}>
                        <Calendar size={18} /> New Inspection
                    </Link>
                )}
            </div>

            {/* Search Bar */}
            <div className="card" style={{
                marginBottom: '24px',
                padding: '20px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                <div style={{ position: 'relative' }}>
                    <Search
                        size={20}
                        style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8',
                            pointerEvents: 'none'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search by location, template, inspector, or status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 48px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            fontSize: '15px',
                            background: 'white',
                            transition: 'all 0.2s',
                            outline: 'none'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#94a3b8'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.color = '#64748b';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#94a3b8';
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="filter-section" style={{ marginBottom: '20px', padding: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Filter size={18} className="text-muted" />
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' }}>Filters</h3>
                    </div>

                    {/* My Inspections Toggle */}
                    <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <input
                            type="checkbox"
                            id="myInspections"
                            checked={showMyInspections}
                            onChange={(e) => setShowMyInspections(e.target.checked)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <label htmlFor="myInspections" style={{ margin: 0, fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>My Inspections</label>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {/* Score Filter */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Score</label>
                        <select
                            value={scoreFilter}
                            onChange={(e) => setScoreFilter(e.target.value)}
                            className="filter-select"
                            style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                        >
                            <option value="all">All Scores</option>
                            <option value="excellent">Excellent (90%+)</option>
                            <option value="good">Good (75-89%)</option>
                            <option value="poor">Poor (&lt;75%)</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                            style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                        >
                            <option value="all">All Inspections</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="assigned">Assigned</option>
                            <option value="deficient">Deficient (Flag)</option>
                            <option value="flagged">Flagged (Flag)</option>
                            <option value="private">Private (Flag)</option>
                        </select>
                    </div>

                    {/* Location Filter */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Location</label>
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="filter-select"
                            style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                        >
                            <option value="all">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc._id} value={loc._id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>From Date</label>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            dateFormat="yyyy-MM-dd"
                            className="date-picker-input"
                            style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>To Date</label>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            dateFormat="yyyy-MM-dd"
                            className="date-picker-input"
                            style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid-cards" style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '24px'
            }}>
                {filteredInspections.map(inspection => {
                    const scoreColor = inspection.totalScore >= 90 ? '#10b981' :
                        inspection.totalScore >= 75 ? '#f59e0b' : '#ef4444';
                    const scoreGradient = inspection.totalScore >= 90 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                        inspection.totalScore >= 75 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                            'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

                    return (
                        <div
                            key={inspection._id}
                            className="card"
                            style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '24px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                            }}
                        >
                            {/* Score Badge - Top Right */}
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: scoreGradient,
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '16px',
                                fontWeight: '700',
                                boxShadow: `0 4px 12px ${scoreColor}40`,
                                zIndex: 1
                            }}>
                                {inspection.totalScore}%
                            </div>

                            {/* Status Indicators */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                marginBottom: '16px',
                                flexWrap: 'wrap'
                            }}>
                                {inspection.isDeficient && (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 10px',
                                        background: '#fee2e2',
                                        color: '#991b1b',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase'
                                    }}>
                                        <AlertTriangle size={12} />
                                        Deficient
                                    </span>
                                )}
                                {inspection.isFlagged && (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 10px',
                                        background: '#fef3c7',
                                        color: '#92400e',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase'
                                    }}>
                                        <AlertTriangle size={12} />
                                        Flagged
                                    </span>
                                )}
                                {inspection.isPrivate && (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '4px 10px',
                                        background: '#f3e8ff',
                                        color: '#6b21a8',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        textTransform: 'uppercase'
                                    }}>
                                        <Lock size={12} />
                                        Private
                                    </span>
                                )}
                            </div>

                            {/* Location & Template */}
                            <div style={{ marginBottom: '20px', paddingRight: '100px' }}>
                                <h3 style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    margin: '0 0 8px 0',
                                    color: '#1e293b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <MapPin size={20} style={{ color: '#3b82f6' }} />
                                    {inspection.location?.name || 'Unknown Location'}
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#64748b',
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <FileText size={16} />
                                    {inspection.template?.name || 'Template'}
                                </p>
                            </div>

                            {/* Info Cards */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    padding: '12px',
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#64748b',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        marginBottom: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <UserIcon size={12} />
                                        Inspector
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#1e293b'
                                    }}>
                                        {inspection.inspector?.name || 'Unassigned'}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '12px',
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                    borderRadius: '10px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#64748b',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        marginBottom: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Clock size={12} />
                                        {inspection.scheduledDate ? 'Scheduled' : 'Created'}
                                    </div>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#1e293b'
                                    }}>
                                        {new Date(inspection.scheduledDate || inspection.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: inspection.scheduledDate ? '2-digit' : undefined,
                                            minute: inspection.scheduledDate ? '2-digit' : undefined
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div style={{
                                marginBottom: '20px',
                                display: 'inline-block'
                            }}>
                                <span style={{
                                    padding: '6px 14px',
                                    background: ['completed', 'submitted'].includes(inspection.status) ?
                                        'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                                        inspection.status === 'pending' ?
                                            'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                                            'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    textTransform: 'capitalize',
                                    boxShadow: ['completed', 'submitted'].includes(inspection.status) ?
                                        '0 4px 12px rgba(16, 185, 129, 0.3)' :
                                        inspection.status === 'pending' ?
                                            '0 4px 12px rgba(245, 158, 11, 0.3)' :
                                            '0 4px 12px rgba(59, 130, 246, 0.3)'
                                }}>
                                    {inspection.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingTop: '20px',
                                borderTop: '1px solid #e2e8f0',
                                gap: '8px'
                            }}>
                                <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                    {(user?.role === 'admin' || user?.role === 'sub_admin') && !['completed', 'submitted'].includes(inspection.status) && (
                                        <>
                                            {!inspection.inspector && (
                                                <button
                                                    onClick={() => setAssignModal(inspection)}
                                                    title="Assign inspection"
                                                    style={{
                                                        padding: '10px',
                                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                                                    }}
                                                >
                                                    <UserIcon size={18} />
                                                </button>
                                            )}
                                            {/* Allow scheduling if not scheduled OR if user is admin/sub-admin (to reschedule) */}
                                            {(!inspection.scheduledDate || user?.role === 'admin' || user?.role === 'sub_admin') && (
                                                <button
                                                    onClick={() => setScheduleModal(inspection)}
                                                    title={inspection.scheduledDate ? "Reschedule inspection" : "Schedule inspection"}
                                                    style={{
                                                        padding: '10px',
                                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(139, 92, 246, 0.4)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.3)';
                                                    }}
                                                >
                                                    <Calendar size={18} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {user?.role === 'supervisor' && inspection.status === 'in_progress' && (
                                        (() => {
                                            const scheduledTime = inspection.scheduledDate ? new Date(inspection.scheduledDate).getTime() : 0;
                                            const now = new Date().getTime();
                                            const canPerform = !inspection.scheduledDate || now >= scheduledTime;

                                            return canPerform ? (
                                                <Link
                                                    to={`/inspections/${inspection._id}/perform`}
                                                    title="Perform Inspection"
                                                    style={{
                                                        padding: '10px',
                                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        textDecoration: 'none',
                                                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                                                    }}
                                                >
                                                    <CheckCircle size={18} />
                                                </Link>
                                            ) : (
                                                <div
                                                    title={`Scheduled for ${new Date(inspection.scheduledDate).toLocaleString()}`}
                                                    style={{
                                                        padding: '10px',
                                                        background: '#e2e8f0',
                                                        color: '#94a3b8',
                                                        borderRadius: '10px',
                                                        cursor: 'not-allowed',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Clock size={18} />
                                                </div>
                                            );
                                        })()
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Link
                                        to={`/inspections/${inspection._id}`}
                                        title="View Details"
                                        style={{
                                            padding: '10px',
                                            background: 'white',
                                            color: '#475569',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textDecoration: 'none',
                                            fontWeight: '500'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.color = 'white';
                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'white';
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                            e.currentTarget.style.color = '#475569';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <Eye size={18} />
                                    </Link>
                                    <button
                                        onClick={() => handleDownloadPDF(inspection._id)}
                                        title="Download PDF"
                                        style={{
                                            padding: '10px',
                                            background: 'white',
                                            color: '#475569',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '500'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.color = 'white';
                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'white';
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                            e.currentTarget.style.color = '#475569';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <Download size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredInspections.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{
                            marginBottom: '20px',
                            display: 'inline-flex',
                            padding: '24px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            borderRadius: '50%',
                            border: '2px solid #e2e8f0'
                        }}>
                            <ClipboardList size={48} style={{ color: '#94a3b8' }} />
                        </div>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#1e293b',
                            margin: '0 0 8px 0'
                        }}>
                            No inspections found
                        </h3>
                        <p style={{
                            fontSize: '14px',
                            color: '#64748b',
                            margin: 0
                        }}>
                            {searchQuery ? 'Try adjusting your search or filters' : 'No inspections match your current filters'}
                        </p>
                    </div>
                )}
            </div>

            {assignModal && (
                <AssignInspectionModal
                    inspection={assignModal}
                    users={users}
                    onClose={() => setAssignModal(null)}
                    onSuccess={refetchInspections}
                />
            )}

            {scheduleModal && (
                <ScheduleInspectionModal
                    inspection={scheduleModal}
                    onClose={() => setScheduleModal(null)}
                    onSuccess={refetchInspections}
                />
            )}
        </div>
    );
};

export default InspectionList;
