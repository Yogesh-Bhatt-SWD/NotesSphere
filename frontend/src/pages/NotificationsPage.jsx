import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  MessageSquare,
  UserPlus,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Filter
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useNotification } from '../context/NotificationContext';
import notificationService from '../api/notificationService';
import './NotificationsPage.css';

function formatFullTime(dateString) {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return 'Recently';
  }
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const {
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshCounts
  } = useNotification();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'

  const loadAllNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(0, 50);
      setNotifications(res?.content || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllNotifications();
  }, []);

  const handleItemClick = (notif) => {
    if (!notif.isRead) {
      markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    if (notif.targetUrl) {
      navigate(notif.targetUrl);
    }
  };

  const handleMarkAsRead = async (e, notifId) => {
    e.stopPropagation();
    markNotificationAsRead(notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
  };

  const handleDelete = async (e, notifId) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      refreshCounts();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleMarkAll = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  const renderIcon = (notif) => {
    if (notif.senderAvatarUrl) {
      return (
        <img
          src={notif.senderAvatarUrl}
          alt={notif.senderUsername || 'User'}
          className="notif-page-avatar"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }

    switch (notif.type) {
      case 'JOURNAL_PUBLISHED':
        return (
          <div className="notif-page-icon-badge notif-icon-journal">
            <BookOpen size={18} />
          </div>
        );
      case 'NEW_MESSAGE':
        return (
          <div className="notif-page-icon-badge notif-icon-message">
            <MessageSquare size={18} />
          </div>
        );
      case 'FRIEND_REQUEST_RECEIVED':
      case 'FRIEND_REQUEST_ACCEPTED':
        return (
          <div className="notif-page-icon-badge notif-icon-friend">
            <UserPlus size={18} />
          </div>
        );
      default:
        return (
          <div className="notif-page-icon-badge notif-icon-general">
            <Bell size={18} />
          </div>
        );
    }
  };

  return (
    <div className="notifications-page">
      <Header
        title="Notification Center"
        subtitle="Manage your journal updates, connection requests, and messages"
      />

      <div className="notifications-container">
        {/* Actions Bar */}
        <div className="notif-action-bar">
          <div className="notif-filter-tabs">
            <button
              className={`notif-tab ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All Notifications
              <span className="notif-tab-count">{notifications.length}</span>
            </button>
            <button
              className={`notif-tab ${filter === 'UNREAD' ? 'active' : ''}`}
              onClick={() => setFilter('UNREAD')}
            >
              Unread
              {unreadNotificationCount > 0 && (
                <span className="notif-tab-count unread">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>
          </div>

          {unreadNotificationCount > 0 && (
            <button className="notif-page-mark-all-btn" onClick={handleMarkAll}>
              <CheckCheck size={16} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* List Content */}
        <div className="notif-cards-list">
          {loading ? (
            <div className="notif-page-empty">
              <p>Loading your notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notif-page-empty">
              <Bell size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <h3>{filter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}</h3>
              <p>
                {filter === 'UNREAD'
                  ? 'You have caught up with all your notifications!'
                  : 'Notifications about published journals and new friend interactions will appear here.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`notif-card ${notif.isRead ? 'read' : 'unread'}`}
                onClick={() => handleItemClick(notif)}
              >
                <div className="notif-card-icon-area">{renderIcon(notif)}</div>

                <div className="notif-card-body">
                  <div className="notif-card-header">
                    <h4 className="notif-card-title">{notif.title}</h4>
                    <span className="notif-card-time">{formatFullTime(notif.createdAt)}</span>
                  </div>
                  <p className="notif-card-message">{notif.message}</p>
                </div>

                <div className="notif-card-actions" onClick={(e) => e.stopPropagation()}>
                  {!notif.isRead && (
                    <button
                      className="notif-card-btn mark-read"
                      title="Mark as read"
                      onClick={(e) => handleMarkAsRead(e, notif.id)}
                    >
                      <Check size={15} />
                    </button>
                  )}
                  {notif.targetUrl && (
                    <button
                      className="notif-card-btn navigate"
                      title="Open target"
                      onClick={() => {
                        if (!notif.isRead) markNotificationAsRead(notif.id);
                        navigate(notif.targetUrl);
                      }}
                    >
                      <ExternalLink size={15} />
                    </button>
                  )}
                  <button
                    className="notif-card-btn delete"
                    title="Delete notification"
                    onClick={(e) => handleDelete(e, notif.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
