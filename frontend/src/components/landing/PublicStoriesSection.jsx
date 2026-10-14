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
  CheckCircle2,
  Globe
} from 'lucide-react';
import { blogService } from '../../api/blogService';
import { journalService } from '../../api/journalService';
import { formatJournalCardDate } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import './PublicStoriesSection.css';

const isSyntheticJournal = (item) => {
  if (!item) return true;
  const title = (item.title || '').toLowerCase();
  const author = (item.authorName || '').toLowerCase();

  if (
    title.includes('astroai') ||
    title.includes('quantum horizons') ||
    title.includes('live verification') ||
    title.includes('public mindful journey')
  ) {
    return true;
  }

  if (
    author.startsWith('alice_') ||
    author.startsWith('charlie_') ||
    author.includes('alice adventurer') ||
    author.includes('mood author') ||
    author.startsWith('author_') ||
    author.includes('publication tester') ||
    /[0-9a-f]{6}/.test(author)
  ) {
    return true;
  }

  return false;
};

export function PublicStoriesSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      let res;
      try {
        // Primary public blogs feed endpoint
        res = await blogService.getPublicBlogs({ page: 0, size: 6 });
      } catch (primaryErr) {
        // Fallback to /journals/public if /public/blogs is still deploying
        try {
          res = await journalService.getPublicJournals({ page: 0, size: 6 });
        } catch {
          throw primaryErr;
        }
      }

      const pageData = res?.data || res;
      const items = pageData?.content || (Array.isArray(pageData) ? pageData : []);
      // Filter out any entries that are strictly not public or synthetic (defense in depth)
      const publicOnly = items.filter(
        (item) => (!item.visibility || item.visibility === 'PUBLIC') && !isSyntheticJournal(item)
      );
      // Strictly limit to exactly up to 3 cards in total on the landing page
      setStories(publicOnly.slice(0, 3));
    } catch (err) {
      console.warn('Public stories feed error:', err?.message || err);
      setHasError(true);
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

  const handleExploreAllClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate('/public-journals');
    } else {
      navigate(`/login?redirect=${encodeURIComponent('/public-journals')}`);
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
        ) : stories.length > 0 ? (
          /* Real Stories Grid */
          <>
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

                    {/* Card Footer: Authenticated vs Guest */}
                    <div className="story-card-footer">
                      {isAuthenticated ? (
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
                      ) : (
                        <div className="story-guest-badge">
                          <span>Public Article</span>
                        </div>
                      )}

                      <span className="story-read-link">
                        <span>Read Article</span>
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button
              type="button"
              onClick={handleExploreAllClick}
              className="fallback-btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', cursor: 'pointer', border: '1px solid var(--border-subtle, #E6EFEA)', background: '#FFFFFF', borderRadius: '9999px', fontWeight: 600, color: 'var(--text-primary, #1E293B)', fontSize: '0.98rem' }}
            >
              <Globe size={16} />
              <span>Explore All Public Journals</span>
              <ArrowRight size={14} />
            </button>
          </div>
          </>
        ) : (
          /* Clean, Inspiring Fallback Section (Never breaks the page or displays alarming error notices) */
          <div className="stories-clean-fallback-card">
            <div className="fallback-badge">
              <BookOpen size={16} />
              <span>COMMUNITY STORIES</span>
            </div>

            <h3 className="fallback-title">Explore Thoughtful Writing on NoteSphere</h3>

            <p className="fallback-description">
              Writers and thinkers share authentic reflections, creative essays, and mindful perspectives here. Sign in to browse community publications, or write and share your very first story today.
            </p>

            <div className="fallback-actions">
              <Link
                to={isAuthenticated ? '/editor' : '/register'}
                className="fallback-btn-primary"
              >
                <span>{isAuthenticated ? 'Write a Story' : 'Start Writing Free'}</span>
                <ArrowRight size={16} />
              </Link>

              {!isAuthenticated && (
                <Link to="/login" className="fallback-btn-secondary">
                  <span>Sign In to Read</span>
                </Link>
              )}

              {hasError && (
                <button
                  type="button"
                  onClick={fetchStories}
                  className="fallback-btn-refresh"
                  title="Refresh public stories feed"
                >
                  <RefreshCw size={13} />
                  <span>Check Feed</span>
                </button>
              )}
            </div>

            <div className="fallback-reassurance-row">
              <span className="reassurance-pill">
                <CheckCircle2 size={13} /> Free to read
              </span>
              <span className="reassurance-dot">•</span>
              <span className="reassurance-pill">
                <CheckCircle2 size={13} /> Zero ad trackers
              </span>
              <span className="reassurance-dot">•</span>
              <span className="reassurance-pill">
                <CheckCircle2 size={13} /> 100% Privacy-focused
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PublicStoriesSection;
