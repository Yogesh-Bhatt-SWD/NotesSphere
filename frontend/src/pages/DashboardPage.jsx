import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import JournalCard from '../components/dashboard/JournalCard';
import RecentEntriesWidget from '../components/dashboard/RecentEntriesWidget';
import InsightRingWidget from '../components/dashboard/InsightRingWidget';
import QuickCreateModal from '../components/dashboard/QuickCreateModal';
import { mockFeaturedJournals, mockRecentJournals } from '../mock/mockData';
import './DashboardPage.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const { toggleMobileMenu } = useOutletContext() || {};

  const [featuredJournals, setFeaturedJournals] = useState(mockFeaturedJournals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateNew = (newEntry) => {
    setFeaturedJournals([newEntry, ...featuredJournals.slice(0, 2)]);
  };

  const filteredJournals = featuredJournals.filter(j =>
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-page">
      {/* 1. Header with greeting and search bar */}
      <Header
        subtitle="How it's going on ?"
        badgeText="PRO"
        onSearchChange={setSearchQuery}
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div className="center-page-body">
        {/* 2. My Journals Section */}
        <section className="dashboard-section">
          <div className="section-header-row">
            <h2 className="section-title">My Journals</h2>
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setIsModalOpen(true)}
            >
              Add New
            </Button>
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
