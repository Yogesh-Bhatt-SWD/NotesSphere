import apiClient from './apiClient';

export const reminderService = {
  getPreferences: () => apiClient.get('/reminders/preferences'),
  updatePreferences: (preferences) => apiClient.put('/reminders/preferences', preferences),
};

export default reminderService;
