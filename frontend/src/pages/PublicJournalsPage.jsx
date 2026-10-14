import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Globe,
  Search,
  X,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Plus,
  Compass,
  SlidersHorizontal
} from 'lucide-react';
import { journalService } from '../api/journalService';
import { categoryService } from '../api/categoryService';
import { blogService } from '../api/blogService';
import { useAuth } from '../context/AuthContext';
import { formatJournalCardDate } from '../utils/dateUtils';
import './PublicJournalsPage.css';

const DEFAULT_CATEGORIES = [
  'Mindfulness',
  'Reflections',
  'Personal Growth',
  'Daily Life',
  'Work & Projects',
  'Study',
  'Travel',
  'Health',
  'Creative Writing'
];

/**
 * Filter out synthetic bot/test accounts and test journals created by CI scripts.
 */
export const isSyntheticJournal = (item) => {
  if (!item) return true;
  const title = (item.title || '').toLowerCase();
  const author = (item.authorName || '').toLowerCase();

  // Synthetic test titles
  if (
    title.includes('astroai') ||
    title.includes('quantum horizons') ||
    title.includes('live verification') ||
    title.includes('public mindful journey')
  ) {
    return true;
  }

  // Synthetic bot/test author accounts
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

export function PublicJournalsPage({ isPublicVisitor = false }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  // Search, filter, and pagination states
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || searchParams.get('query') || '');
  const [activeSearch, setActiveSearch] = useState(() => searchParams.get('q') || searchParams.get('query') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 9;

  // Data states
  const [journals, setJournals] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Determine if page is in standalone visitor mode (outside MainLayout)
  const isVisitorMode = isPublicVisitor || !isAuthenticated;

  // Fetch available categories
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        let res;
        if (isAuthenticated) {
          res = await categoryService.getCategories();
        } else {
          try {
            res = await categoryService.getPublicCategories();
          } catch {
            // fallback
          }
        }
        if (isMounted && res?.data) {
          const catList = Array.isArray(res.data)
            ? res.data.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
            : [];
          if (catList.length > 0) {
            // Merge with defaults and deduplicate
            const combined = Array.from(new Set([...catList, ...DEFAULT_CATEGORIES]));
            setCategories(combined);
          }
        }
      } catch (err) {
        console.warn('Could not fetch dynamic categories, using defaults:', err?.message);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Sync state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeSearch) params.set('q', activeSearch);
    if (selectedCategory && selectedCategory !== 'ALL') params.set('category', selectedCategory);
    if (currentPage > 0) params.set('page', String(currentPage));
    setSearchParams(params, { replace: true });
  }, [activeSearch, selectedCategory, currentPage, setSearchParams]);

  // Main data fetching effect
  const fetchPublicJournals = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

    try {
      const params = {
        page: currentPage,
        size: pageSize,
        sortBy,
        sortDir,
      };

      if (activeSearch.trim()) {
        params.query = activeSearch.trim();
      }

      if (selectedCategory && selectedCategory !== 'ALL') {
        params.category = selectedCategory;
      }

      let res;
      try {
        res = await journalService.getPublicJournals(params);
      } catch (primaryErr) {
        // Fallback to /api/public/blogs if available
        try {
          res = await blogService.getPublicBlogs({ page: currentPage, size: pageSize });
        } catch {
          throw primaryErr;
        }
      }

      const pagedData = res?.data || res;
      const content = pagedData?.content || (Array.isArray(pagedData) ? pagedData : []);

      // Strict Defense-in-depth: Ensure only journals with visibility === 'PUBLIC' from real users are rendered
      const verifiedPublic = content.filter(
        (item) => (!item.visibility || item.visibility === 'PUBLIC') && !isSyntheticJournal(item)
      );

      setJournals(verifiedPublic);
      setTotalPages(pagedData?.totalPages ?? Math.max(1, Math.ceil(verifiedPublic.length / pageSize)));
      setTotalElements(pagedData?.totalElements ?? verifiedPublic.length);
    } catch (err) {
      console.error('Error fetching public journals:', err);
      setHasError(true);
      setErrorMessage(err?.message || 'Unable to load public journals. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortDir, activeSearch, selectedCategory]);

  useEffect(() => {
    fetchPublicJournals();
  }, [fetchPublicJournals]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
    setCurrentPage(0);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setCurrentPage(0);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(0);
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    if (val === 'createdAt:desc') {
      setSortBy('createdAt');
      setSortDir('desc');
    } else if (val === 'createdAt:asc') {
      setSortBy('createdAt');
      setSortDir('asc');
    } else if (val === 'viewCount:desc') {
      setSortBy('viewCount');
      setSortDir('desc');
    }
    setCurrentPage(0);
  };

  const handleCardClick = (journal) => {
    const targetSlug = journal.slug || journal.id;
    if (targetSlug) {
      navigate(`/blogs/${targetSlug}`);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const hasActiveFilters = Boolean(activeSearch.trim()) || selectedCategory !== 'ALL';

  const resetAllFilters = () => {
    setSearchQuery('');
    setActiveSearch('');
    setSelectedCategory('ALL');
    setCurrentPage(0);
  };

  return (
    <div className={`public-journals-page-wrapper ${isVisitorMode ? 'visitor-mode' : ''}`}>
      {/* Standalone Visitor Navigation Header (when viewed outside MainLayout) */}
      {isVisitorMode && (
        <header className="pj-visitor-header">
          <div className="pj-visitor-header-container">
            <Link to="/" className="pj-brand-logo">
              <div className="pj-brand-icon">
                <BookOpen size={20} />
              </div>
              <span className="pj-brand-text">
                Note<span>Sphere</span>
              </span>
            </Link>

            <nav className="pj-visitor-nav-links">
              <Link to="/" className="pj-nav-link">Home</Link>
              <Link to="/public-journals" className="pj-nav-link active">Public Journals</Link>
              <a href="/#features" className="pj-nav-link">Features</a>
            </nav>

            <div className="pj-visitor-actions">
              <Link to="/login" className="pj-btn-ghost">Sign In</Link>
              <Link to="/register" className="pj-btn-primary">
                <span>Get Started</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="public-journals-container">
        {/* Hero / Banner Header */}
        <section className="pj-hero-section">
          <div className="pj-hero-top-row">
            <div className="pj-eyebrow-chip">
              <Globe size={14} className="pj-eyebrow-icon" />
              <span>COMMUNITY PERSPECTIVES</span>
            </div>

            {isAuthenticated && (
              <button
                type="button"
                className="pj-btn-write-journal"
                onClick={() => navigate('/editor')}
                title="Write a new journal entry"
              >
                <Plus size={16} />
                <span>Write Journal</span>
              </button>
            )}
          </div>

          <h1 className="pj-title">Public Journals</h1>
          <p className="pj-description">
            Discover and read publicly published reflections, stories, and insights from writers across NoteSphere. Every perspective has a home here.
          </p>
        </section>

        {/* Search & Filter Toolbar */}
        <section className="pj-toolbar-section">
          <div className="pj-search-sort-row">
            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="pj-search-form" role="search">
              <Search size={18} className="pj-search-icon" />
              <input
                type="text"
                className="pj-search-input"
                placeholder="Search public journals by title, content, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search public journals"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="pj-search-clear-btn"
                  onClick={handleClearSearch}
                  aria-label="Clear search query"
                >
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="pj-search-submit-btn">
                Search
              </button>
            </form>

            {/* Sort Control */}
            <div className="pj-sort-box">
              <SlidersHorizontal size={15} className="pj-sort-icon" />
              <label htmlFor="pj-sort-select" className="sr-only">Sort public journals</label>
              <select
                id="pj-sort-select"
                className="pj-sort-select"
                value={`${sortBy}:${sortDir}`}
                onChange={handleSortChange}
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="viewCount:desc">Most Viewed</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="pj-categories-scroll" role="toolbar" aria-label="Filter by category">
            <button
              type="button"
              className={`pj-category-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('ALL')}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`pj-category-pill ${selectedCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Active Filter Indicators */}
          {hasActiveFilters && (
            <div className="pj-active-filters-row">
              <span className="pj-active-filters-label">Active filters:</span>
              {activeSearch && (
                <span className="pj-filter-tag">
                  Query: "<strong>{activeSearch}</strong>"
                  <button type="button" onClick={handleClearSearch} aria-label="Remove search filter">
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedCategory !== 'ALL' && (
                <span className="pj-filter-tag">
                  Category: <strong>{selectedCategory}</strong>
                  <button type="button" onClick={() => handleCategoryChange('ALL')} aria-label="Remove category filter">
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                type="button"
                className="pj-btn-reset-filters"
                onClick={resetAllFilters}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>

        {/* Results Counter */}
        {!isLoading && !hasError && (
          <div className="pj-results-count-bar">
            <span>
              Showing {journals.length} {journals.length === 1 ? 'public journal' : 'public journals'}
              {totalElements > 0 && totalElements !== journals.length ? ` of ${totalElements}` : ''}
            </span>
          </div>
        )}

        {/* Main Feed Content Area */}
        {isLoading ? (
          /* Loading State: Skeletons */
          <div className="pj-grid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="pj-skeleton-card" aria-hidden="true">
                <div className="pj-skeleton-cover shimmer" />
                <div className="pj-skeleton-body">
                  <div className="pj-skeleton-pill shimmer" />
                  <div className="pj-skeleton-title shimmer" />
                  <div className="pj-skeleton-text shimmer" />
                  <div className="pj-skeleton-text short shimmer" />
                  <div className="pj-skeleton-footer shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          /* Error State */
          <div className="pj-state-card error">
            <div className="pj-state-icon-wrap error">
              <AlertCircle size={32} />
            </div>
            <h2>Unable to Load Public Journals</h2>
            <p>{errorMessage}</p>
            <button
              type="button"
              className="pj-btn-retry"
              onClick={fetchPublicJournals}
            >
              <RefreshCw size={15} />
              <span>Try Again</span>
            </button>
          </div>
        ) : journals.length === 0 ? (
          /* Empty State */
          <div className="pj-state-card empty">
            <div className="pj-state-icon-wrap">
              <Globe size={36} />
            </div>
            <h2>No Public Journals Found</h2>
            <p>
              {hasActiveFilters
                ? 'No journals match your active filters or search terms. Try clearing your filters.'
                : 'There are no public journals published yet. Be the first to share your reflections with NoteSphere!'}
            </p>
            <div className="pj-state-actions">
              {hasActiveFilters ? (
                <button
                  type="button"
                  className="pj-btn-primary"
                  onClick={resetAllFilters}
                >
                  Clear All Filters
                </button>
              ) : isAuthenticated ? (
                <button
                  type="button"
                  className="pj-btn-primary"
                  onClick={() => navigate('/editor')}
                >
                  <Plus size={16} />
                  <span>Publish First Public Journal</span>
                </button>
              ) : (
                <Link to="/register" className="pj-btn-primary">
                  <span>Join NoteSphere to Write</span>
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Real Data Grid */
          <div className="pj-grid">
            {journals.map((journal) => {
              const coverUrl = journal.coverImageUrl || journal.coverImage || null;
              const dateText = formatJournalCardDate(journal);
              const authorName = journal.authorName || 'NoteSphere Writer';
              const authorInitial = authorName.charAt(0).toUpperCase();
              const readingTime = journal.readingTimeMinutes || Math.max(1, Math.ceil((journal.wordCount || 100) / 180));
              const viewCount = journal.viewCount || 0;
              const likeCount = journal.likeCount || 0;
              const commentCount = journal.commentCount || 0;

              return (
                <article
                  key={journal.id}
                  className="pj-card"
                  onClick={() => handleCardClick(journal)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(journal);
                    }
                  }}
                  aria-label={`Read journal: ${journal.title} by ${authorName}`}
                >
                  {/* Card Cover Banner */}
                  {coverUrl ? (
                    <div className="pj-card-cover-wrap">
                      <img
                        src={coverUrl}
                        alt={journal.title}
                        className="pj-card-cover-img"
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
                    <div className="pj-card-cover-placeholder">
                      <div className="pj-cover-watermark">
                        <BookOpen size={48} />
                      </div>
                    </div>
                  )}

                  {/* Card Body */}
                  <div className="pj-card-body">
                    {/* Tags / Badges */}
                    <div className="pj-card-badges-row">
                      <span className="pj-badge-category">
                        {journal.category || 'General'}
                      </span>
                      {journal.sentimentLabel && (
                        <span className={`pj-badge-sentiment ${journal.sentimentLabel.toLowerCase()}`}>
                          {journal.sentimentLabel}
                        </span>
                      )}
                      <span className="pj-badge-views" title="Total Views">
                        <Eye size={12} />
                        <span>{viewCount}</span>
                      </span>
                    </div>

                    {/* Title & Excerpt */}
                    <h3 className="pj-card-title">{journal.title}</h3>
                    <p className="pj-card-excerpt">
                      {journal.content
                        ? journal.content.replace(/<[^>]*>?/gm, '').slice(0, 150) + (journal.content.length > 150 ? '...' : '')
                        : 'Click to read full journal reflection...'}
                    </p>

                    {/* Author & Footer Meta */}
                    <div className="pj-card-footer">
                      <div className="pj-card-author">
                        <div className="pj-author-avatar" aria-hidden="true">
                          {authorInitial}
                        </div>
                        <div className="pj-author-meta">
                          <span className="pj-author-name">{authorName}</span>
                          <span className="pj-card-date">{dateText}</span>
                        </div>
                      </div>

                      <div className="pj-card-meta-bottom">
                        <div className="pj-card-stats">
                          <span className="pj-reading-time">
                            <Clock size={12} />
                            <span>{readingTime} min</span>
                          </span>
                          {likeCount > 0 && (
                            <span className="pj-stat-item" title="Likes">
                              <Heart size={12} fill="#EF4444" color="#EF4444" />
                              <span>{likeCount}</span>
                            </span>
                          )}
                          {commentCount > 0 && (
                            <span className="pj-stat-item" title="Comments">
                              <MessageSquare size={12} color="var(--primary)" />
                              <span>{commentCount}</span>
                            </span>
                          )}
                        </div>

                        <span className="pj-read-link">
                          <span>Read</span>
                          <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination Navigation */}
        {!isLoading && !hasError && totalPages > 1 && (
          <nav className="pj-pagination" aria-label="Public journals pagination">
            <button
              type="button"
              className="pj-page-btn nav-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <div className="pj-page-numbers">
              {Array.from({ length: totalPages }).map((_, idx) => {
                // Show first, last, current, and neighbours
                if (
                  idx === 0 ||
                  idx === totalPages - 1 ||
                  (idx >= currentPage - 1 && idx <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`pj-page-btn ${idx === currentPage ? 'active' : ''}`}
                      onClick={() => handlePageChange(idx)}
                      aria-current={idx === currentPage ? 'page' : undefined}
                    >
                      {idx + 1}
                    </button>
                  );
                }
                if (idx === currentPage - 2 || idx === currentPage + 2) {
                  return <span key={idx} className="pj-page-ellipsis">…</span>;
                }
                return null;
              })}
            </div>

            <button
              type="button"
              className="pj-page-btn nav-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}

export default PublicJournalsPage;
