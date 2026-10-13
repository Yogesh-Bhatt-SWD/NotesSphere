import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { mockRecentJournals } from '../../mock/mockData';
import journalService from '../../api/journalService';
import './RecentEntriesWidget.css';

export function RecentEntriesWidget({ entries: propEntries }) {
  const navigate = useNavigate();
  const [items, setItems] = useState(propEntries || mockRecentJournals);
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    if (propEntries && propEntries.length > 0) {
      setItems(propEntries);
      return;
    }

    journalService.getJournals({ size: 3, sortBy: 'createdAt', sortDir: 'desc' })
      .then((res) => {
        if (res?.data?.content && res.data.content.length > 0) {
          const mapped = res.data.content.map((j, idx) => ({
            id: j.id,
            title: j.title,
            category: j.category || 'General',
            timeAgo: j.createdAt ? formatTimeAgo(j.createdAt) : 'Recently',
            thumbnail:
              j.coverImageUrl ||
              [
                'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80',
                'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=200&q=80',
                'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=200&q=80',
              ][idx % 3],
          }));
          setItems(mapped);
        } else {
          setItems(mockRecentJournals);
        }
      })
      .catch(() => {
        setItems(mockRecentJournals);
      });
  }, [propEntries]);

  const handleImgError = (id) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

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

  return (
    <div className="recent-journals-widget">
      <div className="widget-header-row">
        <div className="widget-title-group">
          <h3>Recent Journals</h3>
          <p>{items.length} Journals in row</p>
        </div>
        <button
          className="view-all-pill-btn"
          onClick={() => navigate('/journals')}
        >
          View All <span className="view-all-counter">{items.length}</span>
        </button>
      </div>

      <div className="recent-entries-list">
        {items.map((item) => (
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
        ))}
      </div>
    </div>
  );
}

export default RecentEntriesWidget;
