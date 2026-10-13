import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, Globe } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import JournalCard from '../components/dashboard/JournalCard';
import RecentEntriesWidget from '../components/dashboard/RecentEntriesWidget';
import InsightRingWidget from '../components/dashboard/InsightRingWidget';
import QuickCreateModal from '../components/dashboard/QuickCreateModal';
import { mockFeaturedJournals } from '../mock/mockData';
import journalService from '../api/journalService';
import './DashboardPage.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const { toggleMobileMenu } = useOutletContext() || {};

  const [featuredJournals, setFeaturedJournals] = useState(mockFeaturedJournals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    journalService.getJournals({ size: 6, sortBy: 'createdAt', sortDir: 'desc' })
      .then((res) => {
        if (res?.data?.content && res.data.content.length > 0) {
          setFeaturedJournals(res.data.content);
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateNew = (newEntry) => {
    setFeaturedJournals([newEntry, ...featuredJournals.slice(0, 5)]);
    window.dispatchEvent(new CustomEvent('notesphere:journal-mutated'));
  };

  const filteredJournals = featuredJournals.filter(j =>
    (j.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (j.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-page">
      {/* 1. Header with greeting and search bar */}
      <Header
        subtitle="How it's going on ?"
        onSearchChange={setSearchQuery}
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div className="center-page-body">
        {/* 2. My Journals Section */}
        <section className="dashboard-section">
          <div className="section-header-row">
            <h2 className="section-title">My Journals</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Button
                variant="secondary"
                size="md"
                icon={Globe}
                onClick={() => navigate('/journals?tab=published')}
                title="View Published Journals Timeline"
              >
                Published Timeline
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => setIsModalOpen(true)}
              >
                Add New
              </Button>
            </div>
          </div>

          <div className="featured-journals-grid">
            {filteredJournals.map((journal) => (
              <JournalCard
                key={journal.id}
                journal={journal}
                onClick={() => navigate(`/editor?id=${journal.id}`)}
              />
            ))}
          </div>
        </section>

        {/* 3. Bottom Grid: Recent Journals + Journal Insights */}
        <section className="dashboard-section" style={{ marginTop: '12px' }}>
          <div className="dashboard-bottom-grid">
            <RecentEntriesWidget />
            <InsightRingWidget />
          </div>
        </section>
      </div>

      {/* 4. Quick Create Modal Dialog */}
      <QuickCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreateNew}
      />
    </div>
  );
}

export default DashboardPage;
