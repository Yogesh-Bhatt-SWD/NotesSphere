import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, Globe, BookOpen, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import JournalCard from '../components/dashboard/JournalCard';
import RecentEntriesWidget from '../components/dashboard/RecentEntriesWidget';
import InsightRingWidget from '../components/dashboard/InsightRingWidget';
import QuickCreateModal from '../components/dashboard/QuickCreateModal';
import journalService from '../api/journalService';
import './DashboardPage.css';

const DASHBOARD_CACHE_KEY = 'notesphere_dashboard_journals_cache';

const getCachedJournals = () => {
  try {
    const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return null;
};

const setCachedJournals = (data) => {
  try {
    sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data));
  } catch {}
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { toggleMobileMenu } = useOutletContext() || {};

  const initialCache = getCachedJournals();
  const [featuredJournals, setFeaturedJournals] = useState(() => initialCache || []);
  const [isLoading, setIsLoading] = useState(() => initialCache === null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchJournals = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const res = await journalService.getJournals({ size: 6, sortBy: 'createdAt', sortDir: 'desc' });
      const content = res?.data?.content || [];
      setFeaturedJournals(content);
      setCachedJournals(content);
    } catch (err) {
      console.warn('Failed to load journals on dashboard:', err);
      if (!initialCache) {
        setFeaturedJournals([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [initialCache]);

  useEffect(() => {
    // If cache is present, load silently in background without flashing a loader or mock card
    const hasCache = getCachedJournals() !== null;
    fetchJournals(hasCache);

    const handleMutation = () => fetchJournals(true);
    window.addEventListener('notesphere:journal-mutated', handleMutation);
    return () => {
      window.removeEventListener('notesphere:journal-mutated', handleMutation);
    };
  }, [fetchJournals]);

  const handleCreateNew = (newEntry) => {
    setFeaturedJournals((prev) => {
      const updated = [newEntry, ...prev.filter(j => j.id !== newEntry.id).slice(0, 5)];
      setCachedJournals(updated);
      return updated;
    });
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
            {isLoading ? (
              <div style={{
                gridColumn: '1 / -1',
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-card)'
              }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.88rem' }}>Loading your journals...</span>
              </div>
            ) : filteredJournals.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                border: '1px dashed var(--border-card)',
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--primary-light, #e7f8f5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary, #00B69B)'
                }}>
                  <BookOpen size={28} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {searchQuery ? 'No matching journals found' : 'No journals written yet'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.5 }}>
                  {searchQuery
                    ? 'Try searching with a different term or clear your search query.'
                    : 'Capture your thoughts, daily reflections, and mindfulness moments. Start by creating your first journal entry!'}
                </p>
                {!searchQuery && (
                  <Button
                    variant="primary"
                    size="md"
                    icon={Plus}
                    onClick={() => setIsModalOpen(true)}
                    style={{ marginTop: '6px' }}
                  >
                    Write First Journal
                  </Button>
                )}
              </div>
            ) : (
              filteredJournals.map((journal) => (
                <JournalCard
                  key={journal.id}
                  journal={journal}
                  onClick={() => navigate(`/editor?id=${journal.id}`)}
                />
              ))
            )}
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
