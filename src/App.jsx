import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ImprovedInspectionWizard from './pages/ImprovedInspectionWizard';
import InspectionList from './pages/InspectionList';
import TicketList from './pages/TicketList';
import TicketForm from './pages/TicketForm';
import Schedule from './pages/Schedule';
import BulkTicketCreate from './pages/BulkTicketCreate';
import InspectionDetails from './pages/InspectionDetails'; // Added based on new route
import TicketDetails from './pages/TicketDetails'; // Added based on new route
import CreateInspection from './pages/CreateInspection';
import LocationManagement from './pages/LocationManagement';
import TemplateManagement from './pages/TemplateManagement';
import TemplateForm from './pages/TemplateForm';

import UserManagement from './pages/UserManagement';
import HelpSupport from './pages/HelpSupport';
import Reports from './pages/Reports';
import OverallReport from './pages/OverallReport';
import TicketsReport from './pages/TicketsReport';
import InspectorLeaderboard from './pages/InspectorLeaderboard';
import PrivateInspectionsReport from './pages/PrivateInspectionsReport';
import InspectionFormsReport from './pages/InspectionFormsReport';
import More from './pages/More'; // Added based on new route
import StartWork from './pages/StartWork';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/inspections" element={<PrivateRoute><Layout><InspectionList /></Layout></PrivateRoute>} />
          <Route path="/inspections/new" element={<PrivateRoute><Layout><ImprovedInspectionWizard /></Layout></PrivateRoute>} />
          <Route path="/inspections/:id/perform" element={<PrivateRoute><Layout><ImprovedInspectionWizard /></Layout></PrivateRoute>} />
          <Route path="/inspections/:id" element={<PrivateRoute><Layout><InspectionDetails /></Layout></PrivateRoute>} />
          <Route path="/tickets" element={<PrivateRoute><Layout><TicketList /></Layout></PrivateRoute>} />
          <Route path="/tickets/new" element={<PrivateRoute><Layout><TicketForm /></Layout></PrivateRoute>} />
          <Route path="/tickets/:id" element={<PrivateRoute><Layout><TicketDetails /></Layout></PrivateRoute>} />
          <Route path="/schedule" element={<PrivateRoute><Layout><Schedule /></Layout></PrivateRoute>} />
          <Route path="/tickets/bulk" element={<PrivateRoute><Layout><BulkTicketCreate /></Layout></PrivateRoute>} />
          <Route path="/admin/inspections/create" element={<PrivateRoute><Layout><CreateInspection /></Layout></PrivateRoute>} />
          <Route path="/admin/locations" element={<PrivateRoute><Layout><LocationManagement /></Layout></PrivateRoute>} />
          <Route path="/admin/templates" element={<PrivateRoute><Layout><TemplateManagement /></Layout></PrivateRoute>} />
          <Route path="/locations" element={<PrivateRoute><Layout><LocationManagement /></Layout></PrivateRoute>} />
          <Route path="/templates" element={<PrivateRoute><Layout><TemplateManagement /></Layout></PrivateRoute>} />
          <Route path="/templates/new" element={<PrivateRoute><Layout><TemplateForm /></Layout></PrivateRoute>} />
          <Route path="/templates/edit/:id" element={<PrivateRoute><Layout><TemplateForm /></Layout></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><Layout><UserManagement /></Layout></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Layout><Reports /></Layout></PrivateRoute>} />
          <Route path="/reports/overall" element={<PrivateRoute><Layout><OverallReport /></Layout></PrivateRoute>} />
          <Route path="/reports/tickets" element={<PrivateRoute><Layout><TicketsReport /></Layout></PrivateRoute>} />
          <Route path="/reports/inspectors" element={<PrivateRoute><Layout><InspectorLeaderboard /></Layout></PrivateRoute>} />
          <Route path="/reports/private-inspections" element={<PrivateRoute><Layout><PrivateInspectionsReport /></Layout></PrivateRoute>} />
          <Route path="/reports/inspection-forms" element={<PrivateRoute><Layout><InspectionFormsReport /></Layout></PrivateRoute>} />
          <Route path="/help" element={<PrivateRoute><Layout><HelpSupport /></Layout></PrivateRoute>} />
          <Route path="/more" element={<PrivateRoute><Layout><More /></Layout></PrivateRoute>} />
          <Route path="/start-work" element={<PrivateRoute><Layout><StartWork /></Layout></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
