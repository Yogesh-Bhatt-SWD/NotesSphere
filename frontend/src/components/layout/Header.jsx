import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, X } from 'lucide-react';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { mockCurrentUser } from '../../mock/mockData';
import { GlobalSearchDropdown } from '../common/GlobalSearchDropdown';
import './Header.css';

export function Header({
  title,
  subtitle = "How it's going on ?",
  badgeText = null,
  onSearchChange,
  searchPlaceholder = "Search NoteSphere...",
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

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 300ms debounce for global search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.trim().length > 0) {
        setIsDropdownOpen(true);
      } else {
        setIsDropdownOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

        {/* Pill Search Input with Global Discovery Dropdown */}
        <div className="header-search-box" style={{ position: 'relative' }}>
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
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (onSearchChange) onSearchChange(val);
              }}
              onFocus={() => {
                if (debouncedQuery.trim().length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = searchQuery.trim();
                  if (trimmed) {
                    setIsDropdownOpen(false);
                    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
                  }
                } else if (e.key === 'Escape') {
                  setIsDropdownOpen(false);
                }
              }}
              style={{
                width: '100%',
                padding: '12px 38px 12px 42px',
                borderRadius: '9999px',
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                outline: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                  setIsDropdownOpen(false);
                  if (onSearchChange) onSearchChange('');
                }}
                style={{
                  position: 'absolute',
                  right: '14px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Interactive Global Search Dropdown */}
          <GlobalSearchDropdown
            query={debouncedQuery}
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
          />
        </div>
      </div>
    </header>
  );
}

export default Header;

