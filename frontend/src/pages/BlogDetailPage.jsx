import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Share2,
  Copy,
  Check,
  Eye,
  Heart,
  Calendar,
  Clock,
  Lock,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Sparkles,
  User,
  ShieldAlert,
} from 'lucide-react';
import { blogService } from '../api/blogService';
import { communityService } from '../api/communityService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CommentSection from '../components/common/CommentSection';
import { formatPublishedDateIST } from '../utils/dateUtils';
import './BlogDetailPage.css';

export function BlogDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [blog, setBlog] = useState(null);
  const [isFullArticle, setIsFullArticle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  // Prevent double execution in React StrictMode
  const fetchedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    fetchedRef.current = false;

    async function fetchBlogData() {
      setLoading(true);
      setError(null);
      setErrorStatus(null);

      // 1. If user is authenticated, attempt to fetch the full article first
      if (isAuthenticated) {
        try {
          const res = await blogService.getFullBlog(slug);
          if (!isMounted) return;
          const data = res?.data || res;
          setBlog(data);
          setIsFullArticle(true);
          setLiked(!!data.likedByCurrentUser);
          setLikeCount(data.likeCount || 0);
          setLoading(false);
          return;
        } catch (err) {
          // If 401 (token expired/invalid), fall through to preview
          // If 403 (e.g. community members only) or 404, capture error
          if (err.status === 403) {
            if (!isMounted) return;
            setErrorStatus(403);
            setError(err.message || 'You must be a member of this community to read this article.');
            setLoading(false);
            return;
          } else if (err.status === 404) {
            if (!isMounted) return;
            setErrorStatus(404);
            setError('This article is either private, unpublished, or does not exist.');
            setLoading(false);
            return;
          }
        }
      }

      // 2. Unauthenticated visitor or fallback: fetch public preview teaser
      try {
        const res = await blogService.getPublicPreview(slug);
        if (!isMounted) return;
        const data = res?.data || res;
        setBlog(data);
        setIsFullArticle(false);
        setLiked(false);
        setLikeCount(data.likeCount || 0);
      } catch (err) {
        if (!isMounted) return;
        setErrorStatus(err.status || 404);
        setError('This article is either private, unpublished, or does not exist.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchBlogData();

    return () => {
      isMounted = false;
    };
  }, [slug, isAuthenticated]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShare = async () => {
    if (!blog) return;
    const stableSlug = blog.slug || blog.id || slug;
    const shareUrl = `${window.location.origin}/blogs/${stableSlug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title || 'NoteSphere Blog',
          text: blog.excerpt || blog.title,
          url: shareUrl,
        });
        showToast('Link shared successfully!');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: clipboard copy
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!');
    } catch {
      showToast('Could not copy link. Share URL: ' + shareUrl);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (!blog?.id) return;

    try {
      const prevLiked = liked;
      const prevCount = likeCount;
      setLiked(!prevLiked);
      setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

      await communityService.toggleReaction(blog.id);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
      // Revert on error
      setLiked(liked);
      setLikeCount(likeCount);
    }
  };

  const handleContinueReading = () => {
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
  };

  const formatDate = (dateString) => {
    return formatPublishedDateIST(dateString);
  };

  if (loading) {
    return (
      <div className="blog-detail-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="lg" />
        <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Loading article...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="blog-detail-container">
        <header className="blog-nav-header">
          <div className="blog-nav-left">
            <Link to="/" className="blog-brand-logo">
              <span className="blog-brand-icon">
                <BookOpen size={16} />
              </span>
              <span>NoteSphere</span>
            </Link>
          </div>
          <div className="blog-nav-right">
            <Link to="/login" className="blog-login-nav-btn">Sign In</Link>
          </div>
        </header>

        <div className="blog-content-wrapper" style={{ textAlign: 'center', marginTop: 60 }}>
          <div className="blog-article-card" style={{ padding: '48px 32px' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#EF4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <ShieldAlert size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>
              {errorStatus === 403 ? 'Community Access Required' : 'Article Unavailable'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 28px auto', lineHeight: 1.6 }}>
              {error || 'The requested article could not be found or has not been made public.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => navigate(-1)} className="blog-back-btn">
                <ArrowLeft size={16} /> Go Back
              </button>
              <Link to="/" className="blog-login-nav-btn">
                Explore NoteSphere
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const readingTime = blog.readingTimeMinutes || 1;
  const authorInitial = (blog.authorName || 'A')[0].toUpperCase();

  return (
    <div className="blog-detail-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="blog-toast-pill">
          <Check size={16} color="var(--primary, #00B69B)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <header className="blog-nav-header">
        <div className="blog-nav-left">
          <button onClick={() => navigate(-1)} className="blog-back-btn" title="Go back">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <Link to="/" className="blog-brand-logo">
            <span className="blog-brand-icon">
              <BookOpen size={16} />
            </span>
            <span>NoteSphere</span>
          </Link>
        </div>

        <div className="blog-nav-right">
          <button onClick={handleShare} className="blog-share-top-btn" title="Share this article">
            <Share2 size={15} />
            <span>Share</span>
          </button>

          {isAuthenticated ? (
            <Link to="/" className="blog-back-btn" style={{ fontWeight: 700 }}>
              Dashboard
            </Link>
          ) : (
            <Link
              to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
              className="blog-login-nav-btn"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Article Container */}
      <main className="blog-content-wrapper">
        <article className="blog-article-card">
          {/* Optional Cover Image */}
          {(blog.coverImageUrl || blog.coverImage) && (
            <div className="blog-cover-wrapper">
              <img
                src={blog.coverImageUrl || blog.coverImage}
                alt={blog.title}
                className="blog-cover-image"
                onError={(e) => {
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.style.display = 'none';
                  }
                }}
              />
            </div>
          )}

          {/* Category & Visibility Badges */}
          <div className="blog-meta-tags">
            {blog.category && (
              <span className="blog-badge-category">
                <Sparkles size={12} />
                {blog.category}
              </span>
            )}
            {blog.communityName && (
              <span className="blog-badge-community">
                {blog.communityName}
              </span>
            )}
          </div>

          {/* Article Title */}
          <h1 className="blog-title">{blog.title}</h1>

          {/* Author & Publication Metadata */}
          <div className="blog-author-bar">
            <div className="blog-author-info">
              {blog.authorAvatarUrl ? (
                <img
                  src={blog.authorAvatarUrl}
                  alt={blog.authorName || 'Author'}
                  className="blog-author-avatar"
                />
              ) : (
                <div className="blog-author-avatar">{authorInitial}</div>
              )}
              <div className="blog-author-meta">
                <span className="blog-author-name">{blog.authorName || 'Anonymous Author'}</span>
                <div className="blog-author-sub">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={13} />
                    {formatDate(blog.publishedAt || blog.createdAt)}
                  </span>
                  <span className="blog-author-dot">•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} />
                    {readingTime} min read
                  </span>
                </div>
              </div>
            </div>

            <div className="blog-stats-bar">
              <span className="blog-stat-item" title={`${blog.viewCount || 0} total reads`}>
                <Eye size={16} />
                <span>{blog.viewCount || 0} views</span>
              </span>
              <span className="blog-stat-item">
                <Heart size={16} fill={liked ? 'var(--accent-coral, #FF5C5C)' : 'none'} color={liked ? 'var(--accent-coral, #FF5C5C)' : 'currentColor'} />
                <span>{likeCount}</span>
              </span>
            </div>
          </div>

          {/* Body Section */}
          {isFullArticle ? (
            /* 1. Authenticated Full Article View */
            <div className="blog-article-body">
              {(blog.content || '')
                .split('\n')
                .filter((p) => p.trim().length > 0)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="blog-tags-container">
                  {blog.tags.map((t, idx) => (
                    <span key={idx} className="blog-tag-chip">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Full Article Action Toolbar */}
              <div className="blog-footer-toolbar">
                <div className="blog-footer-left">
                  <button
                    onClick={handleLike}
                    className={`blog-action-pill ${liked ? 'active' : ''}`}
                  >
                    <Heart size={16} fill={liked ? '#E66A42' : 'none'} />
                    <span>{liked ? 'Liked' : 'Like'} ({likeCount})</span>
                  </button>
                  <button onClick={handleShare} className="blog-action-pill">
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>
                </div>
                <div className="blog-stat-item" style={{ color: 'var(--text-secondary)' }}>
                  <Eye size={16} />
                  <span>{blog.viewCount || 0} total views</span>
                </div>
              </div>

              {/* Comments Section with Emoji Picker */}
              <div style={{ marginTop: '36px', paddingTop: '28px', borderTop: '1px solid var(--border-subtle, #e2e8f0)' }}>
                <CommentSection
                  journalId={blog.id}
                  onCommentCountChange={(count) => {
                    setBlog((prev) => (prev ? { ...prev, commentCount: count } : prev));
                  }}
                />
              </div>
            </div>
          ) : (
            /* 2. Public Preview Teaser with Login Gate */
            <div className="blog-preview-section">
              <div className="blog-excerpt-content">
                <p>{blog.excerpt || 'Read this thoughtful story on NoteSphere.'}</p>
              </div>

              {/* Subtle visual gradient fade-out */}
              <div className="blog-excerpt-fade" />

              {/* Login Wall */}
              <div className="blog-login-gate-card">
                <div className="blog-gate-icon-circle">
                  <Lock size={26} />
                </div>
                <h3 className="blog-gate-title">Read the Complete Story</h3>
                <p className="blog-gate-subtitle">
                  Sign in or create a NoteSphere account to read the full article, join discussion, and save stories to your reading list.
                </p>
                <div className="blog-gate-actions">
                  <button onClick={handleContinueReading} className="blog-gate-primary-btn">
                    <span>Continue reading</span>
                    <ArrowRight size={16} />
                  </button>
                  <Link
                    to={`/register?redirect=${encodeURIComponent(location.pathname)}`}
                    className="blog-gate-secondary-btn"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </div>
          )}
        </article>
      </main>
    </div>
  );
}

export default BlogDetailPage;
