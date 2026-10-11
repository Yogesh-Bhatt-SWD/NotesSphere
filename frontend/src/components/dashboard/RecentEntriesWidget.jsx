import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { mockRecentJournals } from '../../mock/mockData';
import './RecentEntriesWidget.css';

export function RecentEntriesWidget({ entries = mockRecentJournals }) {
  const navigate = useNavigate();

  return (
    <div className="recent-journals-widget">
      <div className="widget-header-row">
        <div className="widget-title-group">
          <h3>Recent Journals</h3>
          <p>13 Journals in row</p>
        </div>
        <button
          className="view-all-pill-btn"
          onClick={() => navigate('/journals')}
        >
          View All <span className="view-all-counter">3</span>
        </button>
      </div>

      <div className="recent-entries-list">
        {entries.map((item) => (
          <div
            key={item.id}
            className="recent-entry-item"
            onClick={() => navigate('/journals')}
          >
            <img
              src={item.thumbnail}
              alt={item.title}
              className="entry-thumb"
            />
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
