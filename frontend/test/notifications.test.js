import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

describe('NoteSphere Notification System Test Suite', () => {

  test('Required notification files and components exist', () => {
    const requiredFiles = [
      'api/notificationService.js',
      'api/chatService.js',
      'api/websocketService.js',
      'context/NotificationContext.jsx',
      'components/common/NotificationDropdown.jsx',
      'components/common/NotificationDropdown.css',
      'pages/NotificationsPage.jsx',
      'pages/NotificationsPage.css',
      'components/layout/Header.jsx',
      'components/layout/Sidebar.jsx',
      'pages/ChatPage.jsx',
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(srcDir, relPath);
      assert.ok(fs.existsSync(fullPath), `Missing required file: ${relPath}`);
    }
  });

  test('NotificationService provides endpoints for unread counts, pagination, and mark-as-read', () => {
    const code = fs.readFileSync(path.join(srcDir, 'api/notificationService.js'), 'utf-8');
    assert.ok(code.includes('/notifications?page='), 'Must support paginated notifications retrieval');
    assert.ok(code.includes('/notifications/unread-count'), 'Must support unread count endpoint');
    assert.ok(code.includes('/read'), 'Must support markAsRead');
    assert.ok(code.includes('/notifications/read-all'), 'Must support explicit markAllAsRead');
    assert.ok(code.includes('deleteNotification'), 'Must support deleteNotification');
  });

  test('ChatService supports getUnreadCount and upToMessageId in markAsRead', () => {
    const code = fs.readFileSync(path.join(srcDir, 'api/chatService.js'), 'utf-8');
    assert.ok(code.includes('getUnreadCount'), 'ChatService must provide getUnreadCount');
    assert.ok(code.includes('/conversations/unread-count'), 'Must query backend for total unread messages');
    assert.ok(code.includes('upToMessageId'), 'Must support marking read only up to displayed message ID');
  });

  test('NotificationContext manages persistent unread counts, dedup, and reconnection reconciliation', () => {
    const code = fs.readFileSync(path.join(srcDir, 'context/NotificationContext.jsx'), 'utf-8');
    assert.ok(code.includes('unreadMessageCount'), 'Context must track unreadMessageCount');
    assert.ok(code.includes('unreadNotificationCount'), 'Context must track unreadNotificationCount');
    assert.ok(code.includes('subscribeToNotifications'), 'Context must subscribe to personal notification channel');
    assert.ok(code.includes('onReconnect'), 'Context must register reconnection handler to reconcile missed events');
    assert.ok(code.includes('processedEventIds'), 'Must track processed event IDs to prevent duplicate increments');
    assert.ok(code.includes('markNotificationAsRead'), 'Context must provide markNotificationAsRead');
    assert.ok(code.includes('markAllNotificationsAsRead'), 'Context must provide markAllNotificationsAsRead');
  });

  test('Header renders real-time notification badge and interactive dropdown', () => {
    const headerCode = fs.readFileSync(path.join(srcDir, 'components/layout/Header.jsx'), 'utf-8');
    assert.ok(headerCode.includes('useNotification'), 'Header must consume NotificationContext');
    assert.ok(headerCode.includes('header-notification-badge'), 'Header must render notification badge');
    assert.ok(headerCode.includes('99+'), 'Header badge must cap display at 99+');
    assert.ok(headerCode.includes('NotificationDropdown'), 'Header must mount NotificationDropdown');
  });

  test('Sidebar displays unread badges on Chats and Notifications capped at 99+ and hidden when zero', () => {
    const sidebarCode = fs.readFileSync(path.join(srcDir, 'components/layout/Sidebar.jsx'), 'utf-8');
    assert.ok(sidebarCode.includes('useNotification'), 'Sidebar must consume NotificationContext');
    assert.ok(sidebarCode.includes("label: 'Chats'"), 'Sidebar must have Chats item');
    assert.ok(sidebarCode.includes("unreadMessageCount > 0 ? (unreadMessageCount > 99 ? '99+' : unreadMessageCount) : undefined"),
      'Chats item badge must be capped at 99+ and undefined/hidden when 0');
    assert.ok(sidebarCode.includes("label: 'Notifications'"), 'Sidebar must have Notifications item');
    assert.ok(sidebarCode.includes("unreadNotificationCount > 0 ? (unreadNotificationCount > 99 ? '99+' : unreadNotificationCount) : undefined"),
      'Notifications item badge must be capped at 99+ and undefined/hidden when 0');
  });

  test('ChatPage preserves unread counts on initial visit and marks only displayed messages as read', () => {
    const chatCode = fs.readFileSync(path.join(srcDir, 'pages/ChatPage.jsx'), 'utf-8');
    assert.ok(!chatCode.includes('setSearchParams({ conversationId: convos[0].id })'),
      'Must NOT auto-select conversation 0 on initial load to avoid clearing unread count');
    assert.ok(chatCode.includes('lastMsg ? lastMsg.id : null'),
      'Must pass last displayed message ID to markAsRead');
    assert.ok(chatCode.includes('refreshCounts'),
      'Must refresh counts on reading or receiving chat messages');
  });

  test('App.jsx provides NotificationProvider and registers /notifications route', () => {
    const appCode = fs.readFileSync(path.join(srcDir, 'App.jsx'), 'utf-8');
    assert.ok(appCode.includes('<NotificationProvider>'), 'App must wrap routes in NotificationProvider');
    assert.ok(appCode.includes('path="notifications"'), 'App must register notifications route');
    assert.ok(appCode.includes('<NotificationsPage />'), 'Must mount NotificationsPage');
  });

  test('NotificationDropdown formats unread vs read distinct styling and provides mark-all-read', () => {
    const dropdownCode = fs.readFileSync(path.join(srcDir, 'components/common/NotificationDropdown.jsx'), 'utf-8');
    assert.ok(dropdownCode.includes('notif.isRead ? \'read\' : \'unread\''),
      'Must provide distinct styling for unread vs read notifications');
    assert.ok(dropdownCode.includes('notif-unread-dot'),
      'Must render unread dot indicator');
    assert.ok(dropdownCode.includes('markAllNotificationsAsRead'),
      'Must provide mark all as read action');
    assert.ok(dropdownCode.includes('navigate(notif.targetUrl)'),
      'Clicking notification must navigate to target URL');
  });

  test('websocketService resilient subscription registry handles pre-connect registration and reconnects', () => {
    const wsCode = fs.readFileSync(path.join(srcDir, 'api/websocketService.js'), 'utf-8');
    assert.ok(wsCode.includes('registeredSubscriptions'), 'Must maintain registeredSubscriptions map');
    assert.ok(wsCode.includes('activeStompSubscriptions'), 'Must track activeStompSubscriptions');
    assert.ok(wsCode.includes('_subscribeStomp'), 'Must provide internal _subscribeStomp helper');
    assert.ok(wsCode.includes('subscribeToNotifications'), 'Must provide subscribeToNotifications');
    assert.ok(wsCode.includes('subscribeToConversation'), 'Must provide subscribeToConversation');
    assert.ok(wsCode.includes('subscribeToFriendPresence'), 'Must provide subscribeToFriendPresence');
    assert.ok(wsCode.includes('wss:'), 'Must guard against mixed content on HTTPS deployments');
  });

  test('NotificationContext provides periodic polling and window focus/visibility reconciliation', () => {
    const notifCode = fs.readFileSync(path.join(srcDir, 'context/NotificationContext.jsx'), 'utf-8');
    assert.ok(notifCode.includes('setInterval'), 'Must poll counts periodically');
    assert.ok(notifCode.includes('visibilitychange'), 'Must listen to visibilitychange for instant reconciliation');
    assert.ok(notifCode.includes('focus'), 'Must listen to focus for tab return reconciliation');
    assert.ok(notifCode.includes('payload.unreadMessageCount'), 'Must update unreadMessageCount from STOMP payload');
    assert.ok(notifCode.includes('websocketService.connect'), 'Must ensure websocket client is connected');
  });

  test('NotificationContext provides in-app toast alerts, chime, and instant load synchronization', () => {
    const notifCode = fs.readFileSync(path.join(srcDir, 'context/NotificationContext.jsx'), 'utf-8');
    assert.ok(notifCode.includes('playNotificationChime'), 'Must provide audio chime helper');
    assert.ok(notifCode.includes('showInAppToast'), 'Must provide in-app toast trigger');
    assert.ok(notifCode.includes('notesphere-inapp-toast'), 'Must render in-app toast container');

    const chatCode = fs.readFileSync(path.join(srcDir, 'pages/ChatPage.jsx'), 'utf-8');
    assert.ok(chatCode.includes('loadConversations'), 'ChatPage must load conversations');
    assert.ok(chatCode.includes('totalOtherUnread'), 'ChatPage must compute unread count immediately upon load');
  });
});


