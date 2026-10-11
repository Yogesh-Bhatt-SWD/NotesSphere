import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { mockCurrentUser } from '../../mock/mockData';
import './Header.css';

export function Header({
  title,
  subtitle = "How it's going on ?",
  badgeText = null,
  onSearchChange,
  searchPlaceholder = "Search Journal...",
  onToggleMobileMenu,
}) {
  const { user } = useAuth();
  const currentUser = user || mockCurrentUser;
  const userName = currentUser?.name || currentUser?.username || (user ? 'Member' : 'Arthur Fen');
  const displayName = title || `Hello, ${userName}`;

  return (
    <header className="app-header">
      <div className="header-greeting-section">
        <div className="header-title-row">
          {onToggleMobileMenu && (
            <button
              className="mobile-menu-btn"
              onClick={onToggleMobileMenu}
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
          )}
          <h1 className="header-title">{displayName}</h1>
          {badgeText && <Badge variant="pro">{badgeText}</Badge>}
        </div>
        <p className="header-subtitle">{subtitle}</p>
      </div>

      <div className="header-actions-section">
        {/* Notification Button */}
        <button className="header-notification-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        {/* Pill Search Input */}
        <div className="header-search-box">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '16px',
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 18px 12px 42px',
                borderRadius: '9999px',
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                outline: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
