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
   * Mark messages in a conversation as read.
   */
  async markAsRead(conversationId) {
    const res = await request(`/conversations/${conversationId}/read`, {
      method: 'PUT',
    });
    return res?.data;
  },
};

export default chatService;
