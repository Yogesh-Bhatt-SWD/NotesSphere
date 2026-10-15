import { request } from './apiClient';

export const notificationService = {
  /**
   * Fetch paginated notifications for current user.
   */
  async getNotifications(page = 0, size = 20) {
    const res = await request(`/notifications?page=${page}&size=${size}`);
    return res?.data || { content: [], totalPages: 0, totalElements: 0, last: true };
  },

  /**
   * Fetch total unread notifications count for current user.
   */
  async getUnreadCount() {
    const res = await request('/notifications/unread-count');
    return res?.data?.unreadCount || 0;
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId) {
    const res = await request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
    return res?.data;
  },

  /**
   * Explicitly mark all notifications as read for current user.
   */
  async markAllAsRead() {
    const res = await request('/notifications/read-all', {
      method: 'PUT',
    });
    return res?.data;
  },

  /**
   * Delete a notification.
   */
  async deleteNotification(notificationId) {
    const res = await request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
    return res?.data;
  },
};

export default notificationService;
