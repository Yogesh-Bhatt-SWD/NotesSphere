import { request } from './apiClient';

export const chatService = {
  /**
   * Fetch all conversations for current user with unread counts and last message.
   */
  async getConversations() {
    const res = await request('/conversations');
    return res?.data || [];
  },

  /**
   * Get total number of unread incoming messages across all conversations.
   */
  async getUnreadCount() {
    const res = await request('/conversations/unread-count');
    return res?.data?.unreadCount || 0;
  },

  /**
   * Get or initialize a private 1-to-1 conversation with an accepted friend.
   */
  async getOrCreateConversation(friendId) {
    const res = await request(`/conversations/with-friend/${friendId}`, {
      method: 'POST',
    });
    return res?.data;
  },

  /**
   * Fetch paginated message history for a conversation.
   */
  async getMessages(conversationId, page = 0, size = 50) {
    const res = await request(`/conversations/${conversationId}/messages?page=${page}&size=${size}`);
    return res?.data || { content: [], totalPages: 0, totalElements: 0 };
  },

  /**
   * Send a message via REST endpoint (useful as reliable fallback).
   */
  async sendMessage(conversationId, content) {
    const res = await request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return res?.data;
  },

  /**
   * Mark messages in a conversation as read (optionally up to a specific message ID).
   */
  async markAsRead(conversationId, upToMessageId = null) {
    const query = upToMessageId ? `?upToMessageId=${encodeURIComponent(upToMessageId)}` : '';
    const res = await request(`/conversations/${conversationId}/read${query}`, {
      method: 'PUT',
    });
    return res?.data;
  },
};

export default chatService;
