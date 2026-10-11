import apiClient from './apiClient';

export const journalService = {
  getJournals: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.append('page', params.page);
    if (params.size !== undefined) query.append('size', params.size);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.direction) query.append('direction', params.direction);
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.sentiment) query.append('sentiment', params.sentiment);
    if (params.tag) query.append('tag', params.tag);
    if (params.favorite !== undefined) query.append('favorite', params.favorite);
    if (params.pinned !== undefined) query.append('pinned', params.pinned);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/journals${queryString}`);
  },

  getJournalById: (id) => apiClient.get(`/journals/${id}`),

  createJournal: (journalData) => apiClient.post('/journals', journalData),

  updateJournal: (id, journalData) => apiClient.put(`/journals/${id}`, journalData),

  deleteJournal: (id) => apiClient.delete(`/journals/${id}`),

  toggleFavorite: (id) => apiClient.patch(`/journals/${id}/favorite`),

  togglePin: (id) => apiClient.patch(`/journals/${id}/pin`),

  getUserTags: () => apiClient.get('/journals/tags'),

  getUserCategories: () => apiClient.get('/journals/categories'),

  exportJson: () => apiClient.get('/journals/export/json'),

  exportCsv: () => apiClient.get('/journals/export/csv'),
};

export default journalService;
