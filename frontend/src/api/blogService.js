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
   * Fetch full blog article (requires authentication and access permissions).
   * Atomically records view count on the backend for non-authors.
   *
   * @param {string} slugOrId
   */
  getFullBlog: (slugOrId) => {
    return request(`/blogs/${encodeURIComponent(slugOrId)}`);
  },
};
