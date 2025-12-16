import { Link } from 'react-router-dom';
import { FileText, MapPin, Users, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const More = () => {
    const { user, logout } = useContext(AuthContext);

    const menuItems = [
        // Admin and Sub-Admin Options
        ...(user?.role === 'admin' || user?.role === 'sub_admin' ? [
            { title: 'Locations', path: '/locations', icon: MapPin, color: '#8b5cf6' },
            { title: 'Templates', path: '/templates', icon: FileText, color: '#ec4899' },
        ] : []),
        // Admin Only - User Management
        ...(user?.role === 'admin' ? [
            { title: 'User Management', path: '/users', icon: Users, color: '#f59e0b' },
        ] : []),
        // General Options
        { title: 'Help & Support', path: '/help', icon: HelpCircle, color: '#06b6d4' },
    ];

    return (
        <div className="more-container">
            <h1>More Options</h1>

            <div className="menu-grid">
                {menuItems.map((item, index) => (
                    <Link key={index} to={item.path} className="menu-item">
                        <div className="icon-wrapper" style={{ background: `${item.color}15`, color: item.color }}>
                            <item.icon size={24} />
                        </div>
                        <div className="content">
                            <h3>{item.title}</h3>
                        </div>
                    </Link>
                ))}
            </div>

            <button onClick={logout} className="logout-btn">
                <LogOut size={20} /> Sign Out
            </button>

            <style>{`
                .more-container { 
                    padding: 20px; 
                    max-width: 800px; 
                    margin: 0 auto; 
                }
                
                .more-container h1 {
                    margin-bottom: 24px;
                    font-size: 28px;
                    font-weight: 700;
                }
                
                .menu-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
                    gap: 16px; 
                    margin-bottom: 40px; 
                }
                
                .menu-item { 
                    display: flex; 
                    align-items: center; 
                    gap: 16px; 
                    background: white; 
                    padding: 20px; 
                    border-radius: 12px; 
                    text-decoration: none; 
                    color: inherit; 
                    box-shadow: var(--shadow-sm); 
                    transition: transform 0.2s, box-shadow 0.2s; 
                }
                
                .menu-item:hover { 
                    transform: translateY(-2px); 
                    box-shadow: var(--shadow-md); 
                }
                
                .icon-wrapper { 
                    width: 48px; 
                    height: 48px; 
                    border-radius: 10px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                }
                
                .content h3 { 
                    margin: 0; 
                    font-size: 16px; 
                    font-weight: 600; 
                }
                
                .logout-btn { 
                    display: flex; 
                    align-items: center; 
                    gap: 10px; 
                    width: 100%; 
                    padding: 16px; 
                    background: #fee2e2; 
                    color: #991b1b; 
                    border: none; 
                    border-radius: 12px; 
                    font-weight: 600; 
                    cursor: pointer; 
                    justify-content: center; 
                    font-size: 16px; 
                    transition: background 0.2s;
                }
                
                .logout-btn:hover { 
                    background: #fecaca; 
                }
            `}</style>
        </div>
    );
};

export default More;
