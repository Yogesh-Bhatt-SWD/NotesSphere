import { Client } from '@stomp/stompjs';

/**
 * Singleton WebSocket service wrapping STOMP client with auto-reconnect,
 * destination authorization, and subscription lifecycle management.
 */
class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.statusListeners = new Set();
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
      if (onConnectCallback) onConnectCallback(frame);
    };

    this.client.onStompError = (frame) => {
      const msg = frame.headers?.['message'] || '';
      console.warn('STOMP Broker error:', msg, frame.body);
      if (msg.includes('Unauthorized')) {
        this.client?.deactivate();
      }
      if (onErrorCallback) onErrorCallback(frame);
    };

    this.client.onWebSocketClose = () => {
      this.connected = false;
      this.notifyStatus(false);
    };

    this.client.activate();
  }

  /**
   * Disconnect and clear all active subscriptions.
   */
  disconnect() {
    if (this.client) {
      this.subscriptions.forEach((sub) => {
        try { sub.unsubscribe(); } catch (_) {}
      });
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
      this.connected = false;
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
      this.subscriptions.get(dest).unsubscribe();
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
      try { sub.unsubscribe(); } catch (_) {}
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
      this.subscriptions.get(dest).unsubscribe();
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
      try { sub.unsubscribe(); } catch (_) {}
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
}

export const websocketService = new WebSocketService();
export default websocketService;
