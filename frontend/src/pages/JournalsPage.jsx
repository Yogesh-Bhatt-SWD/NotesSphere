import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Users
} from 'lucide-react';
import journalService from '../api/journalService';
import categoryService from '../api/categoryService';
import communityService from '../api/communityService';
import { CustomDropdown } from '../components/common/CustomDropdown';
import './JournalsPage.css';

export function JournalsPage() {
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [activeSentiment, setActiveSentiment] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedVisibility, setSelectedVisibility] = useState('ALL'); // 'ALL' | 'PRIVATE' | 'COMMUNITY'
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for Spring Data
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Quick publish modal
  const [publishingEntry, setPublishingEntry] = useState(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');

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

  useEffect(() => {
    loadCategories();
    loadJoinedCommunities();
  }, []);

  useEffect(() => {
    loadJournals();
  }, [search, activeSentiment, selectedCategory, selectedVisibility, currentPage]);

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
    if (!publishingEntry || !selectedCommunityId) return;

    try {
      await journalService.publishJournal(publishingEntry.id, selectedCommunityId);
      showToast('Journal published to community feed successfully!');
      setPublishingEntry(null);
      loadJournals();
    } catch (err) {
      showToast(err.message || 'Failed to publish journal', 'error');
    }
  };

  const handleUnpublish = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Revert this publication to private? It will be removed from the community feed.')) return;

    try {
      await journalService.unpublishJournal(id);
      showToast('Journal reverted to private');
      loadJournals();
    } catch (err) {
      showToast(err.message || 'Failed to unpublish journal', 'error');
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
                { value: 'COMMUNITY', label: 'Published Feed', icon: Globe },
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
                          <Globe size={12} /> {item.communityName || 'Community'}
                        </span>
                      ) : (
                        <span className="badge-visibility-tag private">
                          <Lock size={12} /> Private
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="card-actions-right">
                    <span className="card-date-label">{formattedDate}</span>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {/* Publish / Unpublish button */}
                      {isCommunity ? (
                        <button
                          type="button"
                          className="btn-card-unpublish"
                          onClick={(e) => handleUnpublish(item.id, e)}
                          title="Unpublish back to private"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-card-publish"
                          onClick={(e) => handleOpenPublishModal(item, e)}
                          title="Publish to a community"
                        >
                          <Share2 size={13} /> Publish
                        </button>
                      )}

                      <div className="card-action-icons">
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
      </div>

      {/* Quick Publish to Community Modal */}
      {publishingEntry && (
        <div className="modal-overlay" onClick={() => setPublishingEntry(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title-row">
              <h2>Publish to Community</h2>
              <button
                onClick={() => setPublishingEntry(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Publishing "<strong>{publishingEntry.title}</strong>" will make it visible in the selected community feed.
            </p>

            <div className="modal-field">
              <label>Choose Community</label>
              {joinedCommunities.length === 0 ? (
                <div>
                  <p style={{ color: '#EF4444', fontSize: '0.86rem', marginBottom: '8px' }}>
                    You have not joined any communities yet.
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
                disabled={!selectedCommunityId || joinedCommunities.length === 0}
              >
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JournalsPage;
