import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  FileText,
  User,
  UserPlus,
  UserCheck,
  Clock,
  Check,
  Plus,
  BookOpen,
  MessageSquare,
  ArrowRight,
  X,
  AlertCircle,
  Eye
} from 'lucide-react';
import searchService from '../../api/searchService';
import friendService from '../../api/friendService';
import communityService from '../../api/communityService';
import './GlobalSearchDropdown.css';

export function GlobalSearchDropdown({ query, isOpen, onClose }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);

  // Local optimistic action state tracking
  const [friendshipOverrides, setFriendshipOverrides] = useState({});
  const [joinedOverrides, setJoinedOverrides] = useState({});
  const [actionLoadingIds, setActionLoadingIds] = useState(new Set());

  // Close on Escape or click outside
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset page when switching tabs or query changes
  useEffect(() => {
    setPage(0);
  }, [activeTab, query]);

  // Fetch search results whenever query, activeTab, or page changes
  useEffect(() => {
    let isCancelled = false;

    async function executeSearch() {
      const trimmed = (query || '').trim();
      if (!trimmed || !isOpen) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const pageSize = activeTab === 'ALL' ? 5 : 8;
        const res = await searchService.globalSearch(trimmed, activeTab, page, pageSize);
        if (!isCancelled) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Global search error:', err);
          setError(err?.message || 'Failed to load search results');
          setData(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    executeSearch();

    return () => {
      isCancelled = true;
    };
  }, [query, activeTab, page, isOpen]);

  if (!isOpen || !(query || '').trim()) {
    return null;
  }

  // Handle Add Friend Action
  async function handleAddFriend(e, personId) {
    e.stopPropagation();
    if (actionLoadingIds.has(personId)) return;

    setActionLoadingIds((prev) => new Set(prev).add(personId));
    try {
      await friendService.sendFriendRequest(personId);
      setFriendshipOverrides((prev) => ({
        ...prev,
        [personId]: { status: 'PENDING_SENT' }
      }));
    } catch (err) {
      console.error('Failed to send friend request:', err);
    } finally {
      setActionLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
    }
  }

  // Handle Accept Friend Request Action
  async function handleAcceptFriend(e, personId, requestId) {
    e.stopPropagation();
    if (!requestId || actionLoadingIds.has(personId)) return;

    setActionLoadingIds((prev) => new Set(prev).add(personId));
    try {
      await friendService.acceptFriendRequest(requestId);
      setFriendshipOverrides((prev) => ({
        ...prev,
        [personId]: { status: 'FRIENDS' }
      }));
    } catch (err) {
      console.error('Failed to accept friend request:', err);
    } finally {
      setActionLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
    }
  }

  // Handle Join Community Action
  async function handleJoinCommunity(e, communityId) {
    e.stopPropagation();
    if (actionLoadingIds.has(communityId)) return;

    setActionLoadingIds((prev) => new Set(prev).add(communityId));
    try {
      await communityService.joinCommunity(communityId);
      setJoinedOverrides((prev) => ({
        ...prev,
        [communityId]: true
      }));
    } catch (err) {
      console.error('Failed to join community:', err);
    } finally {
      setActionLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(communityId);
        return next;
      });
    }
  }

  function handleNavigate(path) {
    onClose();
    navigate(path);
  }

  const people = data?.people?.items || [];
  const peopleTotal = data?.people?.total || 0;
  const blogs = data?.blogs?.items || [];
  const blogsTotal = data?.blogs?.total || 0;
  const communities = data?.communities?.items || [];
  const communitiesTotal = data?.communities?.total || 0;
  const communityPosts = data?.communityPosts?.items || [];
  const communityPostsTotal = data?.communityPosts?.total || 0;
  const totalResults = data?.totalResults || 0;

  // Active group pagination info
  let currentGroup = null;
  if (activeTab === 'PEOPLE') currentGroup = data?.people;
  else if (activeTab === 'BLOGS') currentGroup = data?.blogs;
  else if (activeTab === 'COMMUNITIES') currentGroup = data?.communities;
  else if (activeTab === 'COMMUNITY_POSTS') currentGroup = data?.communityPosts;

  const totalPages = currentGroup?.totalPages || 0;

  // Determine if active view is empty
  const isTabEmpty = !loading && !error && data && (
    (activeTab === 'ALL' && totalResults === 0) ||
    (activeTab === 'PEOPLE' && peopleTotal === 0) ||
    (activeTab === 'BLOGS' && blogsTotal === 0) ||
    (activeTab === 'COMMUNITIES' && communitiesTotal === 0) ||
    (activeTab === 'COMMUNITY_POSTS' && communityPostsTotal === 0)
  );

  // Render accurate category-specific empty state text
  function renderEmptyMessage() {
    const qStr = query.trim();
    if (activeTab === 'PEOPLE') {
      return `No users found for '${qStr}'.`;
    }
    if (activeTab === 'BLOGS') {
      return `No articles found for '${qStr}'.`;
    }
    if (activeTab === 'COMMUNITIES') {
      return `No communities found for '${qStr}'.`;
    }
    if (activeTab === 'COMMUNITY_POSTS') {
      return `No community posts found for '${qStr}'.`;
    }
    return `No results found for '${qStr}'. Try another name or keyword.`;
  }

  return (
    <div className="global-search-dropdown-overlay" ref={dropdownRef} role="dialog" aria-label="Search results">
      {/* Category Tabs Header */}
      <div className="search-dropdown-header">
        <div className="search-dropdown-tabs">
          <button
            className={`search-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            All
            {data && <span className="search-tab-count">{totalResults}</span>}
          </button>
          <button
            className={`search-tab-btn ${activeTab === 'PEOPLE' ? 'active' : ''}`}
            onClick={() => setActiveTab('PEOPLE')}
          >
            People
            {data && <span className="search-tab-count">{peopleTotal}</span>}
          </button>
          <button
            className={`search-tab-btn ${activeTab === 'BLOGS' ? 'active' : ''}`}
            onClick={() => setActiveTab('BLOGS')}
          >
            Articles
            {data && <span className="search-tab-count">{blogsTotal}</span>}
          </button>
          <button
            className={`search-tab-btn ${activeTab === 'COMMUNITIES' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMMUNITIES')}
          >
            Communities
            {data && <span className="search-tab-count">{communitiesTotal}</span>}
          </button>
          <button
            className={`search-tab-btn ${activeTab === 'COMMUNITY_POSTS' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMMUNITY_POSTS')}
          >
            Posts
            {data && <span className="search-tab-count">{communityPostsTotal}</span>}
          </button>
        </div>

        <button
          className="search-dropdown-close-btn"
          onClick={onClose}
          aria-label="Close search dropdown"
        >
          <X size={16} />
        </button>
      </div>

      {/* Dropdown Body */}
      <div className="search-dropdown-body">
        {/* Loading Spinner */}
        {loading && (
          <div className="search-dropdown-loading">
            <div className="search-spinner" />
            <span>Searching NoteSphere...</span>
          </div>
        )}

        {/* Retryable Error State */}
        {!loading && error && (
          <div className="search-error-state">
            <AlertCircle size={24} color="#EF4444" />
            <div className="search-error-text">Unable to load search results. Please check your connection.</div>
            <button
              className="search-retry-btn"
              onClick={() => {
                setError(null);
                setPage(0);
                setActiveTab((t) => t);
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Category-Specific Empty State */}
        {isTabEmpty && (
          <div className="search-empty-state">
            <div className="search-empty-icon">
              <Search size={22} />
            </div>
            <div className="search-empty-text">{renderEmptyMessage()}</div>
            <div className="search-empty-subtext">Check spelling or search by different keywords.</div>
          </div>
        )}

        {/* Content Renderers */}
        {!loading && !error && data && !isTabEmpty && (
          <>
            {/* --- PEOPLE SECTION --- */}
            {(activeTab === 'ALL' || activeTab === 'PEOPLE') && people.length > 0 && (
              <div className="search-section">
                {activeTab === 'ALL' && (
                  <div className="search-section-header">
                    <span className="search-section-title">
                      <User size={13} /> People ({peopleTotal})
                    </span>
                    {peopleTotal > people.length && (
                      <button
                        className="search-view-all-btn"
                        onClick={() => setActiveTab('PEOPLE')}
                      >
                        View all
                      </button>
                    )}
                  </div>
                )}
                {people.map((person) => {
                  const override = friendshipOverrides[person.id];
                  const status = override ? override.status : person.friendshipStatus;
                  const isActing = actionLoadingIds.has(person.id);

                  return (
                    <div
                      key={person.id}
                      className="search-item-person"
                      onClick={() => handleNavigate(`/profile/${person.id}`)}
                    >
                      <div className="search-person-info">
                        {person.avatarUrl ? (
                          <img
                            src={person.avatarUrl}
                            alt={person.fullName}
                            className="search-person-avatar"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="search-person-initial"
                          style={{ display: person.avatarUrl ? 'none' : 'flex' }}
                        >
                          {(person.fullName || person.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="search-person-text">
                          <span className="search-person-name">{person.fullName || person.username}</span>
                          <span className="search-person-meta">
                            @{person.username} {person.bio ? `• ${person.bio}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Friendship Status Button */}
                      {status === 'FRIENDS' && (
                        <span className="search-friend-btn friends">
                          <Check size={12} /> Friends
                        </span>
                      )}
                      {status === 'PENDING_SENT' && (
                        <span className="search-friend-btn pending">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                      {status === 'PENDING_RECEIVED' && (
                        <button
                          className="search-friend-btn accept"
                          onClick={(e) => handleAcceptFriend(e, person.id, person.friendRequestId)}
                          disabled={isActing}
                        >
                          <Check size={12} /> Accept
                        </button>
                      )}
                      {(!status || status === 'NONE') && (
                        <button
                          className="search-friend-btn add"
                          onClick={(e) => handleAddFriend(e, person.id)}
                          disabled={isActing}
                        >
                          <UserPlus size={12} /> Add Friend
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* --- BLOGS & ARTICLES SECTION --- */}
            {(activeTab === 'ALL' || activeTab === 'BLOGS') && blogs.length > 0 && (
              <div className="search-section">
                {activeTab === 'ALL' && (
                  <div className="search-section-header">
                    <span className="search-section-title">
                      <BookOpen size={13} /> Articles ({blogsTotal})
                    </span>
                    {blogsTotal > blogs.length && (
                      <button
                        className="search-view-all-btn"
                        onClick={() => setActiveTab('BLOGS')}
                      >
                        View all
                      </button>
                    )}
                  </div>
                )}
                {blogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="search-item-blog"
                    onClick={() => handleNavigate(`/blogs/${blog.slug || blog.id}`)}
                  >
                    {(blog.coverImageUrl || blog.coverImage) ? (
                      <img src={blog.coverImageUrl || blog.coverImage} alt={blog.title} className="search-blog-cover" />
                    ) : (
                      <div className="search-blog-cover-placeholder">
                        <FileText size={22} />
                      </div>
                    )}
                    <div className="search-blog-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="search-blog-title">{blog.title}</span>
                        {blog.friendAuthor && (
                          <span className="search-friend-badge">
                            <Check size={10} /> Friend
                          </span>
                        )}
                      </div>
                      {blog.excerpt && <p className="search-blog-excerpt">{blog.excerpt}</p>}
                      <div className="search-blog-footer">
                        <span>by {blog.authorName || 'Writer'}</span>
                        <span>•</span>
                        <span>{blog.readingTimeMinutes || 2} min read</span>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Eye size={11} /> {blog.viewCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* --- COMMUNITIES SECTION --- */}
            {(activeTab === 'ALL' || activeTab === 'COMMUNITIES') && communities.length > 0 && (
              <div className="search-section">
                {activeTab === 'ALL' && (
                  <div className="search-section-header">
                    <span className="search-section-title">
                      <Users size={13} /> Communities ({communitiesTotal})
                    </span>
                    {communitiesTotal > communities.length && (
                      <button
                        className="search-view-all-btn"
                        onClick={() => setActiveTab('COMMUNITIES')}
                      >
                        View all
                      </button>
                    )}
                  </div>
                )}
                {communities.map((comm) => {
                  const isJoined = joinedOverrides[comm.id] ?? comm.member;
                  const isActing = actionLoadingIds.has(comm.id);

                  return (
                    <div
                      key={comm.id}
                      className="search-item-community"
                      onClick={() => handleNavigate(`/communities?id=${comm.id}`)}
                    >
                      <div className="search-community-info">
                        <div className="search-community-icon">
                          <Users size={18} />
                        </div>
                        <div className="search-community-text">
                          <span className="search-community-name">{comm.name}</span>
                          <span className="search-community-meta">
                            {comm.category || 'General'} • {comm.memberCount || 1} members
                            {comm.description ? ` • ${comm.description}` : ''}
                          </span>
                        </div>
                      </div>

                      {isJoined ? (
                        <span className="search-friend-btn friends">
                          <Check size={12} /> Joined
                        </span>
                      ) : (
                        <button
                          className="search-friend-btn add"
                          onClick={(e) => handleJoinCommunity(e, comm.id)}
                          disabled={isActing}
                        >
                          <Plus size={12} /> Join
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* --- COMMUNITY POSTS SECTION --- */}
            {(activeTab === 'ALL' || activeTab === 'COMMUNITY_POSTS') && communityPosts.length > 0 && (
              <div className="search-section">
                {activeTab === 'ALL' && (
                  <div className="search-section-header">
                    <span className="search-section-title">
                      <MessageSquare size={13} /> Community Posts ({communityPostsTotal})
                    </span>
                    {communityPostsTotal > communityPosts.length && (
                      <button
                        className="search-view-all-btn"
                        onClick={() => setActiveTab('COMMUNITY_POSTS')}
                      >
                        View all
                      </button>
                    )}
                  </div>
                )}
                {communityPosts.map((post) => (
                  <div
                    key={post.id}
                    className="search-item-blog"
                    onClick={() => handleNavigate(`/blogs/${post.slug || post.id}`)}
                  >
                    <div className="search-blog-cover-placeholder">
                      <MessageSquare size={20} />
                    </div>
                    <div className="search-blog-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="search-blog-title">{post.title}</span>
                        {post.friendAuthor && (
                          <span className="search-friend-badge">
                            <Check size={10} /> Friend
                          </span>
                        )}
                      </div>
                      {post.excerpt && <p className="search-blog-excerpt">{post.excerpt}</p>}
                      <div className="search-blog-footer">
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          [{post.communityName || 'Community'}]
                        </span>
                        <span>by {post.authorName || 'Member'}</span>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Eye size={11} /> {post.viewCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination controls for single-category tabs */}
            {activeTab !== 'ALL' && totalPages > 1 && (
              <div className="search-pagination-bar">
                <button
                  className="search-page-btn"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </button>
                <span className="search-page-indicator">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  className="search-page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dropdown Footer with View All in Search Page */}
      <div className="search-dropdown-footer">
        <span>Press <kbd style={{ padding: '1px 5px', background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>Esc</kbd> to close</span>
        <button
          className="search-full-results-link"
          onClick={() => handleNavigate(`/search?q=${encodeURIComponent(query.trim())}&type=${activeTab}`)}
        >
          View all results <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

export default GlobalSearchDropdown;
