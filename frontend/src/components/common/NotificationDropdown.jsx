import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, UserPlus, Bell, Check, ExternalLink } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import './NotificationDropdown.css';

function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 30) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (_) {
    return 'Recently';
  }
}

export function NotificationDropdown({ isOpen, onClose }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const {
    notifications,
    loadingNotifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotification();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markNotificationAsRead(notif.id);
    }
    onClose();
    if (notif.targetUrl) {
      navigate(notif.targetUrl);
    }
  };

  const renderIcon = (notif) => {
    if (notif.senderAvatarUrl) {
      return (
        <img
          src={notif.senderAvatarUrl}
          alt={notif.senderUsername || 'User'}
          className="notif-avatar"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }

    switch (notif.type) {
      case 'JOURNAL_PUBLISHED':
        return (
          <div className="notif-icon-badge notif-icon-journal">
            <BookOpen size={16} />
          </div>
        );
      case 'NEW_MESSAGE':
        return (
          <div className="notif-icon-badge notif-icon-message">
            <MessageSquare size={16} />
          </div>
        );
      case 'FRIEND_REQUEST_RECEIVED':
      case 'FRIEND_REQUEST_ACCEPTED':
        return (
          <div className="notif-icon-badge notif-icon-friend">
            <UserPlus size={16} />
          </div>
        );
      default:
        return (
          <div className="notif-icon-badge notif-icon-general">
            <Bell size={16} />
          </div>
        );
    }
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      {/* Header */}
      <div className="notif-dropdown-header">
        <div className="notif-dropdown-title-row">
          <span className="notif-dropdown-title">Notifications</span>
          {unreadNotificationCount > 0 && (
            <span className="notif-count-pill">
              {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount} new
            </span>
          )}
        </div>
        {unreadNotificationCount > 0 && (
          <button
            type="button"
            className="notif-mark-all-btn"
            onClick={(e) => {
              e.stopPropagation();
              markAllNotificationsAsRead();
            }}
            title="Mark all notifications as read"
          >
            <Check size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="notif-dropdown-list">
        {loadingNotifications && notifications.length === 0 ? (
          <div className="notif-empty-state">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty-state">
            <Bell size={28} style={{ opacity: 0.35, marginBottom: 8 }} />
            <p>No notifications yet</p>
            <span>Updates about friends, journals, and chats will appear here</span>
          </div>
        ) : (
          notifications.slice(0, 15).map((notif) => (
            <div
              key={notif.id}
              className={`notif-item ${notif.isRead ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(notif)}
              role="button"
              tabIndex={0}
            >
              <div className="notif-item-left">
                {renderIcon(notif)}
              </div>
              <div className="notif-item-content">
                <div className="notif-item-header">
                  <span className="notif-item-title">{notif.title}</span>
                  <span className="notif-item-time">{formatRelativeTime(notif.createdAt)}</span>
                </div>
                <p className="notif-item-message">{notif.message}</p>
              </div>
              {!notif.isRead && <span className="notif-unread-dot" />}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="notif-dropdown-footer">
        <button
          type="button"
          className="notif-view-all-link"
          onClick={() => {
            onClose();
            navigate('/notifications');
          }}
        >
          <span>View all notifications</span>
          <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
}

export default NotificationDropdown;
