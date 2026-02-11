import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Home, ClipboardList, AlertCircle, Menu, LogOut, MapPin, FileText, Users, BarChart2, Calendar, Play } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user) {
    return children;
  }

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="logo">CleanGuard QC</div>
        <nav>
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Home size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/inspections" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <ClipboardList size={20} />
            <span>Inspections</span>
          </NavLink>
          <NavLink to="/tickets" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <AlertCircle size={20} />
            <span>Tickets</span>
          </NavLink>
          <NavLink to="/schedule" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Calendar size={20} />
            <span>Schedule</span>
          </NavLink>
          {user?.role !== 'client' && (
            <NavLink to="/start-work" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <Play size={20} />
              <span>Start Work</span>
            </NavLink>
          )}
          <NavLink to="/more" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Menu size={20} />
            <span>More</span>
          </NavLink>

          {(user?.role === 'admin' || user?.role === 'sub_admin') && (
            <>
              <div className="section-title">ADMIN</div>
              <NavLink to="/locations" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <MapPin size={20} />
                <span>Locations</span>
              </NavLink>
              <NavLink to="/templates" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FileText size={20} />
                <span>Templates</span>
              </NavLink>
              <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <Users size={20} />
                <span>User Management</span>
              </NavLink>

              <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <BarChart2 size={20} />
                <span>Reports</span>
              </NavLink>
            </>
          )}

          <button onClick={logout} className="nav-link logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Home size={24} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/inspections" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <ClipboardList size={24} />
          <span>Inspections</span>
        </NavLink>
        <NavLink to="/tickets" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <AlertCircle size={24} />
          <span>Tickets</span>
        </NavLink>
        {user?.role !== 'client' && (
          <NavLink to="/start-work" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Play size={24} />
            <span>Work</span>
          </NavLink>
        )}
        <NavLink to="/more" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <Menu size={24} />
          <span>More</span>
        </NavLink>
      </nav>

      <main className="main-content">
        {children}
      </main>

      <style>{`
        .app-container {
          display: flex;
          min-height: 100vh;
          background: var(--bg-body);
        }

        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, #1e1b4b 0%, #312e81 100%);
          padding: 32px 20px;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          overflow-y: auto;
          box-shadow: 4px 0 24px rgba(0,0,0,0.1);
          z-index: 50;
        }

        .logo {
          font-family: var(--font-heading);
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 48px;
          padding: 0 12px;
          letter-spacing: -0.02em;
          background: linear-gradient(to right, #fff, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          color: #94a3b8;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
          transform: translateX(4px);
        }

        .nav-link.active {
          background: rgba(99, 102, 241, 0.15);
          color: #fff;
          border-color: rgba(99, 102, 241, 0.3);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          backdrop-filter: blur(8px);
        }

        .section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #6366f1;
          margin: 32px 0 12px 16px;
          letter-spacing: 1px;
          opacity: 0.9;
        }

        .logout-btn {
          margin-top: auto;
          color: #fca5a5;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #fecaca;
        }

        .main-content {
          flex: 1;
          margin-left: 280px;
          padding: 40px;
          overflow-y: auto;
        }

        .bottom-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }

          .main-content {
            margin-left: 0;
            padding: 20px;
            padding-bottom: 90px;
          }

          .bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(12px);
            border-top: 1px solid rgba(255,255,255,0.5);
            padding: 12px 0;
            justify-content: space-around;
            z-index: 1000;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
          }

          .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 11px;
            font-weight: 500;
            border-radius: 8px;
            transition: all 0.2s;
          }

          .nav-item.active {
            color: var(--primary-color);
            background: var(--primary-soft);
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
