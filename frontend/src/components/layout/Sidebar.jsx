import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LineChart,
  BookOpen,
  CalendarDays,
  BellRing,
  Settings,
  LogOut,
  Sparkles,
  ArrowRight,
  Users,
  UserPlus,
  MessageSquare
} from 'lucide-react';
import { PillNumber } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

export function Sidebar({ unreadCount = 4, className = '' }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'My Journals', path: '/journals', icon: BookOpen },
    { label: 'Communities', path: '/communities', icon: Users },
    { label: 'Friends', path: '/friends', icon: UserPlus },
    { label: 'Chats', path: '/chat', icon: MessageSquare },
    { label: 'Analytics', path: '/analytics', icon: LineChart },
    { label: 'Calendar', path: '/calendar', icon: CalendarDays },
    { label: 'Tags', path: '/tags', icon: Sparkles },
    { label: 'Reminders', path: '/reminders', icon: BellRing },
  ];

  return (
    <aside className={`sidebar ${className}`}>
      {/* Brand Logo */}
      <NavLink to="/" className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <BookOpen size={22} />
        </div>
        <span className="sidebar-logo-text">
          Note<span>Sphere</span>
        </span>
      </NavLink>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">
                <Icon size={20} />
              </span>
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="nav-badge">
                  <PillNumber count={item.badge} />
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="sidebar-footer">
        <NavLink to="/settings" className="footer-link">
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
        <button onClick={handleLogout} className="footer-link logout" title="Log out of NoteSphere">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
