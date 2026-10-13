import React, { useState, useEffect, useCallback } from 'react';
import journalService from '../../api/journalService';
import JournalInsightsModal from './JournalInsightsModal';
import './InsightRingWidget.css';

export function InsightRingWidget({ stats: propStats }) {
  const [insights, setInsights] = useState(propStats || null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(!propStats);

  const fetchInsights = useCallback(async () => {
    try {
      const res = await journalService.getInsights();
      if (res?.data) {
        setInsights(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch journal insights:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (propStats) {
      setInsights(propStats);
      return;
    }
    fetchInsights();

    // Listen for real-time mutations from editor or dashboard
    const handleMutation = () => fetchInsights();
    window.addEventListener('notesphere:journal-mutated', handleMutation);
    return () => {
      window.removeEventListener('notesphere:journal-mutated', handleMutation);
    };
  }, [propStats, fetchInsights]);

  const formatCompact = (num) => {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  };

  const percentage = Math.min(100, Math.max(0, insights?.weeklyGoalCompletionPercent ?? 0));

  // Circumference of 2 * pi * 45 = ~282.74
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const totalJournalsFormatted = formatCompact(insights?.totalJournals ?? 0);
  const currentStreak = insights?.currentStreakDays ?? 0;
  const streakFormatted = `${currentStreak} ${currentStreak === 1 ? 'Day' : 'Days'}`;
  const totalWordsFormatted = formatCompact(insights?.totalWordsWritten ?? 0);

  return (
    <>
      <div className="insight-ring-widget">
        <h3 className="insight-widget-title">Journal Insights</h3>

        <div className="insight-content-row">
          {/* Circular Progress Gauge (Weekly Goal Completion) */}
          <div
            className="progress-ring-container"
            title={`${percentage}% of weekly writing goal (${insights?.wordsWrittenThisWeek ?? 0} / ${insights?.weeklyWordGoal ?? 3500} words)`}
          >
            <svg className="progress-ring-svg" width="110" height="110">
              <circle
                className="progress-ring-bg"
                cx="55"
                cy="55"
                r={radius}
              />
              <circle
                className="progress-ring-circle"
                cx="55"
                cy="55"
                r={radius}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset
                }}
              />
            </svg>
            <div className="progress-ring-text">{percentage}%</div>
          </div>

          {/* Real Stats List */}
          <div className="insight-stats-list">
            <div className="stat-row">
              <span className="stat-label">Total Journals</span>
              <span className="stat-val">{totalJournalsFormatted}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Active Streak</span>
              <span className="stat-val">{streakFormatted}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Words Written</span>
              <span className="stat-val">{totalWordsFormatted}</span>
            </div>
          </div>
        </div>

        <span
          className="view-details-link"
          role="button"
          tabIndex={0}
          onClick={() => setShowModal(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowModal(true);
            }
          }}
        >
          View Details
        </span>
      </div>

      {/* Dedicated Insights Details Modal */}
      <JournalInsightsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        insights={insights}
      />
    </>
  );
}

export default InsightRingWidget;
