import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  BookOpen,
  Flame,
  Target,
  FileText,
  Calendar,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react';
import './JournalInsightsModal.css';

export function JournalInsightsModal({ isOpen, onClose, insights }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const data = insights || {
    totalJournals: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    totalWordsWritten: 0,
    wordsWrittenThisWeek: 0,
    dailyWordGoal: 500,
    weeklyWordGoal: 3500,
    weeklyGoalCompletionPercent: 0,
    activeToday: false,
    lastWritingActivityDate: null,
    dailyActivities: [],
    recentActivities: []
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const maxDailyWords = Math.max(
    1,
    ...(data.dailyActivities || []).map(a => a.wordCount || 0)
  );

  return (
    <div className="insights-modal-overlay" onClick={onClose}>
      <div className="insights-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="insights-modal-header">
          <div className="insights-modal-title-group">
            <div className="insights-badge-icon">
              <Sparkles size={20} color="#00B69B" />
            </div>
            <div>
              <h2 className="insights-modal-title">Journal Insights & Progress</h2>
              <p className="insights-modal-subtitle">
                Real-time personal writing analytics and weekly streak tracking
              </p>
            </div>
          </div>
          <button className="insights-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="insights-modal-body">
          {/* 1. Four Key Metrics Grid */}
          <div className="insights-metrics-grid">
            {/* Total Journals */}
            <div className="insights-metric-tile">
              <div className="insights-tile-icon-box" style={{ background: '#E6F8F5', color: '#00B69B' }}>
                <BookOpen size={20} />
              </div>
              <div className="insights-tile-data">
                <span className="insights-tile-label">Total Journals</span>
                <span className="insights-tile-number">{formatNumber(data.totalJournals)}</span>
                <span className="insights-tile-subtext">Lifetime written</span>
              </div>
            </div>

            {/* Active Streak */}
            <div className="insights-metric-tile">
              <div className="insights-tile-icon-box" style={{ background: '#FFF1EC', color: '#FF7B54' }}>
                <Flame size={20} />
              </div>
              <div className="insights-tile-data">
                <span className="insights-tile-label">Active Streak</span>
                <span className="insights-tile-number">
                  {data.currentStreakDays} {data.currentStreakDays === 1 ? 'Day' : 'Days'}
                </span>
                <span className="insights-tile-subtext">
                  Best: {data.longestStreakDays || data.currentStreakDays} days
                </span>
              </div>
            </div>

            {/* Total Words Written */}
            <div className="insights-metric-tile">
              <div className="insights-tile-icon-box" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <FileText size={20} />
              </div>
              <div className="insights-tile-data">
                <span className="insights-tile-label">Total Words</span>
                <span className="insights-tile-number">{formatNumber(data.totalWordsWritten)}</span>
                <span className="insights-tile-subtext">Across all entries</span>
              </div>
            </div>

            {/* Words Written This Week */}
            <div className="insights-metric-tile">
              <div className="insights-tile-icon-box" style={{ background: '#F3E8FF', color: '#9333EA' }}>
                <Target size={20} />
              </div>
              <div className="insights-tile-data">
                <span className="insights-tile-label">This Week</span>
                <span className="insights-tile-number">{formatNumber(data.wordsWrittenThisWeek)}</span>
                <span className="insights-tile-subtext">Words written</span>
              </div>
            </div>
          </div>

          {/* 2. Weekly Writing Goal Banner */}
          <div className="insights-goal-section">
            <div className="insights-goal-header">
              <div className="insights-goal-title-wrap">
                <TrendingUp size={18} color="#00B69B" />
                <span className="insights-goal-heading">Weekly Goal Progress</span>
              </div>
              <span className="insights-goal-percentage">{data.weeklyGoalCompletionPercent}%</span>
            </div>

            {/* Progress Bar */}
            <div className="insights-progress-track">
              <div
                className="insights-progress-fill"
                style={{ width: `${Math.min(100, Math.max(0, data.weeklyGoalCompletionPercent))}%` }}
              />
            </div>

            <div className="insights-goal-meta">
              <span>
                <strong>{data.wordsWrittenThisWeek.toLocaleString()}</strong> of{' '}
                <strong>{data.weeklyWordGoal.toLocaleString()}</strong> words written this week
              </span>
              <span>Daily target: {data.dailyWordGoal} words/day</span>
            </div>
          </div>

          {/* 3. 7-Day Activity Chart */}
          <div className="insights-section-block">
            <div className="insights-section-title-row">
              <div className="insights-section-heading">
                <Calendar size={18} color="#00B69B" />
                <span>Last 7 Days Activity</span>
              </div>
              <span className="insights-section-hint">Words written per day</span>
            </div>

            {data.dailyActivities && data.dailyActivities.length > 0 ? (
              <div className="insights-bars-chart">
                {data.dailyActivities.map((day) => {
                  const heightPercent = maxDailyWords > 0
                    ? Math.max(8, Math.round((day.wordCount / maxDailyWords) * 100))
                    : 8;
                  const isPositive = day.wordCount > 0;

                  return (
                    <div key={day.date} className="insights-bar-column">
                      <span className="insights-bar-value">
                        {day.wordCount > 0 ? day.wordCount : ''}
                      </span>
                      <div className="insights-bar-track">
                        <div
                          className={`insights-bar-fill ${isPositive ? 'active' : 'empty'}`}
                          style={{ height: `${heightPercent}%` }}
                          title={`${day.dayLabel} (${day.date}): ${day.wordCount} words, ${day.journalCount} entries`}
                        />
                      </div>
                      <span className="insights-bar-day">{day.dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="insights-empty-chart">No daily activity recorded for this period.</div>
            )}
          </div>

          {/* 4. Recent Writing Activity */}
          <div className="insights-section-block">
            <div className="insights-section-title-row">
              <div className="insights-section-heading">
                <Award size={18} color="#00B69B" />
                <span>Recent Writing Activity</span>
              </div>
              <span className="insights-section-hint">Latest journal entries</span>
            </div>

            {data.recentActivities && data.recentActivities.length > 0 ? (
              <div className="insights-recent-list">
                {data.recentActivities.map((entry) => (
                  <div
                    key={entry.id}
                    className="insights-recent-item"
                    onClick={() => {
                      onClose();
                      navigate(`/editor?id=${entry.id}`);
                    }}
                  >
                    <div className="insights-recent-details">
                      <span className="insights-recent-title">{entry.title || 'Untitled Entry'}</span>
                      <div className="insights-recent-tags">
                        <span className="insights-recent-badge">{entry.category || 'General'}</span>
                        <span className="insights-recent-date">{formatDate(entry.createdAt)}</span>
                      </div>
                    </div>
                    <div className="insights-recent-words">
                      <span>{entry.wordCount} words</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="insights-empty-recent">
                <BookOpen size={32} color="#94A3B8" />
                <p>No journal entries written yet.</p>
                <button
                  className="insights-empty-btn"
                  onClick={() => {
                    onClose();
                    navigate('/editor');
                  }}
                >
                  Write Your First Journal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="insights-modal-footer">
          <button className="insights-btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="insights-btn-primary"
            onClick={() => {
              onClose();
              navigate('/analytics');
            }}
          >
            <span>Open Detailed Analytics</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default JournalInsightsModal;
