import apiClient from './apiClient';

export const authService = {
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res?.data?.accessToken) {
      localStorage.setItem('notesphere_access_token', res.data.accessToken);
      localStorage.setItem('notesphere_refresh_token', res.data.refreshToken);
      const user = res.data.user || {};
      const normalizedUser = {
        ...user,
        name: user.name || user.username || email.split('@')[0],
      };
      localStorage.setItem('notesphere_user', JSON.stringify(normalizedUser));
    }
    return res.data;
  },

  register: async (name, email, password) => {
    const trimmedName = name?.trim();
    const res = await apiClient.post('/auth/register', {
      username: trimmedName,
      name: trimmedName,
      email: email?.trim(),
      password,
    });
    if (res?.data?.accessToken) {
      localStorage.setItem('notesphere_access_token', res.data.accessToken);
      localStorage.setItem('notesphere_refresh_token', res.data.refreshToken);
      const user = res.data.user || {};
      const normalizedUser = {
        ...user,
        name: user.name || user.username || trimmedName,
      };
      localStorage.setItem('notesphere_user', JSON.stringify(normalizedUser));
    }
    return res.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('notesphere_refresh_token');
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Continue client cleanup even if logout request fails
    } finally {
      localStorage.removeItem('notesphere_access_token');
      localStorage.removeItem('notesphere_refresh_token');
      localStorage.removeItem('notesphere_user');
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('notesphere_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('notesphere_access_token');
  }
};

export default authService;
