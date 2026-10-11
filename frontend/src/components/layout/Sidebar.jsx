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
  Users
} from 'lucide-react';
import { PillNumber } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

export function Sidebar({ unreadCount = 4, className = '' }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Analytics', path: '/analytics', icon: LineChart },
    { label: 'Journal', path: '/journals', icon: BookOpen },
    { label: 'Communities', path: '/communities', icon: Users },
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

      {/* Promo Card Matching Image B */}
      <div className="sidebar-promo-card">
        <div className="promo-tag">FREE 1 Month Pro</div>
        <div className="promo-title" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
          Unlock advanced insights and themes
        </div>
        <button
          className="promo-btn"
          onClick={() => navigate('/analytics')}
          title="Unlock Pro Insights"
          aria-label="Unlock Pro Insights"
          style={{ marginTop: '12px' }}
        >
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Bottom Footer Actions */}
      <div className="sidebar-footer">
        <NavLink to="/settings" className="footer-link">
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
        <button onClick={handleLogout} className="footer-link logout">
          <LogOut size={18} />
          <span>Quit</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
