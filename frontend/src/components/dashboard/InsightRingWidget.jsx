import React from 'react';
import { useNavigate } from 'react-router-dom';
import { mockStats } from '../../mock/mockData';
import './InsightRingWidget.css';

export function InsightRingWidget({ stats = mockStats }) {
  const navigate = useNavigate();
  const percentage = stats.sentimentBalanceScore || 82;

  // Circumference of 2 * pi * 45 = ~282.74
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="insight-ring-widget">
      <h3 className="insight-widget-title">Journal Insights</h3>

      <div className="insight-content-row">
        {/* Circular Progress Gauge */}
        <div className="progress-ring-container">
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

        {/* Stats List */}
        <div className="insight-stats-list">
          <div className="stat-row">
            <span className="stat-label">Total Journals</span>
            <span className="stat-val">{stats.totalJournals}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Active Streak</span>
            <span className="stat-val">{stats.activeStreakDays} Days</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Words Written</span>
            <span className="stat-val">{stats.totalWordsWritten}</span>
          </div>
        </div>
      </div>

      <span className="view-details-link" onClick={() => navigate('/analytics')}>
        View Details
      </span>
    </div>
  );
}

export default InsightRingWidget;
