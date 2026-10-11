import apiClient from './apiClient';

export const analyticsService = {
  getOverviewStats: () => apiClient.get('/analytics/stats'),
  getSentimentDistribution: () => apiClient.get('/analytics/sentiment-distribution'),
  getCategoryBreakdown: () => apiClient.get('/analytics/categories'),
  getStreakInfo: () => apiClient.get('/analytics/streaks'),
  getActivityTimeline: (days = 30) => apiClient.get(`/analytics/activity?days=${days}`),
  getMonthlyCalendar: (year, month) => apiClient.get(`/analytics/calendar?year=${year}&month=${month}`),
};

export default analyticsService;
