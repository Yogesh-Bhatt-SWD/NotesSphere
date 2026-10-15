import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  FileText,
  User,
  UserPlus,
  Check,
  Plus,
  Clock,
  BookOpen,
  MessageSquare,
  AlertCircle,
  Eye
} from 'lucide-react';
import searchService from '../api/searchService';
import friendService from '../api/friendService';
import communityService from '../api/communityService';
import { normalizeAvatarUrl, getAuthorInitial } from '../utils/avatarUtils';
import './SearchPage.css';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = searchParams.get('q') || '';
  const activeTab = (searchParams.get('type') || 'ALL').toUpperCase();

  const [inputVal, setInputVal] = useState(queryParam);
  const [prevQuery, setPrevQuery] = useState(queryParam);
  if (queryParam !== prevQuery) {
    setPrevQuery(queryParam);
    setInputVal(queryParam);
  }

  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [friendshipOverrides, setFriendshipOverrides] = useState({});
  const [joinedOverrides, setJoinedOverrides] = useState({});
  const [actionLoadingIds, setActionLoadingIds] = useState(new Set());

  // Trigger search on query, activeTab, or page change
  useEffect(() => {
    let isCancelled = false;

    async function fetchSearch() {
      const q = queryParam.trim();
      if (!q) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await searchService.globalSearch(q, activeTab, page, pageSize);
        if (!isCancelled) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('SearchPage error:', err);
          setError(err?.message || 'Failed to fetch search results');
          setData(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchSearch();

    return () => {
      isCancelled = true;
    };
  }, [queryParam, activeTab, page, pageSize]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const trimmed = inputVal.trim();
    setPage(0);
    setSearchParams({ q: trimmed, type: activeTab });
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setPage(0);
    setSearchParams({ q: queryParam, type: tab });
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

  const people = data?.people?.items || [];
  const peopleTotal = data?.people?.total || 0;
  const blogs = data?.blogs?.items || [];
  const blogsTotal = data?.blogs?.total || 0;
  const communities = data?.communities?.items || [];
  const communitiesTotal = data?.communities?.total || 0;
  const communityPosts = data?.communityPosts?.items || [];
  const communityPostsTotal = data?.communityPosts?.total || 0;
  const totalResults = data?.totalResults || 0;

  let currentGroup = null;
  if (activeTab === 'PEOPLE') currentGroup = data?.people;
  else if (activeTab === 'BLOGS') currentGroup = data?.blogs;
  else if (activeTab === 'COMMUNITIES') currentGroup = data?.communities;
  else if (activeTab === 'COMMUNITY_POSTS') currentGroup = data?.communityPosts;

  const totalPages = currentGroup?.totalPages || 0;

  const isTabEmpty = !loading && !error && data && (
    (activeTab === 'ALL' && totalResults === 0) ||
    (activeTab === 'PEOPLE' && peopleTotal === 0) ||
    (activeTab === 'BLOGS' && blogsTotal === 0) ||
    (activeTab === 'COMMUNITIES' && communitiesTotal === 0) ||
    (activeTab === 'COMMUNITY_POSTS' && communityPostsTotal === 0)
  );

  function renderEmptyMessage() {
    const qStr = queryParam.trim();
    if (activeTab === 'PEOPLE') return `No users found for '${qStr}'.`;
    if (activeTab === 'BLOGS') return `No articles found for '${qStr}'.`;
    if (activeTab === 'COMMUNITIES') return `No communities found for '${qStr}'.`;
    if (activeTab === 'COMMUNITY_POSTS') return `No community posts found for '${qStr}'.`;
    return `No results found for '${qStr}'. Try another name or keyword.`;
  }

  return (
    <div className="search-page">
      {/* Header and Search Input */}
      <div className="search-page-header">
        <div className="search-page-title-row">
          <h1 className="search-page-title">Global Discovery</h1>
          {queryParam && (
            <span className="search-page-subtitle">
              Results for <strong>"{queryParam}"</strong> ({totalResults} found)
            </span>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="search-page-input-box">
          <Search size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="search-page-input"
            placeholder="Search people, articles, communities..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
        </form>
      </div>

      {/* Tabs */}
      <div className="search-page-tabs">
        <button
          className={`search-page-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => handleTabChange('ALL')}
        >
          All {data && `(${totalResults})`}
        </button>
        <button
          className={`search-page-tab-btn ${activeTab === 'PEOPLE' ? 'active' : ''}`}
          onClick={() => handleTabChange('PEOPLE')}
        >
          People {data && `(${peopleTotal})`}
        </button>
        <button
          className={`search-page-tab-btn ${activeTab === 'BLOGS' ? 'active' : ''}`}
          onClick={() => handleTabChange('BLOGS')}
        >
          Articles {data && `(${blogsTotal})`}
        </button>
        <button
          className={`search-page-tab-btn ${activeTab === 'COMMUNITIES' ? 'active' : ''}`}
          onClick={() => handleTabChange('COMMUNITIES')}
        >
          Communities {data && `(${communitiesTotal})`}
        </button>
        <button
          className={`search-page-tab-btn ${activeTab === 'COMMUNITY_POSTS' ? 'active' : ''}`}
          onClick={() => handleTabChange('COMMUNITY_POSTS')}
        >
          Community Posts {data && `(${communityPostsTotal})`}
        </button>
      </div>

      {/* Results Body */}
      <div className="search-page-results-container">
        {loading && (
          <div className="search-dropdown-loading">
            <div className="search-spinner" />
            <span>Discovering results across NoteSphere...</span>
          </div>
        )}

        {!loading && error && (
          <div className="search-error-state">
            <AlertCircle size={28} color="#EF4444" />
            <div className="search-error-text">Unable to load search results. Please check your connection.</div>
            <button
              className="search-retry-btn"
              onClick={() => {
                setError(null);
                setPage(0);
              }}
            >
              Retry
            </button>
          </div>
        )}

        {isTabEmpty && (
          <div className="search-empty-state">
            <div className="search-empty-icon">
              <Search size={26} />
            </div>
            <div className="search-empty-text">{renderEmptyMessage()}</div>
            <div className="search-empty-subtext">Try refining your search keywords or browsing different categories.</div>
          </div>
        )}

        {!loading && !error && data && !isTabEmpty && (
          <>
            {/* People Grid */}
            {(activeTab === 'ALL' || activeTab === 'PEOPLE') && people.length > 0 && (
              <div className="search-section">
                <div className="search-section-header">
                  <span className="search-section-title">
                    <User size={15} /> People ({peopleTotal})
                  </span>
                  {activeTab === 'ALL' && peopleTotal > people.length && (
                    <button className="search-view-all-btn" onClick={() => handleTabChange('PEOPLE')}>
                      View all ({peopleTotal})
                    </button>
                  )}
                </div>
                <div className="search-grid-two-col">
                  {people.map((person) => {
                    const override = friendshipOverrides[person.id];
                    const status = override ? override.status : person.friendshipStatus;
                    const isActing = actionLoadingIds.has(person.id);

                    return (
                      <div
                        key={person.id}
                        className="search-card-person"
                        onClick={() => navigate(`/profile/${person.id}`)}
                      >
                        <div className="search-person-info">
                          {(() => {
                            const personAvatar = normalizeAvatarUrl(person.avatarUrl);
                            const personInitial = getAuthorInitial(person.fullName || person.username || 'U');
                            return (
                              <>
                                {personAvatar ? (
                                  <img
                                    src={personAvatar}
                                    alt={person.fullName || person.username}
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
                                  style={{ display: personAvatar ? 'none' : 'flex' }}
                                >
                                  {personInitial}
                                </div>
                              </>
                            );
                          })()}
                          <div className="search-person-text">
                            <span className="search-person-name">{person.fullName || person.username}</span>
                            <span className="search-person-meta">
                              @{person.username} {person.bio ? `• ${person.bio}` : ''}
                            </span>
                          </div>
                        </div>

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
              </div>
            )}

            {/* Articles Grid */}
            {(activeTab === 'ALL' || activeTab === 'BLOGS') && blogs.length > 0 && (
              <div className="search-section">
                <div className="search-section-header">
                  <span className="search-section-title">
                    <BookOpen size={15} /> Published Articles ({blogsTotal})
                  </span>
                  {activeTab === 'ALL' && blogsTotal > blogs.length && (
                    <button className="search-view-all-btn" onClick={() => handleTabChange('BLOGS')}>
                      View all ({blogsTotal})
                    </button>
                  )}
                </div>
                <div className="search-grid-two-col">
                  {blogs.map((blog) => (
                    <div
                      key={blog.id}
                      className="search-card-blog"
                      onClick={() => navigate(`/blogs/${blog.slug || blog.id}`)}
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
              </div>
            )}

            {/* Communities Grid */}
            {(activeTab === 'ALL' || activeTab === 'COMMUNITIES') && communities.length > 0 && (
              <div className="search-section">
                <div className="search-section-header">
                  <span className="search-section-title">
                    <Users size={15} /> Communities ({communitiesTotal})
                  </span>
                  {activeTab === 'ALL' && communitiesTotal > communities.length && (
                    <button className="search-view-all-btn" onClick={() => handleTabChange('COMMUNITIES')}>
                      View all ({communitiesTotal})
                    </button>
                  )}
                </div>
                <div className="search-grid-two-col">
                  {communities.map((comm) => {
                    const isJoined = joinedOverrides[comm.id] ?? comm.member;
                    const isActing = actionLoadingIds.has(comm.id);

                    return (
                      <div
                        key={comm.id}
                        className="search-card-community"
                        onClick={() => navigate(`/communities?id=${comm.id}`)}
                      >
                        <div className="search-community-info">
                          <div className="search-community-icon">
                            <Users size={20} />
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
              </div>
            )}

            {/* Community Posts */}
            {(activeTab === 'ALL' || activeTab === 'COMMUNITY_POSTS') && communityPosts.length > 0 && (
              <div className="search-section">
                <div className="search-section-header">
                  <span className="search-section-title">
                    <MessageSquare size={15} /> Accessible Community Posts ({communityPostsTotal})
                  </span>
                  {activeTab === 'ALL' && communityPostsTotal > communityPosts.length && (
                    <button className="search-view-all-btn" onClick={() => handleTabChange('COMMUNITY_POSTS')}>
                      View all ({communityPostsTotal})
                    </button>
                  )}
                </div>
                <div className="search-grid-two-col">
                  {communityPosts.map((post) => (
                    <div
                      key={post.id}
                      className="search-card-blog"
                      onClick={() => navigate(`/blogs/${post.slug || post.id}`)}
                    >
                      <div className="search-blog-cover-placeholder">
                        <MessageSquare size={22} />
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
              </div>
            )}

            {/* Pagination Controls */}
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
    </div>
  );
}

export default SearchPage;
