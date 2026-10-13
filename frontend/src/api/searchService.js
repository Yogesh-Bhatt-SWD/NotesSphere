import { request } from './apiClient';

export const searchService = {
  /**
   * Global search across people, blogs, communities, and community posts.
   * @param {string} query - search query string
   * @param {string} type - 'ALL', 'PEOPLE', 'BLOGS', 'COMMUNITIES', 'COMMUNITY_POSTS'
   * @param {number} page - page number (0-indexed)
   * @param {number} size - page size
   */
  async globalSearch(query = '', type = 'ALL', page = 0, size = 10) {
    const params = new URLSearchParams();
    if (query) params.append('q', query.trim());
    if (type) params.append('type', type);
    params.append('page', page);
    params.append('size', size);

    const res = await request(`/search?${params.toString()}`);
    return res?.data;
  }
};

export default searchService;
