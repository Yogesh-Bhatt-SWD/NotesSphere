import apiClient from './apiClient';

export const analyticsService = {
  getUserAnalytics: () => apiClient.get('/analytics'),
  getInsights: () => apiClient.get('/analytics/insights'),
  getStreakInfo: () => apiClient.get('/analytics/streaks'),
  getCalendarDates: () => apiClient.get('/analytics/calendar/dates'),
  getMonthlyCalendar: (year, month) => apiClient.get(`/analytics/calendar/monthly?year=${year}&month=${month}`),
};

export default analyticsService;
