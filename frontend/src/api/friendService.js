import { request } from './apiClient';

export const friendService = {
  /**
   * Search users by username query with friendship relationship metadata.
   */
  async searchUsers(query = '', page = 0, size = 20) {
    const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const res = await request(`/users/search?page=${page}&size=${size}${qParam}`);
    return res?.data || { content: [], totalPages: 0, totalElements: 0 };
  },

  /**
   * Get public profile and friendship status for a specific user.
   */
  async getUserProfile(userId) {
    const res = await request(`/users/${userId}/profile`);
    return res?.data;
  },

  /**
   * Send a friend request to a target user.
   */
  async sendFriendRequest(receiverId) {
    const res = await request(`/friend-requests/${receiverId}`, {
      method: 'POST',
    });
    return res?.data;
  },

  /**
   * Fetch incoming pending friend requests.
   */
  async getIncomingRequests() {
    const res = await request('/friend-requests/incoming');
    return res?.data || [];
  },

  /**
   * Fetch outgoing pending friend requests.
   */
  async getOutgoingRequests() {
    const res = await request('/friend-requests/outgoing');
    return res?.data || [];
  },

  /**
   * Accept an incoming friend request.
   */
  async acceptFriendRequest(requestId) {
    const res = await request(`/friend-requests/${requestId}/accept`, {
      method: 'POST',
    });
    return res?.data;
  },

  /**
   * Reject an incoming friend request.
   */
  async rejectFriendRequest(requestId) {
    const res = await request(`/friend-requests/${requestId}/reject`, {
      method: 'POST',
    });
    return res?.data;
  },

  /**
   * Cancel an outgoing pending friend request.
   */
  async cancelFriendRequest(requestId) {
    const res = await request(`/friend-requests/${requestId}/cancel`, {
      method: 'DELETE',
    });
    return res?.data;
  },

  /**
   * Fetch all accepted connections/friends.
   */
  async getFriends() {
    const res = await request('/friends');
    return res?.data || [];
  },

  /**
   * Remove an existing connection/friend.
   */
  async removeFriend(friendId) {
    const res = await request(`/friends/${friendId}`, {
      method: 'DELETE',
    });
    return res?.data;
  },
};

export default friendService;
