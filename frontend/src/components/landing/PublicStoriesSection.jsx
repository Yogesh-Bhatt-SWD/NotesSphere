import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  ArrowRight,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { blogService } from '../../api/blogService';
import { formatJournalCardDate } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import './PublicStoriesSection.css';

export function PublicStoriesSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await blogService.getPublicBlogs({ page: 0, size: 6 });
      const pageData = res?.data || res;
      const items = pageData?.content || (Array.isArray(pageData) ? pageData : []);
      // Filter out any entries that are strictly not public (defense in depth)
      const publicOnly = items.filter((item) => !item.visibility || item.visibility === 'PUBLIC');
      setStories(publicOnly);
    } catch (err) {
      console.warn('Public stories feed error:', err?.message || err);
      setError('Unable to load public stories at this time.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleCardClick = (story) => {
    const targetSlug = story.slug || story.id;
    if (targetSlug) {
      navigate(`/blogs/${targetSlug}`);
    }
  };

  return (
    <section className="landing-stories-section" id="stories">
      <div className="landing-stories-container">
        {/* Section Header */}
        <div className="stories-header">
          <div className="stories-eyebrow">
            <Sparkles size={14} />
            <span>DISCOVER PERSPECTIVES</span>
          </div>
          <h2 className="stories-title">Read Real Stories from NoteSphere Writers</h2>
          <p className="stories-subtitle">
            Explore authentic, publicly shared reflections, essays, and creative journeys published by community members.
          </p>
        </div>

        {/* Content Area */}
        {loading ? (
          /* Loading Skeleton State */
          <div className="stories-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="story-skeleton-card" aria-hidden="true">
                <div className="skeleton-cover shimmer" />
                <div className="skeleton-content">
                  <div className="skeleton-line shimmer short" />
                  <div className="skeleton-line shimmer title" />
                  <div className="skeleton-line shimmer body" />
                  <div className="skeleton-footer shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State with Graceful Retry */
          <div className="stories-feedback-card error">
            <AlertCircle size={28} className="feedback-icon" />
            <div className="feedback-text">
              <h3>Connection Notice</h3>
              <p>{error} Our servers might be updating or undergoing maintenance.</p>
            </div>
            <button
              type="button"
              className="feedback-retry-btn"
              onClick={fetchStories}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : stories.length === 0 ? (
          /* Empty State */
          <div className="stories-feedback-card empty">
            <div className="empty-book-icon">
              <BookOpen size={32} />
            </div>
            <h3>No Public Stories Yet</h3>
            <p>
              Be the first writer to share an authentic story with NoteSphere! Published stories appear here for readers worldwide.
            </p>
            <Link
              to={isAuthenticated ? '/editor' : '/register'}
              className="stories-action-btn"
            >
              <span>{isAuthenticated ? 'Write a Story' : 'Start Writing Now'}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* Real Stories Grid */
          <div className="stories-grid">
            {stories.map((story) => {
              const coverUrl = story.coverImageUrl || story.coverImage || null;
              const dateText = formatJournalCardDate(story);
              const authorName = story.authorName || 'Anonymous Writer';
              const authorInitial = authorName.charAt(0).toUpperCase();

              return (
                <article
                  key={story.id}
                  className="landing-story-card"
                  onClick={() => handleCardClick(story)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(story);
                    }
                  }}
                  aria-label={`Read story: ${story.title}`}
                >
                  {/* Card Cover or Graphic Fallback */}
                  {coverUrl ? (
                    <div className="story-card-cover-wrap">
                      <img
                        src={coverUrl}
                        alt={story.title}
                        className="story-card-cover-img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.classList.add('no-cover');
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="story-card-cover-wrap no-cover">
                      <div className="story-card-watermark">
                        <BookOpen size={48} strokeWidth={1.5} />
                      </div>
                      <span className="story-cover-badge">{story.category || 'Story'}</span>
                    </div>
                  )}

                  {/* Story Content Body */}
                  <div className="story-card-body">
                    <div className="story-card-meta-top">
                      <span className="story-category-tag">{story.category || 'Reflections'}</span>
                      {story.readingTimeMinutes > 0 && (
                        <span className="story-reading-time">
                          <Clock size={12} />
                          <span>{story.readingTimeMinutes} min read</span>
                        </span>
                      )}
                    </div>

                    <h3 className="story-card-title">{story.title}</h3>

                    <p className="story-card-excerpt">
                      {story.excerpt || story.content || 'Read this mindful reflection on NoteSphere...'}
                    </p>

                    {/* Author Row */}
                    <div className="story-card-author-row">
                      {story.authorAvatarUrl ? (
                        <img
                          src={story.authorAvatarUrl}
                          alt={authorName}
                          className="story-author-avatar"
                        />
                      ) : (
                        <div className="story-author-initial">{authorInitial}</div>
                      )}
                      <div className="story-author-info">
                        <span className="story-author-name">{authorName}</span>
                        <span className="story-published-date">
                          <Calendar size={11} />
                          <span>{dateText}</span>
                        </span>
                      </div>
                    </div>

                    {/* Engagement Stats Footer */}
                    <div className="story-card-footer">
                      <div className="story-stats-group">
                        <span className="story-stat" title="Total Views">
                          <Eye size={13} />
                          <span>{story.viewCount || 0}</span>
                        </span>
                        <span className="story-stat" title="Likes">
                          <Heart size={13} color="#EF4444" fill={story.likedByCurrentUser ? '#EF4444' : 'none'} />
                          <span>{story.likeCount || 0}</span>
                        </span>
                        <span className="story-stat" title="Comments">
                          <MessageSquare size={13} />
                          <span>{story.commentCount || 0}</span>
                        </span>
                      </div>

                      <span className="story-read-link">
                        <span>Read Story</span>
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default PublicStoriesSection;
