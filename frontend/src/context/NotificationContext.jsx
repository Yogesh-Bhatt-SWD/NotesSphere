import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../api/notificationService';
import chatService from '../api/chatService';
import websocketService from '../api/websocketService';

import '../components/common/InAppToast.css';

// Crisp Web Audio notification chime (cross-browser, zero external asset dependencies)
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (_) {}
}

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inAppToast, setInAppToast] = useState(null);

  // Keep a ref of processed notification IDs to avoid duplicate increments from rapid events/tabs
  const processedEventIds = useRef(new Set());
  const toastTimerRef = useRef(null);
  const prevMsgCountRef = useRef(null);

  const showInAppToast = useCallback(({ title, body, avatarUrl, url }) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setInAppToast({ title, body, avatarUrl, url, id: Date.now() });
    toastTimerRef.current = setTimeout(() => {
      setInAppToast(null);
    }, 5000);
  }, []);

  const handleToastClick = useCallback((url) => {
    setInAppToast(null);
    if (!url) return;
    if (window.location.pathname + window.location.search === url) return;
    window.history.pushState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  // 1. Refresh counts from backend
  const refreshCounts = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const [msgCount, notifCount] = await Promise.all([
        chatService.getUnreadCount().catch(() => 0),
        notificationService.getUnreadCount().catch(() => 0),
      ]);
      setUnreadMessageCount(msgCount);
      setUnreadNotificationCount(notifCount);

      if (prevMsgCountRef.current !== null && msgCount > prevMsgCountRef.current) {
        playNotificationChime();
        // Also refresh the notification list if count increased
        notificationService.getNotifications(0, 20)
          .then((res) => setNotifications(res?.content || []))
          .catch(() => {});
      }
      prevMsgCountRef.current = msgCount;
    } catch (err) {
      console.warn('Failed to refresh unread counts:', err);
    }
  }, [isAuthenticated, user?.id]);

  // 2. Refresh notification list
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    setLoadingNotifications(true);
    try {
      const res = await notificationService.getNotifications(0, 20);
      setNotifications(res?.content || []);
    } catch (err) {
      console.warn('Failed to refresh notifications list:', err);
    } finally {
      setLoadingNotifications(false);
    }
  }, [isAuthenticated, user?.id]);

  // 3. Initial load & background reconciliation
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshCounts();
      refreshNotifications();

      // Ensure WebSocket connection is initialized with stored token
      const token = localStorage.getItem('notesphere_access_token');
      if (token) {
        websocketService.connect(token);
      }

      // Responsive background polling fallback (every 2.5s) to guarantee instantaneous count updates
      const pollTimer = setInterval(() => {
        refreshCounts();
      }, 2500);

      // Instant reconciliation when user returns to this tab or window gains focus
      const handleTabSync = () => {
        if (document.visibilityState === 'visible') {
          refreshCounts();
          refreshNotifications();
        }
      };
      window.addEventListener('focus', handleTabSync);
      document.addEventListener('visibilitychange', handleTabSync);

      return () => {
        clearInterval(pollTimer);
        window.removeEventListener('focus', handleTabSync);
        document.removeEventListener('visibilitychange', handleTabSync);
      };
    } else {
      setUnreadMessageCount(0);
      setUnreadNotificationCount(0);
      setNotifications([]);
    }
  }, [isAuthenticated, user?.id, refreshCounts, refreshNotifications]);

  // 4. WebSocket subscription & Reconnection Reconciliation
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    // A. Reconnection listener: reconcile state after connection drops or sleeping tab resumes
    const unsubReconnect = websocketService.onReconnect(() => {
      refreshCounts();
      refreshNotifications();
    });

    // B. Handle incoming notification STOMP frames
    const handleNotification = (payload) => {
      if (!payload) return;

      // Deduplication check using unique payload ID or deduplication signature
      const eventKey = payload.id || `${payload.type}_${payload.targetId || payload.conversationId}_${payload.timestamp}`;
      if (processedEventIds.current.has(eventKey)) {
        return;
      }
      processedEventIds.current.add(eventKey);
      if (processedEventIds.current.size > 200) {
        // Limit set memory
        const arr = Array.from(processedEventIds.current);
        processedEventIds.current = new Set(arr.slice(arr.length - 100));
      }

      // 1. Update Chat Unread Count
      if (payload.unreadMessageCount !== undefined && payload.unreadMessageCount !== null) {
        setUnreadMessageCount(payload.unreadMessageCount);
      } else if (payload.type === 'NEW_MESSAGE') {
        // Never count messages sent by current user
        if (payload.senderId !== user.id) {
          setUnreadMessageCount((prev) => prev + 1);
        }
      } else if (payload.type === 'CONVERSATION_READ') {
        if (payload.unreadMessageCount !== undefined && payload.unreadMessageCount !== null) {
          setUnreadMessageCount(payload.unreadMessageCount);
        } else {
          chatService.getUnreadCount().then(setUnreadMessageCount).catch(() => {});
        }
      }

      // Trigger audio chime and toast banner for incoming friend messages
      if (payload.type === 'NEW_MESSAGE' && payload.senderId !== user.id) {
        playNotificationChime();
        showInAppToast({
          title: `New message from ${payload.senderUsername || 'Friend'}`,
          body: payload.message || 'Sent a message',
          avatarUrl: payload.senderAvatarUrl,
          url: payload.targetUrl || `/chat?conversationId=${payload.conversationId}`,
        });
      }

      // 2. Update In-App Notification Count & List
      if (payload.unreadNotificationCount !== undefined && payload.unreadNotificationCount !== null) {
        setUnreadNotificationCount(payload.unreadNotificationCount);
      } else if (
        payload.type === 'JOURNAL_PUBLISHED' ||
        payload.type === 'FRIEND_REQUEST_RECEIVED' ||
        payload.type === 'FRIEND_REQUEST_ACCEPTED'
      ) {
        setUnreadNotificationCount((prev) => prev + 1);
      }

      // 3. Add to notification list if not a read acknowledgment
      if (payload.type !== 'CONVERSATION_READ') {
        const newNotif = {
          id: payload.id || `notif_${Date.now()}_${Math.random()}`,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          senderId: payload.senderId,
          senderUsername: payload.senderUsername,
          senderAvatarUrl: payload.senderAvatarUrl,
          targetType: payload.targetType || (payload.type === 'NEW_MESSAGE' ? 'CONVERSATION' : 'JOURNAL'),
          targetId: payload.targetId || payload.conversationId,
          targetUrl: payload.targetUrl || (payload.conversationId ? `/chat?conversationId=${payload.conversationId}` : '/'),
          isRead: false,
          createdAt: payload.timestamp || new Date().toISOString(),
        };

        setNotifications((prev) => {
          // Avoid duplicate entry in list
          if (prev.some((n) => n.id === newNotif.id || (n.targetId && n.targetId === newNotif.targetId && n.type === newNotif.type))) {
            return prev;
          }
          return [newNotif, ...prev];
        });
      }
    };

    const unsubNotif = websocketService.subscribeToNotifications(user.id, handleNotification);

    return () => {
      if (unsubNotif) unsubNotif();
      if (unsubReconnect) unsubReconnect();
    };
  }, [isAuthenticated, user?.id, refreshCounts, refreshNotifications]);

  // 5. Mark single notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
    setUnreadNotificationCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationService.markAsRead(notificationId);
    } catch (err) {
      console.warn('Failed to mark notification as read on backend:', err);
      refreshCounts();
    }
  }, [refreshCounts]);

  // 6. Explicitly mark all notifications as read
  const markAllNotificationsAsRead = useCallback(async () => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadNotificationCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn('Failed to mark all notifications as read on backend:', err);
      refreshCounts();
    }
  }, [refreshCounts]);

  const value = {
    unreadMessageCount,
    setUnreadMessageCount,
    unreadNotificationCount,
    setUnreadNotificationCount,
    notifications,
    loadingNotifications,
    isDropdownOpen,
    setIsDropdownOpen,
    refreshCounts,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    showInAppToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {inAppToast && (
        <div className="notesphere-toast-container">
          <div
            className="notesphere-inapp-toast"
            onClick={() => handleToastClick(inAppToast.url)}
            role="button"
            tabIndex={0}
          >
            <div className="toast-avatar-icon">
              {inAppToast.avatarUrl ? (
                <img src={inAppToast.avatarUrl} alt="" />
              ) : (
                '💬'
              )}
            </div>
            <div className="toast-body-wrapper">
              <span className="toast-sender-title">{inAppToast.title}</span>
              <span className="toast-snippet">{inAppToast.body}</span>
            </div>
            <button
              className="toast-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                setInAppToast(null);
              }}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
