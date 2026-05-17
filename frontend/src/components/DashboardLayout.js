import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Calendar, 
    Stethoscope, 
    Users, 
    CreditCard, 
    ClipboardList, 
    Clock, 
    User, 
    Settings, 
    LogOut,
    Activity,
    ChevronLeft,
    Menu
} from 'lucide-react';
import AppIcon from './AppIcon';
import Sidebar from './Sidebar';
import ChatAssistant from './ChatAssistant';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });
    
    const location = useLocation();
    const navigate = useNavigate();
    const role = localStorage.getItem('role');

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    // Track collapsed preference in localStorage
    useEffect(() => {
        localStorage.setItem('sidebar_collapsed', isCollapsed);
        window.dispatchEvent(new Event('resize'));
    }, [isCollapsed]);

    return (
        <div className="dashboard-container">
            {/* Redesigned Premium Collapsible Sidebar */}
            <Sidebar 
                isMobileOpen={isMobileOpen} 
                setIsMobileOpen={setIsMobileOpen}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            {/* Main Content Area */}
            <div className={`main-wrapper ${isCollapsed ? 'collapsed-margin' : ''}`}>
                <header className="top-navbar">
                    <div className="left-section">
                        {/* Mobile Toggle only */}
                        <button 
                            className="toggle-btn d-lg-none" 
                            onClick={() => setIsMobileOpen(true)}
                            aria-label="Open Menu"
                        >
                            <AppIcon icon={Menu} />
                        </button>
                    </div>

                    <div className="right-section d-flex align-items-center gap-3">
                        <div className="user-info text-end d-none d-sm-block">
                            <div className="fw-bold small">{localStorage.getItem('user_name') || 'User'}</div>
                            <div className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>{role}</div>
                        </div>
                        <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <AppIcon icon={User} size={22} />
                        </div>
                    </div>
                </header>

                <main className="content-area p-4">
                    {children}
                </main>
            </div>
            <ChatAssistant />
        </div>
    );
};

export default DashboardLayout;
