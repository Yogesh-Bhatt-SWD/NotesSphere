import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, Search, Star, Pin, Calendar, Tag } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { mockFeaturedJournals, mockRecentJournals } from '../mock/mockData';
import './JournalsPage.css';

export function JournalsPage() {
  const navigate = useNavigate();
  const { toggleMobileMenu } = useOutletContext() || {};

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSentiment, setSelectedSentiment] = useState('ALL');

  // Combined sample entries
  const allJournals = [
    ...mockFeaturedJournals,
    {
      id: 'j-4',
      title: 'Accident on Yeou Gogae',
      snippet: 'Walking past the tranquil ridge during dusk, observing the city light up below...',
      createdAt: '10/10/26',
      category: 'Storytelling',
      sentiment: 'NEUTRAL',
      tags: ['evening', 'walk'],
      isFavorite: false,
      isPinned: false
    },
    {
      id: 'j-5',
      title: 'Badminton Olympics',
      snippet: 'High energy doubles match today! Teamwork and rapid reflexes kept our focus sharp...',
      createdAt: '09/10/26',
      category: 'Health',
      sentiment: 'POSITIVE',
      tags: ['fitness', 'sport'],
      isFavorite: true,
      isPinned: false
    }
  ];

  const filtered = allJournals.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          item.snippet.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSentiment = selectedSentiment === 'ALL' || item.sentiment === selectedSentiment;
    return matchesSearch && matchesCategory && matchesSentiment;
  });

  return (
    <div className="journals-page">
      <Header
        title="Journal Archive"
        subtitle="Browse, filter and search through all your personal reflections"
        onSearchChange={setSearch}
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div className="center-page-body">
        {/* Filters and action bar */}
        <div className="journals-filter-bar">
          <div className="filters-group">
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="Mindfulness">Mindfulness</option>
              <option value="Goals">Goals</option>
              <option value="Reflections">Reflections</option>
              <option value="Storytelling">Storytelling</option>
              <option value="Health">Health</option>
            </select>

            <select
              className="filter-select"
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
            >
              <option value="ALL">All Sentiments</option>
              <option value="POSITIVE">Positive Mood</option>
              <option value="NEUTRAL">Neutral Mood</option>
              <option value="NEGATIVE">Negative Mood</option>
            </select>
          </div>

          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/editor')}
          >
            New Journal
          </Button>
        </div>

        {/* Entries Grid or Empty State */}
        {filtered.length === 0 ? (
          <EmptyState
            title="No matching journal entries"
            description="Try clearing your search query or filters to see more results."
            actionText="Write New Journal"
            onAction={() => navigate('/editor')}
          />
        ) : (
          <div className="journals-grid">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="journal-archive-card"
                onClick={() => navigate(`/editor?id=${item.id}`)}
              >
                <div>
                  <div className="archive-card-header">
                    <h3 className="archive-card-title">{item.title}</h3>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {item.isFavorite && <Star size={16} fill="#F59E0B" color="#F59E0B" />}
                      {item.isPinned && <Pin size={16} fill="var(--primary)" color="var(--primary)" />}
                    </div>
                  </div>
                  <p className="archive-card-snippet">{item.snippet}</p>
                </div>

                <div className="archive-card-footer">
                  <Badge
                    variant={
                      item.sentiment === 'POSITIVE'
                        ? 'success'
                        : item.sentiment === 'NEGATIVE'
                        ? 'danger'
                        : 'neutral'
                    }
                    dot
                  >
                    {item.sentiment}
                  </Badge>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    <span>{item.createdAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default JournalsPage;
