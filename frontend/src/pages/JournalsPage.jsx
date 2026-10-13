import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Star,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Globe,
  Share2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Users,
  Calendar,
  Clock,
  Heart,
  MessageSquare,
  ExternalLink,
  BookOpen,
  Eye,
  Loader2
} from 'lucide-react';
import journalService from '../api/journalService';
import categoryService from '../api/categoryService';
import communityService from '../api/communityService';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { ContentDetailModal } from '../components/common/ContentDetailModal';
import ShareModal from '../components/common/ShareModal';
import { formatJournalCardDate } from '../utils/dateUtils';
import './JournalsPage.css';

export function JournalsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'published' ? 'published' : 'all';

  const setActiveTab = (tab) => {
    if (tab === 'published') {
      setSearchParams({ tab: 'published' });
    } else {
      setSearchParams({});
    }
  };

  const [entries, setEntries] = useState([]);
  const [publishedEntries, setPublishedEntries] = useState([]);
  const [isLoadingPublished, setIsLoadingPublished] = useState(false);
  const [categories, setCategories] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);

  // Filters
  const [search, setSearch] = useState(() => searchParams.get('search') || searchParams.get('tag') || '');
  const [activeSentiment, setActiveSentiment] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'ALL');
  const [selectedVisibility, setSelectedVisibility] = useState('ALL'); // 'ALL' | 'PRIVATE' | 'COMMUNITY'
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for Spring Data
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Quick publish modal
  const [publishingEntry, setPublishingEntry] = useState(null);
  const [publishMode, setPublishMode] = useState('PUBLIC'); // 'PUBLIC' | 'COMMUNITY'
  const [selectedCommunityId, setSelectedCommunityId] = useState('');

  // Story detail modal
  const [previewJournal, setPreviewJournal] = useState(null);

  // Share Blog Modal
  const [shareJournal, setShareJournal] = useState(null);
  const [unpublishingId, setUnpublishingId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadCategories = async () => {
    try {
      const res = await categoryService.getCategories();
      if (res?.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadJoinedCommunities = async () => {
    try {
      const res = await communityService.getJoinedCommunities();
      if (res?.data) {
        setJoinedCommunities(res.data);
        if (res.data.length > 0) {
          setSelectedCommunityId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load communities:', err);
    }
  };

  const loadJournals = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        size: 8,
        search: search.trim() || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        sentiment: activeSentiment !== 'ALL' ? activeSentiment : undefined,
        visibility: selectedVisibility !== 'ALL' ? selectedVisibility : undefined,
      };

      const res = await journalService.getJournals(params);
      if (res?.data) {
        setEntries(res.data.content || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load journals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublishedJournals = async () => {
    setIsLoadingPublished(true);
    try {
      const res = await journalService.getPublishedJournals({ page: 0, size: 50 });
      if (res?.data?.content) {
        setPublishedEntries(res.data.content);
      } else if (Array.isArray(res?.data)) {
        setPublishedEntries(res.data);
      }
    } catch (err) {
      console.error('Failed to load published journals:', err);
    } finally {
      setIsLoadingPublished(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadJoinedCommunities();
    loadPublishedJournals();
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    const s = searchParams.get('search') || searchParams.get('tag');
    if (cat) setSelectedCategory(cat);
    if (s !== null && s !== undefined) setSearch(s);
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'published') {
      loadPublishedJournals();
    } else {
      loadJournals();
    }
  }, [search, activeSentiment, selectedCategory, selectedVisibility, currentPage, activeTab]);

  const handleUnpublishFromTimeline = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Revert this publication to private? It will be removed from the community feed.')) return;

    try {
      setUnpublishingId(id);
      await journalService.unpublishJournal(id);
      showToast('Journal reverted to private');
      setPublishedEntries((prev) => prev.filter((item) => item.id !== id));
      loadJournals();
    } catch (err) {
      showToast(err.message || 'Failed to unpublish journal', 'error');
    } finally {
      setUnpublishingId(null);
    }
  };

  const formatPublishedDate = (isoStr) => {
    if (!isoStr) return 'Recently';
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPublishedTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleFavorite = async (id, e) => {
    e.stopPropagation();
    try {
      await journalService.toggleFavorite(id);
      setEntries((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, favorite: !item.favorite } : item
        )
      );
    } catch (err) {
      showToast('Failed to update favorite status', 'error');
    }
  };

  const deleteEntry = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;

    try {
      await journalService.deleteJournal(id);
      window.dispatchEvent(new CustomEvent('notesphere:journal-mutated'));
      showToast('Journal entry deleted');
      loadJournals();
    } catch (err) {
      showToast(err.message || 'Failed to delete entry', 'error');
    }
  };

  const handleOpenPublishModal = (entry, e) => {
    e.stopPropagation();
    setPublishingEntry(entry);
  };

  const handleConfirmPublish = async () => {
    if (!publishingEntry) return;

    try {
      let publishedResult = null;
      if (publishMode === 'PUBLIC') {
        const res = await journalService.publishJournal(publishingEntry.id, { visibility: 'PUBLIC' });
        publishedResult = res?.data || publishingEntry;
        showToast('Journal published to public feed successfully!');
      } else {
        if (!selectedCommunityId) {
          showToast('Please select a community to publish to', 'error');
          return;
        }
        const res = await journalService.publishJournal(publishingEntry.id, { communityId: selectedCommunityId, visibility: 'COMMUNITY' });
        publishedResult = res?.data || publishingEntry;
        showToast('Journal published to community feed successfully!');
      }
      const entryToShare = publishedResult || publishingEntry;
      setPublishingEntry(null);
      loadJournals();
      if (activeTab === 'published') {
        loadPublishedJournals();
      }
      // Immediately open ShareModal so author can copy and share link
      setShareJournal(entryToShare);
    } catch (err) {
      showToast(err.message || 'Failed to publish journal', 'error');
    }
  };

  const handleUnpublish = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Revert this publication to private? It will be removed from the community feed.')) return;

    try {
      setUnpublishingId(id);
      await journalService.unpublishJournal(id);
      showToast('Journal reverted to private');
      loadJournals();
      if (activeTab === 'published') {
        loadPublishedJournals();
      }
    } catch (err) {
      showToast(err.message || 'Failed to unpublish journal', 'error');
    } finally {
      setUnpublishingId(null);
    }
  };

  return (
    <div className="journals-page">
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
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {notification.msg}
        </div>
      )}

      {/* Header Row */}
      <div className="journals-header-row">
        <div className="journals-title-wrap">
          <h1>My Journals</h1>
          <p>Browse your private entries and community publications in one place</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="journals-search-box">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search journals..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(0);
                }}
                style={{
                  width: '100%',
                  padding: '9px 16px 9px 38px',
                  borderRadius: '999px',
                  border: '1px solid var(--border-subtle)',
                  background: '#FFFFFF',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          <button
            className="btn-card-publish"
            onClick={() => navigate('/editor')}
            style={{
              padding: '9px 18px',
              fontSize: '0.88rem',
              background: 'var(--primary)',
              color: '#ffffff',
            }}
          >
            <Plus size={16} /> Write Entry
          </button>
        </div>
      </div>

      <div className="center-page-body">
        {/* View Switcher Tabs: All Journals vs Published Timeline */}
        <div className="journals-view-tabs">
          <button
            className={`journals-view-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <BookOpen size={16} /> All Journals ({entries.length})
          </button>
          <button
            className={`journals-view-tab-btn ${activeTab === 'published' ? 'active' : ''}`}
            onClick={() => setActiveTab('published')}
          >
            <Globe size={16} /> Published Timeline ({publishedEntries.length})
          </button>
        </div>

        {activeTab === 'published' ? (
          /* ================= PUBLISHED TIMELINE VIEW ================= */
          <div className="timeline-view-container">
            {isLoadingPublished ? (
              <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                Loading your published timeline...
              </div>
            ) : publishedEntries.length === 0 ? (
              <div
                style={{
                  background: '#FFFFFF',
                  padding: '60px 24px',
                  borderRadius: 'var(--radius-lg)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-card)',
                }}
              >
                <Globe size={40} style={{ margin: '0 auto 14px', color: 'var(--primary)', opacity: 0.6 }} />
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>No Published Journals Yet</h3>
                <p style={{ maxWidth: '440px', margin: '0 auto 18px auto', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Share your reflections, mindfulness practices, or learnings with a community. Once published, your entries will appear chronologically along your timeline with dates and engagement metrics!
                </p>
                <button
                  className="btn-card-publish"
                  onClick={() => navigate('/editor')}
                  style={{
                    padding: '10px 22px',
                    fontSize: '0.9rem',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    margin: '0 auto',
                  }}
                >
                  <Plus size={16} /> Write & Publish Entry
                </button>
              </div>
            ) : (
              <div className="timeline-track">
                {publishedEntries.map((item) => (
                  <div key={item.id} className="timeline-item">
                    {/* Node Dot on Timeline */}
                    <div className="timeline-node" />

                    {/* Prominent Published Date & Time Badge */}
                    <div className="timeline-date-badge">
                      <Calendar size={13} />
                      <span>{formatJournalCardDate(item)}</span>
                    </div>

                    {/* Timeline Content Card */}
                    <div className="timeline-card">
                      {item.coverImageUrl && (
                        <div style={{ marginBottom: '14px', borderRadius: '10px', overflow: 'hidden', height: '180px', width: '100%' }}>
                          <img
                            src={item.coverImageUrl}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      )}

                      <div className="timeline-card-header">
                        <div className="timeline-header-meta">
                          <span
                            className="timeline-community-badge"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/communities');
                            }}
                            title="View Community Feed"
                            style={{ cursor: 'pointer' }}
                          >
                            <Globe size={13} />
                            {item.communityName || 'Community Publication'}
                          </span>

                          <span className="badge-category-tag">{item.category || 'General'}</span>

                          {item.sentimentLabel && (
                            <span className={`badge-sentiment-tag ${item.sentimentLabel.toLowerCase()}`}>
                              {item.sentimentLabel}
                            </span>
                          )}
                        </div>

                        <div className="timeline-actions">
                          <button
                            type="button"
                            className="btn-card-unpublish"
                            onClick={(e) => handleUnpublishFromTimeline(item.id, e)}
                            disabled={unpublishingId === item.id}
                            title="Revert journal to private (removes from community feed)"
                          >
                            {unpublishingId === item.id ? (
                              <>
                                <Loader2 size={13} className="btn-icon-spin" /> Unpublishing...
                              </>
                            ) : (
                              <>
                                <Lock size={13} /> Unpublish
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <h3
                        className="timeline-card-title"
                        onClick={() => navigate(`/editor?id=${item.id}`)}
                      >
                        {item.title}
                      </h3>

                      <p className="timeline-card-content">{item.content}</p>

                      <div className="timeline-card-footer">
                        <div className="timeline-stats">
                          <div className="timeline-stat-item views" title="Total Views">
                            <Eye size={15} />
                            <span>{item.viewCount || 0} {item.viewCount === 1 ? 'view' : 'views'}</span>
                          </div>
                          <div className="timeline-stat-item likes">
                            <Heart size={15} fill="#EF4444" />
                            <span>{item.likeCount || 0} Likes</span>
                          </div>
                          <div className="timeline-stat-item comments">
                            <MessageSquare size={15} />
                            <span>{item.commentCount || 0} Comments</span>
                          </div>
                        </div>

                        <div className="timeline-actions">
                          <button
                            type="button"
                            className="btn-card-share"
                            onClick={() => setShareJournal(item)}
                            title="Share Blog Link"
                          >
                            <Share2 size={13} /> Share Link
                          </button>
                          <button
                            type="button"
                            className="btn-card-action"
                            onClick={() => setPreviewJournal(item)}
                            title="Preview Published Story"
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            type="button"
                            className="btn-card-action"
                            onClick={() => navigate(`/editor?id=${item.id}`)}
                          >
                            <Edit3 size={13} /> Edit Entry
                          </button>
                          <button
                            type="button"
                            className="btn-card-action"
                            onClick={() => navigate('/communities')}
                          >
                            <ExternalLink size={13} /> Feed
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ================= ALL JOURNALS GRID VIEW ================= */
          <>
            {/* Filter Row */}
            <div className="filter-pills-row">
              <button
                className={`sentiment-filter-pill ${activeSentiment === 'ALL' ? 'active' : ''}`}
                onClick={() => { setActiveSentiment('ALL'); setCurrentPage(0); }}
              >
                All Sentiments
              </button>
              <button
                className={`sentiment-filter-pill ${activeSentiment === 'POSITIVE' ? 'active' : ''}`}
                onClick={() => { setActiveSentiment('POSITIVE'); setCurrentPage(0); }}
              >
                <span style={{ color: '#10B981' }}>•</span> Positive
              </button>
              <button
                className={`sentiment-filter-pill ${activeSentiment === 'NEUTRAL' ? 'active' : ''}`}
                onClick={() => { setActiveSentiment('NEUTRAL'); setCurrentPage(0); }}
              >
                <span style={{ color: '#F59E0B' }}>•</span> Neutral
              </button>
              <button
                className={`sentiment-filter-pill ${activeSentiment === 'NEGATIVE' ? 'active' : ''}`}
                onClick={() => { setActiveSentiment('NEGATIVE'); setCurrentPage(0); }}
              >
                <span style={{ color: '#EF4444' }}>•</span> Negative
              </button>

              {/* Visibility filter */}
              <div style={{ minWidth: '175px', marginLeft: 'auto' }}>
                <CustomDropdown
                  value={selectedVisibility}
                  onChange={(val) => { setSelectedVisibility(val); setCurrentPage(0); }}
                  options={[
                    { value: 'ALL', label: 'All Visibilities' },
                    { value: 'PRIVATE', label: 'Private Only', icon: Lock },
                    { value: 'PUBLIC', label: 'Public Posts', icon: Globe },
                    { value: 'COMMUNITY', label: 'Community Feed', icon: Users },
                  ]}
                  placeholder="Visibility"
                />
              </div>

              {/* Category filter */}
              <div style={{ minWidth: '185px' }}>
                <CustomDropdown
                  value={selectedCategory}
                  onChange={(val) => { setSelectedCategory(val); setCurrentPage(0); }}
                  options={[
                    { value: 'ALL', label: 'All Categories' },
                    ...categories.map((c) => ({
                      value: c.name,
                      label: c.name,
                      badge: c.predefined === false ? 'Custom' : undefined,
                    })),
                  ]}
                  placeholder="Category Filter"
                />
              </div>
            </div>

            {/* Journals List */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Loading your journals...
              </div>
            ) : entries.length === 0 ? (
          <div
            style={{
              background: '#FFFFFF',
              padding: '60px 24px',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-card)',
            }}
          >
            <Lock size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h3>No journals found</h3>
            <p style={{ marginTop: '4px' }}>Try adjusting your search or filters, or write a new entry.</p>
          </div>
        ) : (
          <div className="horizontal-journals-list">
            {entries.map((item) => {
              const isCommunity = item.visibility === 'COMMUNITY';
              const isPublic = item.visibility === 'PUBLIC';
              const formattedDate = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent';

              return (
                <div
                  key={item.id}
                  className="horizontal-journal-card"
                  onClick={() => navigate(`/editor?id=${item.id}`)}
                >
                  {item.coverImageUrl && (
                    <img
                      src={item.coverImageUrl}
                      alt={item.title}
                      className="card-thumbnail-img"
                    />
                  )}

                  <div className="card-content-center">
                    <h3 className="card-entry-title">{item.title}</h3>
                    <p className="card-entry-excerpt">{item.content}</p>

                    <div className="card-badges-row">
                      {item.sentimentLabel && (
                        <span className={`badge-sentiment-tag ${item.sentimentLabel.toLowerCase()}`}>
                          {item.sentimentLabel}
                        </span>
                      )}

                      <span className="badge-category-tag">{item.category || 'General'}</span>

                      {/* Visibility Badge */}
                      {isCommunity ? (
                        <span className="badge-visibility-tag community">
                          <Users size={12} /> {item.communityName || 'Community'}
                        </span>
                      ) : isPublic ? (
                        <span className="badge-visibility-tag public">
                          <Globe size={12} /> Public
                        </span>
                      ) : (
                        <span className="badge-visibility-tag private">
                          <Lock size={12} /> Private
                        </span>
                      )}

                      {(isCommunity || isPublic) && (
                        <span className="badge-views-tag" title="Total Views">
                          <Eye size={12} /> {item.viewCount || 0} {item.viewCount === 1 ? 'view' : 'views'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="card-actions-right">
                    <span className="card-date-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={12} style={{ opacity: 0.7 }} />
                      <span>{formatJournalCardDate(item)}</span>
                    </span>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {/* Publish / Unpublish button */}
                      {isCommunity || isPublic ? (
                        <>
                          <button
                            type="button"
                            className="btn-card-share"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareJournal(item);
                            }}
                            title="Share Blog Link"
                          >
                            <Share2 size={13} /> Share Link
                          </button>
                          <button
                            type="button"
                            className="btn-card-unpublish"
                            onClick={(e) => handleUnpublish(item.id, e)}
                            disabled={unpublishingId === item.id}
                            title="Unpublish back to private"
                          >
                            {unpublishingId === item.id ? (
                              <>
                                <Loader2 size={13} className="btn-icon-spin" /> Unpublishing...
                              </>
                            ) : (
                              <>
                                <Lock size={13} /> Unpublish
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn-card-publish"
                          onClick={(e) => handleOpenPublishModal(item, e)}
                          title="Publish journal"
                        >
                          <Share2 size={13} /> Publish
                        </button>
                      )}

                      <div className="card-action-icons">
                        {(isCommunity || isPublic) && (
                          <button
                            type="button"
                            className="icon-btn view"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewJournal(item);
                            }}
                            title="Preview Published Story"
                          >
                            <Eye size={16} />
                          </button>
                        )}

                        <button
                          type="button"
                          className={`icon-btn star ${item.favorite ? 'active' : ''}`}
                          onClick={(e) => toggleFavorite(item.id, e)}
                          title="Favorite"
                        >
                          <Star size={16} fill={item.favorite ? '#F59E0B' : 'none'} />
                        </button>

                        <button
                          type="button"
                          className="icon-btn edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/editor?id=${item.id}`);
                          }}
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          className="icon-btn delete"
                          onClick={(e) => deleteEntry(item.id, e)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Numbered Pagination Bar */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button
              className="page-nav-btn"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => (
              <button
                key={pageNum}
                className={`page-nav-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum + 1}
              </button>
            ))}

            <button
              className="page-nav-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
          </>
        )}
      </div>

      {/* Quick Publish Modal */}
      {publishingEntry && (
        <div className="modal-overlay" onClick={() => setPublishingEntry(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title-row">
              <h2>Publish Journal Entry</h2>
              <button
                onClick={() => setPublishingEntry(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Publishing "<strong>{publishingEntry.title}</strong>" allows other NoteSphere readers to view your reflection.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Publication Destination:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPublishMode('PUBLIC')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: publishMode === 'PUBLIC' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: publishMode === 'PUBLIC' ? 'var(--primary-light)' : '#FFFFFF',
                    color: publishMode === 'PUBLIC' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Globe size={15} /> Public Feed
                </button>
                <button
                  type="button"
                  onClick={() => setPublishMode('COMMUNITY')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: publishMode === 'COMMUNITY' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: publishMode === 'COMMUNITY' ? 'var(--primary-light)' : '#FFFFFF',
                    color: publishMode === 'COMMUNITY' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Users size={15} /> Community Space
                </button>
              </div>
            </div>

            {publishMode === 'COMMUNITY' && (
              <div className="modal-field">
                <label>Choose Community Feed *</label>
                {joinedCommunities.length === 0 ? (
                  <div>
                    <p style={{ color: '#EF4444', fontSize: '0.86rem', marginBottom: '8px' }}>
                      You have not joined any communities yet. Join one to publish to its feed!
                    </p>
                    <button
                      type="button"
                      className="btn-create-community"
                      onClick={() => {
                        setPublishingEntry(null);
                        navigate('/communities');
                      }}
                    >
                      Explore Communities
                    </button>
                  </div>
                ) : (
                  <CustomDropdown
                    value={selectedCommunityId}
                    onChange={(val) => setSelectedCommunityId(val)}
                    options={joinedCommunities.map((c) => ({
                      value: c.id,
                      label: c.name,
                      badge: `${c.memberCount || 1} members`,
                      icon: Users,
                    }))}
                    placeholder="Select community..."
                    icon={Users}
                    searchable={true}
                    searchPlaceholder="Search community..."
                  />
                )}
              </div>
            )}

            <div className="modal-buttons-row">
              <button
                type="button"
                className="btn-community-action btn-community-view"
                onClick={() => setPublishingEntry(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-community-action btn-community-join"
                onClick={handleConfirmPublish}
                disabled={publishMode === 'COMMUNITY' && (!selectedCommunityId || joinedCommunities.length === 0)}
              >
                {publishMode === 'PUBLIC' ? 'Publish Publicly' : 'Publish to Community'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Detail / View Modal */}
      {previewJournal && (
        <ContentDetailModal
          journal={previewJournal}
          onClose={() => setPreviewJournal(null)}
          onViewCountUpdate={(journalId, newCount) => {
            const updater = (prev) =>
              prev.map((p) => (p.id === journalId ? { ...p, viewCount: newCount } : p));
            setPublishedEntries(updater);
            setEntries(updater);
            setPreviewJournal((prev) => (prev && prev.id === journalId ? { ...prev, viewCount: newCount } : prev));
          }}
        />
      )}

      {/* Share Blog Dialog Modal */}
      <ShareModal
        isOpen={!!shareJournal}
        onClose={() => setShareJournal(null)}
        journal={shareJournal}
      />
    </div>
  );
}

export default JournalsPage;
