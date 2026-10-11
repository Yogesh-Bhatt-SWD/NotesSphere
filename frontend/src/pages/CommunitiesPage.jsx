import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Compass,
  MessageSquare,
  Heart,
  Plus,
  Search,
  ArrowLeft,
  Send,
  Flag,
  Share2,
  Lock,
  Globe,
  Trash2,
  Leaf,
  Laptop,
  PenTool,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import communityService from '../api/communityService';
import journalService from '../api/journalService';
import { useAuth } from '../context/AuthContext';
import { CustomDropdown } from '../components/common/CustomDropdown';
import './CommunitiesPage.css';

export function CommunitiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'joined' | 'feed'
  const [selectedCommunity, setSelectedCommunity] = useState(null);

  // Community discovery state
  const [communities, setCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Feed state
  const [feedPosts, setFeedPosts] = useState([]);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [commentsMap, setCommentsMap] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  // Create community modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDesc, setNewCommunityDesc] = useState('');
  const [newCommunityCategory, setNewCommunityCategory] = useState('General');

  // Report modal state
  const [reportingPostId, setReportingPostId] = useState(null);
  const [reportReason, setReportReason] = useState('');

  // Load communities
  const loadCommunities = async () => {
    setIsLoading(true);
    try {
      const res = await communityService.getCommunities({
        query: searchQuery || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      });
      if (res?.data?.content) {
        setCommunities(res.data.content);
      }
    } catch (err) {
      console.error('Failed to load communities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadJoinedCommunities = async () => {
    try {
      const res = await communityService.getJoinedCommunities();
      if (res?.data) {
        setJoinedCommunities(res.data);
      }
    } catch (err) {
      console.error('Failed to load joined communities:', err);
    }
  };

  useEffect(() => {
    loadCommunities();
    loadJoinedCommunities();
  }, [searchQuery, selectedCategory]);

  // Check URL params for community feed
  useEffect(() => {
    const communityId = searchParams.get('id');
    if (communityId) {
      fetchCommunityFeed(communityId);
    }
  }, [searchParams]);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleJoin = async (communityId, e) => {
    e?.stopPropagation();
    try {
      await communityService.joinCommunity(communityId);
      showToast('Successfully joined community!');
      loadCommunities();
      loadJoinedCommunities();
    } catch (err) {
      showToast(err.message || 'Failed to join community', 'error');
    }
  };

  const handleLeave = async (communityId, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to leave this community?')) return;
    try {
      await communityService.leaveCommunity(communityId);
      showToast('Left community');
      if (selectedCommunity?.id === communityId) {
        setActiveTab('explore');
        setSelectedCommunity(null);
        setSearchParams({});
      }
      loadCommunities();
      loadJoinedCommunities();
    } catch (err) {
      showToast(err.message || 'Failed to leave community', 'error');
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!newCommunityName.trim()) return;

    try {
      await communityService.createCommunity({
        name: newCommunityName.trim(),
        description: newCommunityDesc.trim(),
        category: newCommunityCategory,
        icon: 'Users',
      });
      showToast('Community created successfully!');
      setShowCreateModal(false);
      setNewCommunityName('');
      setNewCommunityDesc('');
      loadCommunities();
      loadJoinedCommunities();
    } catch (err) {
      showToast(err.message || 'Failed to create community', 'error');
    }
  };

  const fetchCommunityFeed = async (communityId) => {
    setIsFeedLoading(true);
    try {
      const commRes = await communityService.getCommunityById(communityId);
      if (commRes?.data) {
        setSelectedCommunity(commRes.data);
      }
      const feedRes = await communityService.getCommunityFeed(communityId);
      if (feedRes?.data?.content) {
        setFeedPosts(feedRes.data.content);
        setActiveTab('feed');
      }
    } catch (err) {
      showToast(err.message || 'You must join this community to view its feed', 'error');
      setActiveTab('explore');
    } finally {
      setIsFeedLoading(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const res = await communityService.toggleReaction(postId);
      if (res?.data) {
        setFeedPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likedByCurrentUser: res.data.liked,
                  likeCount: res.data.likeCount,
                }
              : post
          )
        );
      }
    } catch (err) {
      showToast(err.message || 'Failed to react to post', 'error');
    }
  };

  const toggleComments = async (postId) => {
    const isExpanded = !!expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !commentsMap[postId]) {
      try {
        const res = await communityService.getComments(postId);
        if (res?.data) {
          setCommentsMap((prev) => ({ ...prev, [postId]: res.data }));
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
  };

  const handlePostComment = async (postId) => {
    const content = (commentInputs[postId] || '').trim();
    if (!content) return;

    try {
      const res = await communityService.addComment(postId, content);
      if (res?.data) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), res.data],
        }));
        setFeedPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, commentCount: (post.commentCount || 0) + 1 }
              : post
          )
        );
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to post comment', 'error');
    }
  };

  const handleReportSubmit = async () => {
    if (!reportingPostId || !reportReason.trim()) return;

    try {
      await communityService.reportPost(reportingPostId, reportReason.trim());
      showToast('Post reported to moderators. Thank you.');
      setReportingPostId(null);
      setReportReason('');
    } catch (err) {
      showToast(err.message || 'Failed to submit report', 'error');
    }
  };

  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'Leaf':
        return <Leaf size={22} />;
      case 'Laptop':
        return <Laptop size={22} />;
      case 'PenTool':
        return <PenTool size={22} />;
      case 'Activity':
        return <Activity size={22} />;
      default:
        return <Users size={22} />;
    }
  };

  const isJoined = (communityId) =>
    joinedCommunities.some((c) => c.id === communityId);

  return (
    <div className="communities-page">
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: notification.type === 'error' ? '#EF4444' : 'var(--primary)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 'var(--radius-pill)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            zIndex: 9999,
          }}
        >
          {notification.type === 'error' ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          {notification.msg}
        </div>
      )}

      {/* Header Row */}
      <div className="communities-header-row">
        <div className="communities-title-wrap">
          <h1>Communities & Feeds</h1>
          <p>Discover shared journals, join supportive spaces, and reflect together</p>
        </div>

        <div className="communities-actions">
          <button
            className="btn-create-community"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} /> New Community
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="community-tabs-nav">
        <button
          className={`community-tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('explore');
            setSelectedCommunity(null);
            setSearchParams({});
          }}
        >
          <Compass size={16} /> Discover Communities
        </button>

        <button
          className={`community-tab-btn ${activeTab === 'joined' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('joined');
            setSelectedCommunity(null);
            setSearchParams({});
          }}
        >
          <Users size={16} /> Joined Spaces ({joinedCommunities.length})
        </button>

        {selectedCommunity && (
          <button
            className={`community-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <MessageSquare size={16} /> {selectedCommunity.name} Feed
          </button>
        )}
      </div>

      {/* View 1 & 2: Communities Discovery or Joined */}
      {activeTab !== 'feed' && (
        <>
          <div className="communities-filter-bar">
            <div className="search-input-wrap">
              <Search
                size={16}
                style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search communities by name or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ minWidth: '200px' }}>
              <CustomDropdown
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                options={[
                  { value: 'ALL', label: 'All Categories' },
                  { value: 'Mindfulness', label: 'Mindfulness' },
                  { value: 'Work & Projects', label: 'Work & Projects' },
                  { value: 'Reflections', label: 'Reflections' },
                  { value: 'Fitness', label: 'Fitness' },
                  { value: 'Study', label: 'Study' },
                  { value: 'General', label: 'General' },
                ]}
                placeholder="Category Filter"
              />
            </div>
          </div>

          {(() => {
            const displayedCommunities = activeTab === 'joined' ? joinedCommunities : communities;
            if (displayedCommunities.length === 0) {
              return (
                <div className="community-not-found-card">
                  <div className="community-not-found-icon">
                    <Search size={30} />
                  </div>
                  <h3>Community Not Found</h3>
                  {searchQuery ? (
                    <p>
                      We couldn't find any community matching <strong>"{searchQuery}"</strong>
                      {selectedCategory !== 'ALL' ? ` in the "${selectedCategory}" category` : ''}.
                      <br />
                      Try adjusting your search keywords or create a new community space!
                    </p>
                  ) : activeTab === 'joined' ? (
                    <p>
                      You haven't joined any communities yet. Discover public communities and join spaces that inspire your journaling!
                    </p>
                  ) : (
                    <p>
                      No communities found in <strong>"{selectedCategory}"</strong>. Be the first to create one!
                    </p>
                  )}

                  <div className="community-not-found-actions">
                    {(searchQuery || selectedCategory !== 'ALL') && (
                      <button
                        type="button"
                        className="btn-clear-search"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('ALL');
                        }}
                      >
                        Clear Search & Filter
                      </button>
                    )}

                    {activeTab === 'joined' && (
                      <button
                        type="button"
                        className="btn-discover-more"
                        onClick={() => setActiveTab('explore')}
                      >
                        <Compass size={16} /> Discover Communities
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-create-community"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus size={16} /> Create Community
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="communities-grid">
                {displayedCommunities.map((comm) => {
                  const joined = isJoined(comm.id);
                  return (
                    <div
                      key={comm.id}
                      className="community-card"
                      onClick={() => {
                        if (joined) {
                          setSearchParams({ id: comm.id });
                        }
                      }}
                    >
                      <div className="community-card-top">
                        <div className="community-icon-box">{renderIcon(comm.icon)}</div>
                        <div className="community-card-info">
                          <h3>{comm.name}</h3>
                          <p>{comm.description || 'A space for mindful reflections and shared growth.'}</p>
                        </div>
                      </div>

                      <div className="community-meta-row">
                        <span className="community-tag-pill">{comm.category || 'General'}</span>
                        <span>•</span>
                        <span>{comm.memberCount} members</span>
                      </div>

                      <div className="community-card-actions">
                        {joined ? (
                          <>
                            <button
                              className="btn-community-action btn-community-view"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchParams({ id: comm.id });
                              }}
                            >
                              <MessageSquare size={14} /> Open Feed
                            </button>
                            <button
                              className="btn-community-action btn-community-leave"
                              onClick={(e) => handleLeave(comm.id, e)}
                            >
                              Leave
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-community-action btn-community-join"
                            onClick={(e) => handleJoin(comm.id, e)}
                          >
                            <Plus size={14} /> Join Space
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </>
      )}

      {/* View 3: Community Feed */}
      {activeTab === 'feed' && selectedCommunity && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="feed-header-card">
            <div className="feed-title-info">
              <h2>
                {renderIcon(selectedCommunity.icon)} {selectedCommunity.name}
              </h2>
              <p>{selectedCommunity.description}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>{selectedCommunity.memberCount} active members</span>
                <span>•</span>
                <span>Category: {selectedCommunity.category}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-create-community"
                onClick={() => navigate('/editor')}
                style={{ background: 'var(--primary)' }}
              >
                <Plus size={16} /> Publish Entry
              </button>
              <button
                className="btn-community-action btn-community-leave"
                onClick={() => handleLeave(selectedCommunity.id)}
              >
                Leave
              </button>
            </div>
          </div>

          {/* Posts List */}
          <div className="feed-posts-container">
            {feedPosts.length === 0 ? (
              <div
                style={{
                  background: '#FFFFFF',
                  padding: '48px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <Globe size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <h3>No publications yet in {selectedCommunity.name}</h3>
                <p style={{ marginTop: '6px' }}>Be the first to share an inspiring reflection!</p>
              </div>
            ) : (
              feedPosts.map((post) => {
                const comments = commentsMap[post.id] || [];
                const isExpanded = !!expandedComments[post.id];

                return (
                  <div key={post.id} className="feed-post-card">
                    <div className="feed-post-header">
                      <div className="author-meta">
                        <div className="author-avatar">
                          {(post.authorName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="author-name">{post.authorName || 'Anonymous Member'}</div>
                          <div className="post-date">
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recently'}
                          </div>
                        </div>
                      </div>

                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                        onClick={() => setReportingPostId(post.id)}
                        title="Report Post"
                      >
                        <Flag size={15} />
                      </button>
                    </div>

                    <div>
                      <h3 className="feed-post-title">{post.title}</h3>
                      <p className="feed-post-body">{post.content}</p>
                    </div>

                    <div className="feed-post-badges">
                      {post.category && (
                        <span className="community-tag-pill">{post.category}</span>
                      )}
                      {post.tags?.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: '0.76rem',
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-subtle)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    <div className="feed-post-actions-row">
                      <button
                        className={`reaction-btn ${post.likedByCurrentUser ? 'liked' : ''}`}
                        onClick={() => handleToggleLike(post.id)}
                      >
                        <Heart size={16} /> {post.likeCount || 0} Likes
                      </button>

                      <button
                        className="reaction-btn"
                        onClick={() => toggleComments(post.id)}
                      >
                        <MessageSquare size={16} /> {post.commentCount || 0} Comments
                      </button>
                    </div>

                    {/* Expandable comments list */}
                    {isExpanded && (
                      <div className="comments-panel">
                        {comments.length === 0 ? (
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                            No comments yet. Start the conversation!
                          </div>
                        ) : (
                          comments.map((c) => (
                            <div key={c.id} className="comment-item">
                              <div className="comment-author-row">
                                <span>{c.authorName || 'Member'}</span>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="comment-text">{c.content}</div>
                            </div>
                          ))
                        )}

                        <div className="comment-input-box">
                          <input
                            type="text"
                            placeholder="Write a supportive comment..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs({
                                ...commentInputs,
                                [post.id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handlePostComment(post.id);
                            }}
                          />
                          <button
                            className="comment-post-btn"
                            onClick={() => handlePostComment(post.id)}
                          >
                            <Send size={14} /> Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Community */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title-row">
              <h2>Create New Community</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCommunity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="modal-field">
                <label>Community Name</label>
                <input
                  type="text"
                  placeholder="e.g. Writers Guild"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  required
                />
              </div>

              <div className="modal-field">
                <label>Category</label>
                <CustomDropdown
                  value={newCommunityCategory}
                  onChange={(val) => setNewCommunityCategory(val)}
                  options={[
                    { value: 'General', label: 'General' },
                    { value: 'Mindfulness', label: 'Mindfulness' },
                    { value: 'Work & Projects', label: 'Work & Projects' },
                    { value: 'Reflections', label: 'Reflections' },
                    { value: 'Fitness', label: 'Fitness' },
                    { value: 'Study', label: 'Study' },
                  ]}
                  placeholder="Select Category"
                />
              </div>

              <div className="modal-field">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="What is the purpose of this community?"
                  value={newCommunityDesc}
                  onChange={(e) => setNewCommunityDesc(e.target.value)}
                />
              </div>

              <div className="modal-buttons-row">
                <button
                  type="button"
                  className="btn-community-action btn-community-view"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-community-action btn-community-join"
                  disabled={!newCommunityName.trim()}
                >
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Report Post */}
      {reportingPostId && (
        <div className="modal-overlay" onClick={() => setReportingPostId(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title-row">
              <h2>Report Publication</h2>
              <button
                onClick={() => setReportingPostId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-field">
              <label>Reason for reporting</label>
              <textarea
                rows={3}
                placeholder="Explain why this content violates community guidelines..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
            </div>

            <div className="modal-buttons-row">
              <button
                className="btn-community-action btn-community-view"
                onClick={() => setReportingPostId(null)}
              >
                Cancel
              </button>
              <button
                className="btn-community-action btn-community-leave"
                onClick={handleReportSubmit}
                disabled={!reportReason.trim()}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunitiesPage;
