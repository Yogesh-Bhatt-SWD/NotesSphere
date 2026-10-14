import apiClient from './apiClient';

export const categoryService = {
  getCategories: () => apiClient.get('/categories'),

  getPublicCategories: () => apiClient.get('/public/categories'),

  createCategory: (data) => apiClient.post('/categories', data),

  renameCategory: (id, data) => apiClient.put(`/categories/${id}`, data),

  deleteCategory: (id) => apiClient.delete(`/categories/${id}`),

  suggestCategory: (content) => apiClient.post('/categories/suggest', { content }),
};

export default categoryService;
