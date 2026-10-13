import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUser = user || mockCurrentUser;
  const userName = currentUser?.name || currentUser?.fullName || currentUser?.username || (user ? 'Member' : 'Arthur Fen');
  const userInitial = userName.charAt(0).toUpperCase();
  const userFirstName = userName.split(' ')[0];
  const avatarUrl = currentUser?.avatarUrl || currentUser?.avatar || null;
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

        {/* User Profile Avatar Pill */}
        <div
          className="header-user-avatar-pill"
          onClick={() => navigate('/settings')}
          title="Account Settings & Profile"
          role="button"
          tabIndex={0}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="header-avatar-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div
            className="header-avatar-initial"
            style={{ display: avatarUrl ? 'none' : 'flex' }}
          >
            {userInitial}
          </div>
          <span className="header-user-name-label">{userFirstName}</span>
        </div>

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
