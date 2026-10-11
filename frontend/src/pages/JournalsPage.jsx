import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import './JournalsPage.css';

export function JournalsPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [activeSentiment, setActiveSentiment] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Exact data from Screen 1 in Image B
  const [entries, setEntries] = useState([
    {
      id: 'j-1',
      title: 'A Productive Day at Work',
      excerpt: 'Today I completed the backend implementation for the new feature. Had a great discussion with my team and learned a lot...',
      sentiment: 'Positive',
      category: 'Work',
      date: 'Apr 12, 2026',
      isFavorite: true,
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'j-2',
      title: 'Weekend Memories',
      excerpt: 'Had an amazing weekend trip to the mountains. The weather was perfect and it felt so refreshing.',
      sentiment: 'Neutral',
      category: 'Travel',
      date: 'Apr 11, 2026',
      isFavorite: false,
      thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 'j-3',
      title: 'Learning something new',
      excerpt: 'Started exploring system design today. It was challenging but really interesting. I feel motivated to keep learning.',
      sentiment: 'Positive',
      category: 'Study',
      date: 'Apr 9, 2026',
      isFavorite: false,
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80'
    }
  ]);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setEntries(entries.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const deleteEntry = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      setEntries(entries.filter(item => item.id !== id));
    }
  };

  const filtered = entries.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          item.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesSentiment = activeSentiment === 'ALL' || item.sentiment.toUpperCase() === activeSentiment;
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesSentiment && matchesCategory;
  });

  return (
    <div className="journals-page">
      {/* 1. Header Row */}
      <div className="journals-header-row">
        <div className="journals-title-wrap">
          <h1>My Journals</h1>
          <p>All your journal entries in one place</p>
        </div>

        <div className="journals-search-box">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search journals, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 16px 9px 38px',
                borderRadius: '999px',
                border: '1px solid var(--border-subtle)',
                background: '#FFFFFF',
                fontSize: '0.85rem'
              }}
            />
          </div>
        </div>
      </div>

      <div className="center-page-body">
        {/* 2. Filter Pills Row */}
        <div className="filter-pills-row">
          <button
            className={`sentiment-filter-pill ${activeSentiment === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveSentiment('ALL')}
          >
            All
          </button>
          <button
            className={`sentiment-filter-pill ${activeSentiment === 'POSITIVE' ? 'active' : ''}`}
            onClick={() => setActiveSentiment('POSITIVE')}
          >
            <span style={{ color: '#10B981' }}>•</span> Positive
          </button>
          <button
            className={`sentiment-filter-pill ${activeSentiment === 'NEUTRAL' ? 'active' : ''}`}
            onClick={() => setActiveSentiment('NEUTRAL')}
          >
            <span style={{ color: '#F59E0B' }}>•</span> Neutral
          </button>
          <button
            className={`sentiment-filter-pill ${activeSentiment === 'NEGATIVE' ? 'active' : ''}`}
            onClick={() => setActiveSentiment('NEGATIVE')}
          >
            <span style={{ color: '#EF4444' }}>•</span> Negative
          </button>

          <select
            className="filter-dropdown-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ marginLeft: 'auto' }}
          >
            <option value="ALL">All Categories</option>
            <option value="Work">Work</option>
            <option value="Travel">Travel</option>
            <option value="Study">Study</option>
            <option value="Personal">Personal</option>
          </select>

          <select className="filter-dropdown-select">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        {/* 3. Horizontal Journal Cards List */}
        <div className="horizontal-journals-list">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="horizontal-journal-card"
              onClick={() => navigate(`/editor?id=${item.id}`)}
            >
              <img src={item.thumbnail} alt={item.title} className="card-thumbnail-img" />

              <div className="card-content-center">
                <h3 className="card-entry-title">{item.title}</h3>
                <p className="card-entry-excerpt">{item.excerpt}</p>
                <div className="card-badges-row">
                  <span className={`badge-sentiment-tag ${item.sentiment.toLowerCase()}`}>
                    {item.sentiment}
                  </span>
                  <span className="badge-category-tag">
                    {item.category}
                  </span>
                </div>
              </div>

              <div className="card-actions-right">
                <span className="card-date-label">{item.date}</span>
                <div className="card-action-icons">
                  <button
                    className={`icon-btn star ${item.isFavorite ? 'active' : ''}`}
                    onClick={(e) => toggleFavorite(item.id, e)}
                    title="Favorite"
                  >
                    <Star size={16} fill={item.isFavorite ? '#F59E0B' : 'none'} />
                  </button>
                  <button
                    className="icon-btn edit"
                    onClick={(e) => { e.stopPropagation(); navigate(`/editor?id=${item.id}`); }}
                    title="Edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="icon-btn delete"
                    onClick={(e) => deleteEntry(item.id, e)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Numbered Pagination Bar */}
        <div className="pagination-container">
          <button className="page-nav-btn"><ChevronLeft size={16} /></button>
          {[1, 2, 3, 4, 5].map((pageNum) => (
            <button
              key={pageNum}
              className={`page-nav-btn ${currentPage === pageNum ? 'active' : ''}`}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </button>
          ))}
          <button className="page-nav-btn"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

export default JournalsPage;
