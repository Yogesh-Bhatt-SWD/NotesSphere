import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import websocketService from '../api/websocketService';
import presenceService from '../api/presenceService';

const PresenceContext = createContext(null);

export function PresenceProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [presenceMap, setPresenceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  // Fetch initial presence map from REST API
  const refreshPresence = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setPresenceMap({});
      setLoading(false);
      return;
    }

    try {
      const friendsPresence = await presenceService.getFriendsPresence();
      setPresenceMap((prev) => {
        const next = { ...prev };
        friendsPresence.forEach((item) => {
          if (item?.userId) {
            next[item.userId] = {
              online: Boolean(item.online),
              lastSeenAt: item.lastSeenAt || null,
            };
          }
        });
        return next;
      });
    } catch (err) {
      console.warn('Could not refresh friends presence:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Handle STOMP WebSocket lifecycle & presence subscriptions
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setPresenceMap({});
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('notesphere_access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let unsubscribePresence = null;

    // 1. Initial REST fetch of friends' current presence
    refreshPresence();

    // 2. Establish global STOMP WebSocket connection
    websocketService.connect(
      token,
      () => {
        if (!isMounted) return;
        setWsConnected(true);

        // 3. Subscribe to real-time presence feed for authenticated user's friends
        unsubscribePresence = websocketService.subscribeToFriendPresence(user.id, (event) => {
          if (!event?.userId) return;
          setPresenceMap((prev) => ({
            ...prev,
            [event.userId]: {
              online: Boolean(event.online),
              lastSeenAt: event.lastSeenAt || null,
            },
          }));
        });
      },
      () => {
        if (isMounted) setWsConnected(false);
      }
    );

    // 4. Listen for connection status changes
    const unsubStatus = websocketService.onStatusChange((status) => {
      if (isMounted) {
        setWsConnected(status);
        if (status && !unsubscribePresence) {
          unsubscribePresence = websocketService.subscribeToFriendPresence(user.id, (event) => {
            if (!event?.userId) return;
            setPresenceMap((prev) => ({
              ...prev,
              [event.userId]: {
                online: Boolean(event.online),
                lastSeenAt: event.lastSeenAt || null,
              },
            }));
          });
        }
      }
    });

    // 5. Restore latest presence state after reconnecting from network drops
    const unsubReconnect = websocketService.onReconnect(() => {
      if (isMounted) {
        refreshPresence();
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribePresence) {
        unsubscribePresence();
      }
      unsubStatus();
      unsubReconnect();
    };
  }, [isAuthenticated, user?.id, refreshPresence]);

  /**
   * Helper to query presence status for any friend by userId.
   * Returns: { online: boolean, lastSeenAt: string | null, isLoaded: boolean }
   */
  const getPresence = useCallback(
    (friendId) => {
      if (!friendId) {
        return { online: false, lastSeenAt: null, isLoaded: false };
      }
      const record = presenceMap[friendId];
      if (!record) {
        return { online: false, lastSeenAt: null, isLoaded: !loading };
      }
      return {
        online: record.online,
        lastSeenAt: record.lastSeenAt,
        isLoaded: true,
      };
    },
    [presenceMap, loading]
  );

  /**
   * Convenience check if a friend is online.
   */
  const isOnline = useCallback(
    (friendId) => {
      return Boolean(presenceMap[friendId]?.online);
    },
    [presenceMap]
  );

  const value = {
    presenceMap,
    loading,
    wsConnected,
    refreshPresence,
    getPresence,
    isOnline,
  };

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}

export default PresenceContext;
