import { Client } from '@stomp/stompjs';

/**
 * Resilient Singleton WebSocket service wrapping STOMP client with auto-reconnect,
 * persistent subscription registry (reconnect-safe & pre-connect registration safe),
 * heartbeat management, and status notifications.
 */
class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.hasConnectedBefore = false;
    // Registry of desired subscriptions: destination -> Set<callback>
    this.registeredSubscriptions = new Map();
    // Live STOMP subscription objects: destination -> StompSubscription
    this.activeStompSubscriptions = new Map();
    this.statusListeners = new Set();
    this.reconnectListeners = new Set();
    this.heartbeatTimer = null;
    this.currentToken = null;
  }

  /**
   * Connect to backend WebSocket with JWT credentials.
   */
  connect(token, onConnectCallback, onErrorCallback) {
    if (!token || token === 'null' || token === 'undefined') {
      return;
    }
    this.currentToken = token;

    if (this.client && this.client.active) {
      if (this.connected && onConnectCallback) {
        onConnectCallback();
      }
      return;
    }

    let brokerURL = import.meta.env.VITE_WS_URL;
    if (!brokerURL) {
      if (import.meta.env.VITE_BACKEND_URL && !import.meta.env.DEV) {
        let wsBackend = import.meta.env.VITE_BACKEND_URL.replace(/^http/, 'ws');
        // Prevent browser SecurityError / Mixed Content blocking on HTTPS deployments
        if (typeof window !== 'undefined' && window.location.protocol === 'https:' && wsBackend.startsWith('ws://')) {
          brokerURL = `wss://${window.location.host}/ws`;
        } else {
          brokerURL = `${wsBackend}/ws`;
        }
      } else if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        brokerURL = `${protocol}//${window.location.host}/ws`;
      }
    }

    this.client = new Client({
      brokerURL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    this.client.onConnect = (frame) => {
      this.connected = true;
      this.notifyStatus(true);

      // Re-establish/activate all registered destination subscriptions
      this.registeredSubscriptions.forEach((_, dest) => {
        this._subscribeStomp(dest);
      });

      // Start periodic presence heartbeat ping
      this.startHeartbeat();

      // Trigger reconnect handlers if recovering from connection drop
      if (this.hasConnectedBefore) {
        this.notifyReconnect();
      }
      this.hasConnectedBefore = true;

      if (onConnectCallback) onConnectCallback(frame);
    };

    this.client.onStompError = (frame) => {
      const msg = frame.headers?.['message'] || '';
      console.warn('STOMP Broker error:', msg, frame.body);
      if (msg.includes('Unauthorized') || msg.includes('Access denied')) {
        this.client?.deactivate();
      }
      if (onErrorCallback) onErrorCallback(frame);
    };

    this.client.onWebSocketClose = () => {
      this.connected = false;
      this.activeStompSubscriptions.clear();
      this.stopHeartbeat();
      this.notifyStatus(false);
    };

    this.client.activate();
  }

  /**
   * Internal helper to activate live STOMP subscription for a destination.
   */
  _subscribeStomp(dest) {
    if (!this.client || !this.connected) return;
    if (this.activeStompSubscriptions.has(dest)) return;

    try {
      const stompSub = this.client.subscribe(dest, (message) => {
        try {
          const payload = JSON.parse(message.body);
          const callbacks = this.registeredSubscriptions.get(dest);
          if (callbacks) {
            callbacks.forEach((cb) => {
              try {
                cb(payload);
              } catch (cbErr) {
                console.error('Error in subscription callback for', dest, cbErr);
              }
            });
          }
        } catch (err) {
          console.error('Failed to parse STOMP message payload on', dest, err);
        }
      });
      this.activeStompSubscriptions.set(dest, stompSub);
    } catch (err) {
      console.warn('Failed to subscribe to STOMP destination', dest, err);
    }
  }

  /**
   * Generic subscription method that registers interest immediately,
   * connects automatically once the STOMP connection is open, and
   * returns an idempotent unsubscribe function.
   */
  subscribe(dest, callback) {
    if (!dest || typeof callback !== 'function') {
      return () => {};
    }

    if (!this.registeredSubscriptions.has(dest)) {
      this.registeredSubscriptions.set(dest, new Set());
    }
    this.registeredSubscriptions.get(dest).add(callback);

    if (this.connected && this.client) {
      this._subscribeStomp(dest);
    }

    return () => {
      const callbacks = this.registeredSubscriptions.get(dest);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.registeredSubscriptions.delete(dest);
          const stompSub = this.activeStompSubscriptions.get(dest);
          if (stompSub) {
            try {
              if (this.client?.connected) {
                stompSub.unsubscribe();
              }
            } catch (_) {}
            this.activeStompSubscriptions.delete(dest);
          }
        }
      }
    };
  }

  /**
   * Start periodic heartbeat to keep presence session active.
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 20000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Send heartbeat frame over STOMP to /app/presence.heartbeat.
   */
  sendHeartbeat() {
    if (this.client && this.connected) {
      try {
        this.client.publish({
          destination: '/app/presence.heartbeat',
          body: JSON.stringify({}),
        });
      } catch (_) {}
    }
  }

  /**
   * Disconnect and clear all active subscriptions.
   */
  disconnect() {
    this.stopHeartbeat();
    if (this.client) {
      this.activeStompSubscriptions.forEach((sub) => {
        try {
          if (this.client?.connected) {
            sub.unsubscribe();
          }
        } catch (_) {}
      });
      this.activeStompSubscriptions.clear();
      this.registeredSubscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.hasConnectedBefore = false;
      this.notifyStatus(false);
    }
  }

  /**
   * Subscribe to real-time chat messages for a specific conversation.
   * Safe to call before connection finishes; automatically activates on connect/reconnect.
   */
  subscribeToConversation(conversationId, callback) {
    if (!conversationId) return () => {};
    return this.subscribe(`/topic/conversation.${conversationId}`, callback);
  }

  /**
   * Subscribe to real-time user notification channel.
   * Safe to call before connection finishes; automatically activates on connect/reconnect.
   */
  subscribeToNotifications(userId, callback) {
    if (!userId) return () => {};
    return this.subscribe(`/topic/notifications.${userId}`, callback);
  }

  /**
   * Subscribe to real-time friend presence updates for authenticated user.
   * Safe to call before connection finishes; automatically activates on connect/reconnect.
   */
  subscribeToFriendPresence(userId, callback) {
    if (!userId) return () => {};
    return this.subscribe(`/topic/presence.friends.${userId}`, callback);
  }

  /**
   * Send a chat message over STOMP /app/chat.send.
   */
  sendMessage(conversationId, content) {
    if (!this.client || !this.connected) {
      throw new Error('WebSocket connection is not open');
    }
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ conversationId, content }),
    });
  }

  /**
   * Register a connection status listener.
   */
  onStatusChange(listener) {
    this.statusListeners.add(listener);
    listener(this.connected);
    return () => this.statusListeners.delete(listener);
  }

  notifyStatus(status) {
    this.statusListeners.forEach((fn) => {
      try { fn(status); } catch (_) {}
    });
  }

  /**
   * Register a reconnect listener to restore state after connection drops.
   */
  onReconnect(listener) {
    this.reconnectListeners.add(listener);
    return () => this.reconnectListeners.delete(listener);
  }

  notifyReconnect() {
    this.reconnectListeners.forEach((fn) => {
      try { fn(); } catch (_) {}
    });
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
