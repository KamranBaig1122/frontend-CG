import { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FileText, Calendar, Download, AlertCircle, CheckCircle, BarChart3, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports = () => {
    const { user } = useContext(AuthContext);
    const [dateRange, setDateRange] = useState([new Date(new Date().setDate(new Date().getDate() - 30)), new Date()]);
    const [startDate, endDate] = dateRange;
    const [reportType, setReportType] = useState('all');
    const [loading, setLoading] = useState(false);

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            toast.error('Please select a date range');
            return;
        }

        setLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob',
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    type: reportType
                }
            };

            const response = await axios.get('http://localhost:5000/api/reports/summary', config);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `summary-report-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Report generated successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in max-w-5xl mx-auto px-4 py-8">
            <div className="page-header mb-8">
                <div>
                    <h1>Reports Center</h1>
                    <p className="text-muted mt-1">Generate and download detailed performance summaries.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Control Panel */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50">
                        {/* Decorative Gradient Top */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm ring-1 ring-indigo-100">
                                    <FileText size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Report Configuration</h2>
                                    <p className="text-slate-500">Customize parameters to generate your PDF</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Date Selection */}
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4">
                                        <Calendar size={16} className="text-indigo-500" />
                                        Select Date Range
                                    </label>
                                    <div className="relative group max-w-md">
                                        <DatePicker
                                            selectsRange={true}
                                            startDate={startDate}
                                            endDate={endDate}
                                            onChange={(update) => setDateRange(update)}
                                            className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 shadow-sm group-hover:border-indigo-300 cursor-pointer"
                                            placeholderText="Select start and end date"
                                            dateFormat="MMM d, yyyy"
                                        />
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors pointer-events-none" size={20} />
                                    </div>
                                </div>

                                {/* Report Type Selection */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4">
                                        <FileText size={16} className="text-indigo-500" />
                                        Report Type
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {[
                                            { id: 'all', label: 'All Data', sub: 'Full Overview', icon: <BarChart3 size={24} /> },
                                            { id: 'inspections', label: 'Inspections', sub: 'Quality Scores', icon: <ClipboardList size={24} /> },
                                            { id: 'tickets', label: 'Tickets', sub: 'Issue Tracking', icon: <AlertCircle size={24} /> }
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setReportType(type.id)}
                                                className={`relative group p-5 rounded-xl border-2 text-left transition-all duration-300 ${reportType === type.id
                                                    ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-100 scale-[1.02] ring-1 ring-indigo-600/20'
                                                    : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5'
                                                    }`}
                                            >
                                                {reportType === type.id && (
                                                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white p-1 rounded-full shadow-md animate-in zoom-in duration-200">
                                                        <CheckCircle size={14} strokeWidth={3} />
                                                    </div>
                                                )}
                                                <div className={`mb-3 transition-colors duration-300 ${reportType === type.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`}>
                                                    {type.icon}
                                                </div>
                                                <div className={`font-bold text-lg mb-1 ${reportType === type.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                    {type.label}
                                                </div>
                                                <div className={`text-xs font-medium ${reportType === type.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                    {type.sub}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="pt-4">
                                    <button
                                        onClick={handleGenerateReport}
                                        disabled={loading || !startDate || !endDate}
                                        className={`btn w-full py-4 text-lg font-bold rounded-xl shadow-xl shadow-indigo-200 transition-all duration-300 ${loading
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-1 active:scale-[0.98]'
                                            }`}
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <LoadingSpinner size="sm" color="current" />
                                                <span>Generating Report...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-3">
                                                <Download size={24} />
                                                <span>Generate PDF Report</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Panel */}
                <div className="space-y-6">
                    <div className="card bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-none">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <CheckCircle size={20} className="text-indigo-200" /> Pro Tip
                        </h3>
                        <p className="text-indigo-100 text-sm leading-relaxed">
                            Generate reports at the end of each week to track team performance trends. Use the "All Data" report for executive summaries.
                        </p>
                    </div>

                    <div className="card">
                        <h3 className="font-bold text-slate-800 mb-4">Report Contents</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-indigo-500"></div>
                                <span><strong>Executive Summary:</strong> High-level statistics and KPIs.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-emerald-500"></div>
                                <span><strong>Performance Metrics:</strong> Average scores and pass rates.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-amber-500"></div>
                                <span><strong>Issue Tracking:</strong> Detailed breakdown of reported tickets.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-slate-400"></div>
                                <span><strong>Activity Logs:</strong> Chronological list of all actions.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-amber-500"></div>
                                <span><strong>APPA Scores:</strong> Cleanliness levels (1-5).</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-indigo-500"></div>
                                <span><strong>Response Time:</strong> Avg time to address tickets.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
