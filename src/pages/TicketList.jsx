import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { Filter, Plus, AlertCircle, User as UserIcon, Calendar, MapPin, CheckCircle, Clock, Search, ArrowUpDown, X, Tag, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import AssignTicketModal from '../components/AssignTicketModal';
import ScheduleTicketModal from '../components/ScheduleTicketModal';
import ResolveTicketModal from '../components/ResolveTicketModal';
import LoadingSpinner from '../components/LoadingSpinner';

const TicketList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox', 'scheduled', 'all'
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recently_active');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [assignModal, setAssignModal] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [resolveModal, setResolveModal] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.token) {
        setLoading(false);
        return;
      }
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` },
        };
        const [ticketsRes, locationsRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/tickets`, config),
          axios.get(`${apiBaseUrl}/locations`, config)
        ]);
        console.log('API Response', { tickets: ticketsRes.data, locations: locationsRes.data });
        setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : []);
        setLocations(Array.isArray(locationsRes.data) ? locationsRes.data : []);
        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load data');
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !user.token) return;
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${apiBaseUrl}/users`, config);
        setUsers(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchUsers();
  }, [user]);

  const refetchTickets = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${apiBaseUrl}/tickets`, config);
      setTickets(data);
    } catch (error) {
      console.error(error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#10b981';
    }
  };

  const getPriorityGradient = (priority) => {
    switch (priority) {
      case 'urgent': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'high': return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
      case 'medium': return 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)';
      default: return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    }
  };

  // Debugging logs
  console.log('TicketList Render', { user, ticketsIsArray: Array.isArray(tickets), ticketsLen: tickets?.length });

  // Filter tickets based on tab, filters, and search
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  let filteredTickets = safeTickets.filter(ticket => {
    if (!ticket) return false;

    // Tab filters
    if (activeTab === 'inbox' && ['resolved', 'closed', 'verified'].includes(ticket.status)) return false;
    if (activeTab === 'scheduled' && !ticket.scheduledDate) return false;
    if (activeTab === 'resolved' && !['resolved', 'closed', 'verified'].includes(ticket.status)) return false;

    // Status filter
    if (filter !== 'all' && ticket.status !== filter) return false;

    // Priority filter
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;

    // Location filter
    if (locationFilter !== 'all' && ticket.location?._id !== locationFilter) return false;

    // Search by Ticket ID
    if (searchTerm &&
      !(ticket._id || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(ticket.title || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;

    return true;
  });

  // Sort tickets
  filteredTickets = Array.isArray(filteredTickets) ? [...filteredTickets].sort((a, b) => {
    if (!a || !b) return 0;
    switch (sortBy) {
      case 'status_location':
        const statusOrder = { 'open': 1, 'in_progress': 2, 'resolved': 3, 'closed': 4, 'verified': 5 };
        const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        if (statusDiff !== 0) return statusDiff;
        return (a.location?.name || '').localeCompare(b.location?.name || '');

      case 'priority':
        const priorityOrder = { 'urgent': 1, 'high': 2, 'medium': 3, 'low': 4 };
        return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);

      case 'old_to_new':
        return new Date(a.createdAt) - new Date(b.createdAt);

      case 'new_to_old':
        return new Date(b.createdAt) - new Date(a.createdAt);

      case 'recently_active':
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);

      case 'due_soon':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);

      default:
        return 0;
    }
  }) : [];

  if (loading) return <LoadingSpinner message="Loading tickets..." type="three-dots" color="#3b82f6" height={60} width={60} />;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <Tag size={28} className="text-primary" />
            Issues & Tickets
          </h1>
          <p className="text-muted" style={{ margin: '8px 0 0 0' }}>
            Manage and track maintenance tickets
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'sub_admin') && (
          <Link to="/tickets/new" className="btn" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
          }}>
            <Plus size={18} /> New Ticket
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('inbox')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'inbox' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'inbox' ? '#3b82f6' : '#64748b',
            fontWeight: activeTab === 'inbox' ? '600' : '500',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Inbox ({tickets.filter(t => !['resolved', 'closed', 'verified'].includes(t.status)).length})
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'scheduled' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'scheduled' ? '#3b82f6' : '#64748b',
            fontWeight: activeTab === 'scheduled' ? '600' : '500',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Scheduled ({tickets.filter(t => t.scheduledDate).length})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'resolved' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'resolved' ? '#3b82f6' : '#64748b',
            fontWeight: activeTab === 'resolved' ? '600' : '500',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          Resolved ({tickets.filter(t => ['resolved', 'closed', 'verified'].includes(t.status)).length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'all' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'all' ? '#3b82f6' : '#64748b',
            fontWeight: activeTab === 'all' ? '600' : '500',
            cursor: 'pointer',
            marginBottom: '-2px',
            transition: 'all 0.2s'
          }}
        >
          All Tickets ({tickets.length})
        </button>
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
            placeholder="Search by Ticket ID or Title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
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

      {/* Filters */}
      <div className="filter-section" style={{ marginBottom: '20px', padding: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <Filter size={18} className="text-muted" />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' }}>Filters</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
              style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="filter-select"
              style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
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

          {/* Sort Options */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
              <ArrowUpDown size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
              style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' }}
            >
              <option value="recently_active">Recently Active</option>
              <option value="status_location">Status and Location</option>
              <option value="priority">Priority</option>
              <option value="old_to_new">Old to New</option>
              <option value="new_to_old">New to Old</option>
              <option value="due_soon">Due Soon</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid-cards" style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: '24px'
      }}>
        {filteredTickets.map(ticket => {
          const priorityColor = getPriorityColor(ticket.priority);
          const priorityGradient = getPriorityGradient(ticket.priority);

          return (
            <div
              key={ticket._id}
              className="card"
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
              onClick={() => navigate(`/tickets/${ticket._id}`, { state: { ticket } })}
              role="button"
              tabIndex={0}
            >
              {/* Priority Badge - Top Right */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: priorityGradient,
                color: 'white',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                boxShadow: `0 4px 12px ${priorityColor}40`,
                zIndex: 1
              }}>
                {ticket.priority}
              </div>

              {/* Status Indicators */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  background: '#f1f5f9',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  #{ticket._id.substr(-6)}
                </span>
              </div>

              {/* Title & Location */}
              <div style={{ marginBottom: '20px', paddingRight: '100px' }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: '0 0 8px 0',
                  color: '#1e293b',
                  lineHeight: '1.4'
                }}>
                  {ticket.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <MapPin size={16} />
                  {ticket.location?.name || 'Unknown Location'}
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
                    Assignee
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {ticket.assignedTo?.name || 'Unassigned'}
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
                    {ticket.scheduledDate ? 'Scheduled' : 'Created'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {new Date(ticket.scheduledDate || ticket.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
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
                  background: ['resolved', 'verified', 'closed'].includes(ticket.status) ?
                    'linear-gradient(135deg, #10b981 0%, #059669 100%)' :
                    ticket.status === 'in_progress' ?
                      'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' :
                      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  boxShadow: ['resolved', 'verified', 'closed'].includes(ticket.status) ?
                    '0 4px 12px rgba(16, 185, 129, 0.3)' :
                    ticket.status === 'in_progress' ?
                      '0 4px 12px rgba(59, 130, 246, 0.3)' :
                      '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}>
                  {ticket.status.replace('_', ' ')}
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
              }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                  {(user?.role === 'admin' || user?.role === 'sub_admin') && !['resolved', 'closed'].includes(ticket.status) && (
                    <>
                      {!ticket.assignedTo && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setAssignModal(ticket); }}
                          title="Assign ticket"
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
                      {!ticket.scheduledDate && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setScheduleModal(ticket); }}
                          title="Schedule ticket"
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

                  {/* Supervisor Actions */}
                  {user?.role === 'supervisor' && ticket.status === 'open' && (
                    <>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const config = { headers: { Authorization: `Bearer ${user.token}` } };
                            await axios.put(`${apiBaseUrl}/tickets/${ticket._id}`, {
                              ...ticket,
                              location: ticket.location._id, // Ensure ID is sent
                              status: 'in_progress'
                            }, config);
                            toast.success('Ticket status updated to In Progress!');
                            refetchTickets();
                          } catch (error) {
                            console.error(error);
                            toast.error('Failed to update ticket status');
                          }
                        }}
                        title="Start Work"
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        <Clock size={18} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setResolveModal(ticket); }}
                        title="Mark as resolved"
                        style={{
                          padding: '10px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <CheckCircle size={18} />
                      </button>
                    </>
                  )}
                  {user?.role === 'supervisor' && ticket.status === 'in_progress' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setResolveModal(ticket); }}
                      title="Mark as resolved"
                      style={{
                        padding: '10px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredTickets.length === 0 && (
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
              borderRadius: '50%',
              background: '#f1f5f9',
              color: '#94a3b8'
            }}>
              <AlertCircle size={48} />
            </div>
            <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>No tickets found</h3>
            <p style={{ color: '#64748b' }}>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {assignModal && (
        <AssignTicketModal
          ticket={assignModal}
          users={users}
          onClose={() => setAssignModal(null)}
          onSuccess={refetchTickets}
        />
      )}

      {scheduleModal && (
        <ScheduleTicketModal
          ticket={scheduleModal}
          onClose={() => setScheduleModal(null)}
          onSuccess={refetchTickets}
        />
      )}

      {resolveModal && (
        <ResolveTicketModal
          ticket={resolveModal}
          user={user}
          onClose={() => setResolveModal(null)}
          onSuccess={refetchTickets}
        />
      )}

    </div>
  );
};

export default TicketList;
