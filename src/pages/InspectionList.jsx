import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Eye, Filter, Calendar, Download, User as UserIcon, CheckCircle, MapPin, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import AssignInspectionModal from '../components/AssignInspectionModal';
import ScheduleInspectionModal from '../components/ScheduleInspectionModal';
import LoadingSpinner from '../components/LoadingSpinner';

const InspectionList = () => {
    const { user } = useContext(AuthContext);
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [users, setUsers] = useState([]);
    const [assignModal, setAssignModal] = useState(null);
    const [scheduleModal, setScheduleModal] = useState(null);

    useEffect(() => {
        const fetchInspections = async () => {
            if (!user || !user.token) {
                setLoading(false);
                return;
            }
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                const { data } = await axios.get('http://localhost:5000/api/inspections', config);
                setInspections(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load inspections');
                setLoading(false);
            }
        };
        fetchInspections();
    }, [user]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!user || !user.token) return;
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('http://localhost:5000/api/users', config);
                setUsers(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchUsers();
    }, [user]);

    const refetchInspections = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/inspections', config);
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
            const { data } = await axios.get(`http://localhost:5000/api/inspections/${inspectionId}/pdf`, config);

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
        if (filter === 'all') return true;
        if (filter === 'excellent') return inspection.totalScore >= 90;
        if (filter === 'good') return inspection.totalScore >= 75 && inspection.totalScore < 90;
        if (filter === 'poor') return inspection.totalScore < 75;
        return true;
    });

    if (loading) return <LoadingSpinner message="Loading inspections..." />;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Inspections</h1>
                {(user?.role === 'admin' || user?.role === 'sub_admin') && (
                    <Link to="/inspections/new" className="btn">
                        <Calendar size={18} /> New Inspection
                    </Link>
                )}
            </div>

            <div className="filter-bar">
                <Filter size={18} className="text-muted" />
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
                    <option value="all">All Scores</option>
                    <option value="excellent">Excellent (90%+)</option>
                    <option value="good">Good (75-89%)</option>
                    <option value="poor">Poor (&lt;75%)</option>
                </select>
            </div>

            <div className="grid-cards">
                {filteredInspections.map(inspection => (
                    <div key={inspection._id} className="card">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                                    <MapPin size={16} className="text-primary" />
                                    {inspection.location?.name || 'Unknown Location'}
                                </h3>
                                <p className="text-sm text-muted flex items-center gap-2">
                                    <FileText size={14} />
                                    {inspection.template?.name || 'Template'}
                                </p>
                            </div>
                            <span className={getScoreBadgeClass(inspection.totalScore)}>
                                {inspection.totalScore}%
                            </span>
                        </div>

                        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted">Inspector:</span>
                                <span className="font-medium">{inspection.inspector?.name || 'Unassigned'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted">Date:</span>
                                <span className="font-medium">{new Date(inspection.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                            <span className={`badge ${['completed', 'submitted'].includes(inspection.status) ? 'badge-success' : 'badge-primary'}`}>
                                {inspection.status.replace('_', ' ')}
                            </span>

                            <div className="flex gap-2">
                                {(user?.role === 'admin' || user?.role === 'sub_admin') && !['completed', 'submitted'].includes(inspection.status) && (
                                    <>
                                        {!inspection.inspector && (
                                            <button
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                onClick={() => setAssignModal(inspection)}
                                                title="Assign inspection"
                                            >
                                                <UserIcon size={18} />
                                            </button>
                                        )}
                                        {!inspection.scheduledDate && (
                                            <button
                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                                                onClick={() => setScheduleModal(inspection)}
                                                title="Schedule inspection"
                                            >
                                                <Calendar size={18} />
                                            </button>
                                        )}
                                    </>
                                )}
                                {user?.role === 'supervisor' && inspection.status === 'in_progress' && (
                                    <Link to={`/inspections/${inspection._id}/perform`} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors" title="Perform Inspection">
                                        <CheckCircle size={18} />
                                    </Link>
                                )}
                                <Link to={`/inspections/${inspection._id}`} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors" title="View Details">
                                    <Eye size={18} />
                                </Link>
                                <button
                                    onClick={() => handleDownloadPDF(inspection._id)}
                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                    title="Download PDF"
                                >
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredInspections.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted">
                        <div className="mb-4 inline-flex p-4 bg-slate-100 rounded-full">
                            <ClipboardList size={32} />
                        </div>
                        <p>No inspections found matching your filters.</p>
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
