import React from 'react';
import { X, MapPin, Calendar, User, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const TicketDetailsModal = ({ ticket, onClose, onAssign, onSchedule, user }) => {
    if (!ticket) return null;

    const getPriorityBadgeClass = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-green-100 text-green-800';
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'verified': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-blue-50 text-blue-600';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getPriorityBadgeClass(ticket.priority)}`}>
                                {ticket.priority}
                            </span>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getStatusBadgeClass(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{ticket.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Description */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Description</h3>
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Location</h4>
                                    <p className="font-semibold text-gray-900">{ticket.location?.name || 'Unknown Location'}</p>
                                    <p className="text-sm text-gray-500">{ticket.location?.address}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Assigned To</h4>
                                    <p className="font-semibold text-gray-900">{ticket.assignedTo?.name || 'Unassigned'}</p>
                                    {ticket.assignedTo?.email && <p className="text-sm text-gray-500">{ticket.assignedTo.email}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500">Created</h4>
                                    <p className="font-semibold text-gray-900">{new Date(ticket.createdAt).toLocaleString()}</p>
                                    <p className="text-sm text-gray-500">by {ticket.createdBy?.name || 'Unknown'}</p>
                                </div>
                            </div>

                            {ticket.scheduledDate && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500">Scheduled For</h4>
                                        <p className="font-semibold text-gray-900">{new Date(ticket.scheduledDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline / Additional Info */}
                    {(ticket.firstResponseAt || ticket.resolvedAt) && (
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Timeline</h3>
                            <div className="space-y-4">
                                {ticket.firstResponseAt && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-gray-500">First Response:</span>
                                        <span className="font-medium text-gray-900">{new Date(ticket.firstResponseAt).toLocaleString()}</span>
                                    </div>
                                )}
                                {ticket.resolvedAt && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-gray-500">Resolved:</span>
                                        <span className="font-medium text-gray-900">{new Date(ticket.resolvedAt).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="flex gap-3">
                        {true && ( // DEBUG: Force Visible
                            <>
                                <button
                                    onClick={() => onAssign(ticket)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <User size={18} /> Reassign
                                </button>
                                <button
                                    onClick={() => onSchedule(ticket)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                                >
                                    <Calendar size={18} /> Reschedule
                                </button>
                                {/* DEBUG INFO */}
                                <span className="text-xs text-gray-400">
                                    Role: {user?.role || 'None'}
                                </span>
                            </>
                        )}
                    </div>
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TicketDetailsModal;
