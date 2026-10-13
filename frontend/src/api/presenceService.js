import { request } from './apiClient';

/**
 * Service for fetching and querying user and friend presence information.
 */
export const presenceService = {
  /**
   * Get online/offline presence for all accepted friends of the current user.
   */
  async getFriendsPresence() {
    try {
      const res = await request('/presence/friends');
      return res?.data || [];
    } catch (err) {
      console.warn('Failed to fetch friends presence:', err);
      return [];
    }
  },

  /**
   * Get presence status for a specific accepted friend.
   */
  async getUserPresence(userId) {
    try {
      const res = await request(`/presence/user/${userId}`);
      return res?.data || null;
    } catch (err) {
      console.warn(`Failed to fetch presence for user ${userId}:`, err);
      return null;
    }
  },
};

export default presenceService;
