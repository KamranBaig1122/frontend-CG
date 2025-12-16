import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { Filter, Plus, AlertCircle, User as UserIcon, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import AssignTicketModal from '../components/AssignTicketModal';
import ScheduleTicketModal from '../components/ScheduleTicketModal';
import ResolveTicketModal from '../components/ResolveTicketModal';
import TicketDetailsModal from '../components/TicketDetailsModal';
import LoadingSpinner from '../components/LoadingSpinner';

const TicketList = () => {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [assignModal, setAssignModal] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [resolveModal, setResolveModal] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user || !user.token) {
        setLoading(false);
        return;
      }
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` },
        };
        const { data } = await axios.get('http://localhost:5000/api/tickets', config);
        setTickets(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load tickets');
        setLoading(false);
      }
    };
    fetchTickets();
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

  const refetchTickets = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('http://localhost:5000/api/tickets', config);
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

  const filteredTickets = tickets.filter(ticket => {
    if (filter !== 'all' && ticket.status !== filter) return false;
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    if (scheduleFilter === 'scheduled' && !ticket.scheduledDate) return false;
    if (scheduleFilter === 'unscheduled' && ticket.scheduledDate) return false;
    return true;
  });

  if (loading) return <LoadingSpinner message="Loading tickets..." />;

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

      <div className="filter-bar">
        <Filter size={18} className="text-muted" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="verified">Verified</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="filter-select">
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select value={scheduleFilter} onChange={(e) => setScheduleFilter(e.target.value)} className="filter-select">
          <option value="all">All Tickets</option>
          <option value="scheduled">Scheduled</option>
          <option value="unscheduled">Unscheduled</option>
        </select>
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
                          await axios.put(`http://localhost:5000/api/tickets/${ticket._id}`, {
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
