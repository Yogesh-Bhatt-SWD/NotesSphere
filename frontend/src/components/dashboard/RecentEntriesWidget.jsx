import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import journalService from '../../api/journalService';
import './RecentEntriesWidget.css';

const RECENT_CACHE_KEY = 'notesphere_recent_journals_cache';

const getCachedRecent = () => {
  try {
    const raw = sessionStorage.getItem(RECENT_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return null;
};

const setCachedRecent = (data) => {
  try {
    sessionStorage.setItem(RECENT_CACHE_KEY, JSON.stringify(data));
  } catch {}
};

export function RecentEntriesWidget({ entries: propEntries }) {
  const navigate = useNavigate();
  const initialCache = propEntries || getCachedRecent();
  const [items, setItems] = useState(() => initialCache || []);
  const [loading, setLoading] = useState(() => !propEntries && initialCache === null);
  const [imgErrors, setImgErrors] = useState({});

  const formatTimeAgo = (dateStr) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours} hours ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Yesterday';
      return `${days} days ago`;
    } catch {
      return 'Recently';
    }
  };

  const fetchRecent = useCallback(async (silent = false) => {
    if (propEntries && propEntries.length > 0) {
      setItems(propEntries);
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    try {
      const res = await journalService.getJournals({ size: 3, sortBy: 'createdAt', sortDir: 'desc' });
      const content = res?.data?.content || [];
      const mapped = content.map((j) => ({
        id: j.id,
        title: j.title,
        category: j.category || 'General',
        timeAgo: j.createdAt ? formatTimeAgo(j.createdAt) : 'Recently',
        thumbnail: j.coverImageUrl || j.coverImage || null,
      }));
      setItems(mapped);
      setCachedRecent(mapped);
    } catch (err) {
      console.warn('Failed to load recent journals:', err);
      if (!initialCache) {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [propEntries, initialCache]);

  useEffect(() => {
    const hasCache = !!propEntries || getCachedRecent() !== null;
    fetchRecent(hasCache);

    const handleMutation = () => fetchRecent(true);
    window.addEventListener('notesphere:journal-mutated', handleMutation);
    return () => {
      window.removeEventListener('notesphere:journal-mutated', handleMutation);
    };
  }, [fetchRecent, propEntries]);

  const handleImgError = (id) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="recent-journals-widget">
      <div className="widget-header-row">
        <div className="widget-title-group">
          <h3>Recent Journals</h3>
          <p>{items.length} {items.length === 1 ? 'journal' : 'journals'} written</p>
        </div>
        {items.length > 0 && (
          <button
            className="view-all-pill-btn"
            onClick={() => navigate('/journals')}
          >
            View All <span className="view-all-counter">{items.length}</span>
          </button>
        )}
      </div>

      <div className="recent-entries-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Loader2 size={18} className="animate-spin" style={{ margin: '0 auto 6px', color: 'var(--primary)' }} />
            <span>Loading recent entries...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="recent-entries-empty" style={{
            textAlign: 'center',
            padding: '24px 16px',
            color: 'var(--text-muted)',
            fontSize: '0.84rem'
          }}>
            <BookOpen size={24} style={{ margin: '0 auto 6px', opacity: 0.35, display: 'block', color: 'var(--primary)' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No recent journals yet</div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Your latest reflections and notes will appear here.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="recent-entry-item"
              onClick={() => navigate(`/editor?id=${item.id}`)}
            >
              {imgErrors[item.id] || !item.thumbnail ? (
                <div className="entry-thumb-placeholder">
                  <BookOpen size={20} color="var(--primary)" />
                </div>
              ) : (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="entry-thumb"
                  onError={() => handleImgError(item.id)}
                />
              )}
              <div className="entry-info">
                <div className="entry-title">{item.title}</div>
                <div className="entry-meta-row">
                  <span>{item.category}</span>
                  <span>•</span>
                  <span>{item.timeAgo}</span>
                </div>
              </div>
              <div className="entry-action-btn">
                <ArrowRight size={16} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecentEntriesWidget;
