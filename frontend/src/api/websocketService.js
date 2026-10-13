import { Client } from '@stomp/stompjs';

/**
 * Singleton WebSocket service wrapping STOMP client with auto-reconnect,
 * destination authorization, heartbeat management, and subscription lifecycle management.
 */
class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.hasConnectedBefore = false;
    this.subscriptions = new Map();
    this.statusListeners = new Set();
    this.reconnectListeners = new Set();
    this.heartbeatTimer = null;
  }

  /**
   * Connect to backend WebSocket with JWT credentials.
   */
  connect(token, onConnectCallback, onErrorCallback) {
    if (!token || token === 'null' || token === 'undefined') {
      return;
    }

    if (this.client && this.client.active) {
      if (this.connected && onConnectCallback) {
        onConnectCallback();
      }
      return;
    }

    let brokerURL = import.meta.env.VITE_WS_URL;
    if (!brokerURL) {
      if (import.meta.env.VITE_BACKEND_URL && !import.meta.env.DEV) {
        const wsBackend = import.meta.env.VITE_BACKEND_URL.replace(/^http/, 'ws');
        brokerURL = `${wsBackend}/ws`;
      } else {
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
      this.stopHeartbeat();
      this.notifyStatus(false);
    };

    this.client.activate();
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
      this.subscriptions.forEach((sub) => {
        try {
          if (this.client?.connected) {
            sub.unsubscribe();
          }
        } catch (_) {}
      });
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.hasConnectedBefore = false;
      this.notifyStatus(false);
    }
  }

  /**
   * Subscribe to real-time chat messages for a specific conversation.
   */
  subscribeToConversation(conversationId, callback) {
    if (!this.client || !this.connected) return null;
    const dest = `/topic/conversation.${conversationId}`;

    if (this.subscriptions.has(dest)) {
      try {
        if (this.client?.connected) {
          this.subscriptions.get(dest).unsubscribe();
        }
      } catch (_) {}
    }

    const sub = this.client.subscribe(dest, (message) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (err) {
        console.error('Failed to parse STOMP message payload:', err);
      }
    });

    this.subscriptions.set(dest, sub);

    return () => {
      try {
        if (this.client?.connected) {
          sub.unsubscribe();
        }
      } catch (_) {}
      this.subscriptions.delete(dest);
    };
  }

  /**
   * Subscribe to real-time user notification channel.
   */
  subscribeToNotifications(userId, callback) {
    if (!this.client || !this.connected) return null;
    const dest = `/topic/notifications.${userId}`;

    if (this.subscriptions.has(dest)) {
      try {
        if (this.client?.connected) {
          this.subscriptions.get(dest).unsubscribe();
        }
      } catch (_) {}
    }

    const sub = this.client.subscribe(dest, (message) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (err) {
        console.error('Failed to parse STOMP notification payload:', err);
      }
    });

    this.subscriptions.set(dest, sub);

    return () => {
      try {
        if (this.client?.connected) {
          sub.unsubscribe();
        }
      } catch (_) {}
      this.subscriptions.delete(dest);
    };
  }

  /**
   * Subscribe to real-time friend presence updates for authenticated user.
   */
  subscribeToFriendPresence(userId, callback) {
    if (!this.client || !this.connected) return null;
    const dest = `/topic/presence.friends.${userId}`;

    if (this.subscriptions.has(dest)) {
      try {
        if (this.client?.connected) {
          this.subscriptions.get(dest).unsubscribe();
        }
      } catch (_) {}
    }

    const sub = this.client.subscribe(dest, (message) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (err) {
        console.error('Failed to parse presence STOMP payload:', err);
      }
    });

    this.subscriptions.set(dest, sub);

    return () => {
      try {
        if (this.client?.connected) {
          sub.unsubscribe();
        }
      } catch (_) {}
      this.subscriptions.delete(dest);
    };
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
