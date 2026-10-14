import { request } from './apiClient';

export const blogService = {
  /**
   * Fetch public preview metadata without requiring authentication.
   * Returns: title, slug, excerpt, readingTimeMinutes, publishedAt, coverImageUrl,
   * viewCount, likeCount, authorName, authorAvatarUrl, communityPost, communityName.
   * Never returns full article body or private user data.
   *
   * @param {string} slugOrId
   */
  getPublicPreview: (slugOrId) => {
    return request(`/public/blogs/${encodeURIComponent(slugOrId)}/preview`);
  },

  /**
   * Fetch paginated public stories for landing page and unauthenticated visitors.
   * Strictly returns entries where visibility == PUBLIC.
   *
   * @param {Object} params - { page, size }
   */
  getPublicBlogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.append('page', params.page);
    if (params.size !== undefined) query.append('size', params.size);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/public/blogs${queryString}`);
  },

  /**
   * Fetch full blog article (requires authentication and access permissions).
   * Atomically records view count on the backend for non-authors.
   *
   * @param {string} slugOrId
   */
  getFullBlog: (slugOrId) => {
    return request(`/blogs/${encodeURIComponent(slugOrId)}`);
  },
};
