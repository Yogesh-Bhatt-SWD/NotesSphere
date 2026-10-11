import apiClient from './apiClient';

export const userService = {
  getMe: async () => {
    const res = await apiClient.get('/users/me');
    return res?.data || res;
  },

  updateProfile: async (profileData) => {
    const res = await apiClient.put('/users/me', profileData);
    return res?.data || res;
  },

  updatePreferences: async (preferencesData) => {
    const res = await apiClient.put('/users/me/preferences', preferencesData);
    return res?.data || res;
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const res = await apiClient.post('/users/me/change-password', {
      currentPassword,
      newPassword,
    });
    return res?.data || res;
  },

  changeEmail: async ({ newEmail, password }) => {
    const res = await apiClient.post('/users/me/change-email', {
      newEmail,
      password,
    });
    return res?.data || res;
  },

  getActiveSessions: async () => {
    const res = await apiClient.get('/users/me/sessions');
    return res?.data || res;
  },

  signOutAllSessions: async () => {
    const res = await apiClient.post('/users/me/signout-all');
    return res?.data || res;
  },

  deleteAccount: async ({ password, confirmationText }) => {
    const res = await apiClient.delete('/users/me', {
      password,
      confirmationText,
    });
    return res?.data || res;
  },

  getUserProfile: async (userId) => {
    const res = await apiClient.get(`/users/${userId}/profile`);
    return res?.data || res;
  },

  getUserPublishedJournals: async (userId, page = 0, size = 10) => {
    const res = await apiClient.get(`/users/${userId}/published-journals?page=${page}&size=${size}`);
    return res?.data || res;
  },

  searchUsers: async (query = '', page = 0, size = 20) => {
    const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
    const res = await apiClient.get(`/users/search?page=${page}&size=${size}${qParam}`);
    return res?.data || res;
  },
};

export default userService;
