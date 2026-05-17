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
  ChevronRight,
  Sparkles,
  Bot,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import './Sidebar.css';

function Sidebar({ isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }) {
  const role = localStorage.getItem('role') || 'patient';
  const userName = localStorage.getItem('user_name') || 'Medical Operator';
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const triggerAIChat = (e) => {
    e.preventDefault();
    // Dispatches a custom window event that our ChatAssistant component listens to
    window.dispatchEvent(new CustomEvent('open-ai-chat'));
  };

  // Define role badge visual styling
  const getRoleBadge = () => {
    if (role === 'admin') return { label: 'Admin', class: 'badge-admin' };
    if (role === 'doctor') return { label: 'Doctor', class: 'badge-doctor' };
    return { label: 'Patient', class: 'badge-patient' };
  };

  const badge = getRoleBadge();

  // Curated, premium navigation groups matching premium SaaS architectures
  const getNavigationGroups = () => {
    if (role === 'patient') {
      return [
        {
          group: "Overview",
          items: [
            { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          ]
        },
        {
          group: "Clinical Care",
          items: [
            { path: "/patient-sessions", label: "Sessions", icon: ClipboardList },
            { path: "/doctors-list", label: "Doctors List", icon: Stethoscope },
          ]
        },
        {
          group: "Financial",
          items: [
            { path: "/patient-bills", label: "My Bills", icon: CreditCard },
          ]
        },
        {
          group: "AI Assistant",
          items: [
            { path: "#", label: "AI Clinical Bot", icon: Sparkles, action: triggerAIChat, isSpecial: true },
          ]
        }
      ];
    } else if (role === 'doctor') {
      return [
        {
          group: "Consultation",
          items: [
            { path: "/doctor-dashboard", label: "Appointments", icon: Calendar },
            { path: "/doctor-slots", label: "Manage Slots", icon: Clock },
          ]
        },
        {
          group: "Clinical Records",
          items: [
            { path: "/doctor/sessions", label: "Sessions Log", icon: ClipboardList },
            { path: "/doctor/profile", label: "My Profile", icon: User },
          ]
        },
        {
          group: "Finance",
          items: [
            { path: "/doctor/billing", label: "Billing", icon: CreditCard },
          ]
        },
        {
          group: "AI Partner",
          items: [
            { path: "#", label: "AI Diagnostics", icon: Bot, action: triggerAIChat, isSpecial: true },
          ]
        }
      ];
    } else { // Admin
      return [
        {
          group: "Operations",
          items: [
            { path: "/admin", label: "Admin Console", icon: Settings },
          ]
        },
        {
          group: "Finance Desk",
          items: [
            { path: "/admin/billing", label: "Global Billing", icon: CreditCard },
          ]
        },
        {
          group: "AI Infrastructure",
          items: [
            { path: "#", label: "AI Monitor", icon: Bot, action: triggerAIChat, isSpecial: true },
          ]
        }
      ];
    }
  };

  return (
    <>
      {/* Mobile Toggle Drawer overlay */}
      <div 
        className={`sidebar-dimmer ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside className={`premium-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        
        {/* Header Logo */}
        <div className="sidebar-header">
          <div className="logo-box">
            <div className="logo-neon-ring">
              <Activity className="logo-svg" size={20} />
            </div>
            {!isCollapsed && <span className="logo-brand">HMS</span>}
          </div>
          
          {/* Collapse Toggle Switch Button (Hidden on Mobile) */}
          <button 
            className="collapse-switch-btn d-none d-lg-flex" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Dynamic User Profile Card */}
        <div className="user-profile-widget">
          <div className="user-avatar-shell">
            <div className="user-avatar-glow" />
            <div className="user-initial-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="user-pulse-status" />
          </div>
          {!isCollapsed && (
            <div className="user-details-box">
              <span className="profile-name">{userName}</span>
              <span className={`profile-badge ${badge.class}`}>{badge.label}</span>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Items */}
        <div className="navigation-scroll-area">
          {getNavigationGroups().map((group, groupIdx) => (
            <div key={groupIdx} className="nav-group-section">
              {!isCollapsed && <div className="nav-group-title">{group.group}</div>}
              <ul className="nav-items-list">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const itemActive = isActive(item.path) && !item.isSpecial;
                  
                  return (
                    <li key={itemIdx} className="nav-item-li">
                      {item.action ? (
                        <a 
                          href={item.path} 
                          onClick={item.action}
                          className={`sidebar-nav-link ${item.isSpecial ? 'special-ai-link' : ''}`}
                        >
                          <span className="link-icon-container">
                            <Icon size={18} />
                          </span>
                          {!isCollapsed && <span className="link-text-label">{item.label}</span>}
                          {item.isSpecial && !isCollapsed && <span className="ai-spark-pill">Live</span>}
                          
                          {/* Collapsed Tooltip */}
                          {isCollapsed && (
                            <span className="floating-sidebar-tooltip">
                              {item.label}
                            </span>
                          )}
                        </a>
                      ) : (
                        <Link 
                          to={item.path} 
                          className={`sidebar-nav-link ${itemActive ? 'active' : ''}`}
                        >
                          <span className="link-icon-container">
                            <Icon size={18} />
                          </span>
                          {!isCollapsed && <span className="link-text-label">{item.label}</span>}
                          
                          {/* Collapsed Tooltip */}
                          {isCollapsed && (
                            <span className="floating-sidebar-tooltip">
                              {item.label}
                            </span>
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Settings & Logout */}
        <div className="sidebar-footer">
          <ul className="nav-items-list">
            <li className="nav-item-li">
              <button className="sidebar-nav-link logout-trigger-btn" onClick={handleLogout}>
                <span className="link-icon-container text-danger">
                  <LogOut size={18} />
                </span>
                {!isCollapsed && <span className="link-text-label text-danger">Sign Out</span>}
                
                {isCollapsed && (
                  <span className="floating-sidebar-tooltip danger-tooltip">
                    Sign Out
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>

      </aside>
    </>
  );
}

export default Sidebar;
