import apiClient from './apiClient';

export const communityService = {
  getCommunities: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.append('page', params.page);
    if (params.size !== undefined) query.append('size', params.size);
    if (params.query) query.append('query', params.query);
    if (params.category) query.append('category', params.category);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/communities${queryString}`);
  },

  getJoinedCommunities: () => apiClient.get('/communities/joined'),

  getCommunityById: (id) => apiClient.get(`/communities/${id}`),

  createCommunity: (data) => apiClient.post('/communities', data),

  joinCommunity: (id) => apiClient.post(`/communities/${id}/join`),

  leaveCommunity: (id) => apiClient.delete(`/communities/${id}/leave`),

  getCommunityFeed: (id, params = {}) => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.append('page', params.page);
    if (params.size !== undefined) query.append('size', params.size);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortDir) query.append('sortDir', params.sortDir);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get(`/communities/${id}/feed${queryString}`);
  },

  addComment: (journalId, content) =>
    apiClient.post(`/communities/posts/${journalId}/comments`, { content }),

  getComments: (journalId) =>
    apiClient.get(`/communities/posts/${journalId}/comments`),

  toggleReaction: (journalId) =>
    apiClient.post(`/communities/posts/${journalId}/react`),

  reportPost: (journalId, reason) =>
    apiClient.post(`/communities/posts/${journalId}/report`, { reason }),

  moderatePost: (journalId) =>
    apiClient.delete(`/communities/posts/${journalId}`),
};

export default communityService;
