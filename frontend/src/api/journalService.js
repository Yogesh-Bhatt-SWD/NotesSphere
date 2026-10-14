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
    if (params.visibility) query.append('visibility', params.visibility);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/journals${queryString}`);
  },

  getJournalById: (id) => apiClient.get(`/journals/${id}`),

  getInsights: () => apiClient.get('/journals/insights'),

  recordView: (id) => apiClient.post(`/journals/${id}/view`),

  createJournal: (journalData) => apiClient.post('/journals', journalData),

  updateJournal: (id, journalData) => apiClient.put(`/journals/${id}`, journalData),

  deleteJournal: (id) => apiClient.delete(`/journals/${id}`),

  toggleFavorite: (id) => apiClient.patch(`/journals/${id}/favorite`),

  togglePin: (id) => apiClient.patch(`/journals/${id}/pin`),

  publishJournal: (id, payloadOrCommunityId) => {
    const body = typeof payloadOrCommunityId === 'object'
      ? payloadOrCommunityId
      : { communityId: payloadOrCommunityId, visibility: 'COMMUNITY' };
    return apiClient.post(`/journals/${id}/publish`, body);
  },

  uploadCoverImage: (id, fileOrDataUrl) => {
    if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
      const formData = new FormData();
      formData.append('file', fileOrDataUrl);
      return apiClient.post(`/journals/${id}/cover`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return apiClient.post(`/journals/${id}/cover`, { coverImageUrl: fileOrDataUrl });
  },

  deleteCoverImage: (id) => apiClient.delete(`/journals/${id}/cover`),

  unpublishJournal: (id) =>
    apiClient.post(`/journals/${id}/unpublish`),

  getPublicJournals: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.append('page', params.page);
    if (params.size !== undefined) query.append('size', params.size);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortDir) query.append('sortDir', params.sortDir);
    else if (params.direction) query.append('sortDir', params.direction);
    if (params.query) query.append('query', params.query);
    else if (params.search) query.append('query', params.search);
    if (params.category && params.category !== 'ALL') query.append('category', params.category);
    if (params.tag) query.append('tag', params.tag);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/journals/public${queryString}`);
  },

  getPublishedJournals: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.append('page', params.page);
    if (params.size !== undefined) query.append('size', params.size);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/journals/published${queryString}`);
  },

  getUserTags: () => apiClient.get('/journals/tags'),

  getUserTagsWithCounts: () => apiClient.get('/journals/tags/counts'),

  getUserCategories: () => apiClient.get('/journals/categories'),

  exportJson: (filename = 'journals.json') =>
    apiClient.download('/journals/export/json', filename),

  exportCsv: (filename = 'journals.csv') =>
    apiClient.download('/journals/export/csv', filename),
};

export default journalService;
