import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { Filter, Plus, AlertCircle, User as UserIcon, Calendar, MapPin, CheckCircle, Clock, Search, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import AssignTicketModal from '../components/AssignTicketModal';
import ScheduleTicketModal from '../components/ScheduleTicketModal';
import ResolveTicketModal from '../components/ResolveTicketModal';
import TicketDetailsModal from '../components/TicketDetailsModal';
import LoadingSpinner from '../components/LoadingSpinner';

const TicketList = () => {
  const { user } = useContext(AuthContext);
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
  const [detailsModal, setDetailsModal] = useState(null);

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
        setTickets(ticketsRes.data);
        setLocations(locationsRes.data);
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

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'urgent': return 'badge badge-danger';
      case 'high': return 'badge badge-warning';
      case 'medium': return 'badge badge-info';
      default: return 'badge badge-success';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'resolved': return 'badge badge-success';
      case 'verified': return 'badge badge-primary';
      case 'in_progress': return 'badge badge-info';
      default: return 'badge badge-secondary';
    }
  };

  // Filter tickets based on tab, filters, and search
  let filteredTickets = tickets.filter(ticket => {
    // Tab filters
    if (activeTab === 'inbox' && ['resolved', 'closed', 'verified'].includes(ticket.status)) return false;
    if (activeTab === 'scheduled' && !ticket.scheduledDate) return false;
    
    // Status filter
    if (filter !== 'all' && ticket.status !== filter) return false;
    
    // Priority filter
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    
    // Location filter
    if (locationFilter !== 'all' && ticket.location?._id !== locationFilter) return false;
    
    // Search by Ticket ID
    if (searchTerm && !ticket._id.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !ticket.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  // Sort tickets
  filteredTickets = [...filteredTickets].sort((a, b) => {
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
  });

  if (loading) return <LoadingSpinner message="Loading tickets..." type="three-dots" color="#ef4444" height={60} width={60} />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Issues & Tickets</h1>
        {(user?.role === 'admin' || user?.role === 'sub_admin') && (
          <Link to="/tickets/new" className="btn">
            <Plus size={18} /> Create Ticket
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('inbox')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'inbox' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'inbox' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'inbox' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px'
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
            borderBottom: activeTab === 'scheduled' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'scheduled' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'scheduled' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Scheduled ({tickets.filter(t => t.scheduledDate).length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'all' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'all' ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: activeTab === 'all' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          All Tickets ({tickets.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="filter-section" style={{ marginBottom: '20px', padding: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <Filter size={18} className="text-muted" />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' }}>Filters</h3>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Ticket ID or Title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 40px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
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

      <div className="grid-cards">
        {filteredTickets.map(ticket => (
          <div
            key={ticket._id}
            className="card cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setDetailsModal(ticket)}
          >
            <div className="flex justify-between items-start mb-3">
              <span className={getPriorityBadgeClass(ticket.priority)}>
                {ticket.priority}
              </span>
              <span className="text-xs text-muted font-medium bg-slate-100 px-2 py-1 rounded-md">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h3 className="text-lg font-bold mb-2">{ticket.title}</h3>

            <div className="flex items-center gap-2 text-sm text-muted mb-3">
              <MapPin size={14} />
              {ticket.location?.name || 'Unknown Location'}
            </div>

            <p className="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px]">
              {ticket.description}
            </p>

            {ticket.scheduledDate && (
              <div className="mb-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                <Calendar size={14} />
                <span className="font-medium">Scheduled: {new Date(ticket.scheduledDate).toLocaleDateString()}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100" onClick={e => e.stopPropagation()}>
              <span className={getStatusBadgeClass(ticket.status)}>
                {ticket.status.replace('_', ' ')}
              </span>

              <div className="flex gap-2">
                {(user?.role === 'admin' || user?.role === 'sub_admin') && !['resolved', 'closed'].includes(ticket.status) && (
                  <>
                    {!ticket.assignedTo && (
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        onClick={(e) => { e.stopPropagation(); setAssignModal(ticket); }}
                        title="Assign ticket"
                      >
                        <UserIcon size={18} />
                      </button>
                    )}
                    {!ticket.scheduledDate && (
                      <button
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                        onClick={(e) => { e.stopPropagation(); setScheduleModal(ticket); }}
                        title="Schedule ticket"
                      >
                        <Calendar size={18} />
                      </button>
                    )}
                  </>
                )}
                {user?.role === 'supervisor' && ticket.status === 'open' && (
                  <>
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const config = { headers: { Authorization: `Bearer ${user.token}` } };
                          await axios.put(`${apiBaseUrl}/tickets/${ticket._id}`, {
                            title: ticket.title,
                            description: ticket.description,
                            location: ticket.location._id || ticket.location,
                            priority: ticket.priority,
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
                    >
                      <Clock size={18} />
                    </button>
                    <button
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      onClick={(e) => { e.stopPropagation(); setResolveModal(ticket); }}
                      title="Mark as resolved"
                    >
                      <CheckCircle size={18} />
                    </button>
                  </>
                )}
                {user?.role === 'supervisor' && ticket.status === 'in_progress' && (
                  <button
                    className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                    onClick={(e) => { e.stopPropagation(); setResolveModal(ticket); }}
                    title="Mark as resolved"
                  >
                    <CheckCircle size={18} />
                  </button>
                )}
                <div className="ml-2 text-xs text-muted flex items-center" title="Assignee">
                  {ticket.assignedTo ? (
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                      {ticket.assignedTo.name.charAt(0)}
                    </div>
                  ) : (
                    <span className="italic">Unassigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredTickets.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted">
            <div className="mb-4 inline-flex p-4 bg-slate-100 rounded-full">
              <AlertCircle size={32} />
            </div>
            <p>No tickets found matching your filters.</p>
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

      {detailsModal && (
        <TicketDetailsModal
          ticket={detailsModal}
          onClose={() => setDetailsModal(null)}
        />
      )}
    </div>
  );
};

export default TicketList;
