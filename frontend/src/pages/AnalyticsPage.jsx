import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Flame, BookOpen, Target, ChevronRight } from 'lucide-react';
import journalService from '../api/journalService';
import analyticsService from '../api/analyticsService';
import './AnalyticsPage.css';

export function AnalyticsPage() {
  const [insights, setInsights] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    journalService.getInsights()
      .then((res) => {
        if (res?.data) setInsights(res.data);
      })
      .catch(() => {});

    analyticsService.getUserAnalytics()
      .then((res) => {
        if (res?.data) setAnalyticsData(res.data);
      })
      .catch(() => {});
  }, []);

  // 7-day trend matching real activity or fallback
  const trendData = (insights?.dailyActivities && insights.dailyActivities.length > 0)
    ? insights.dailyActivities.map(d => ({
        day: d.dayLabel,
        Positive: d.journalCount > 0 ? d.journalCount : 0,
        Neutral: 0,
        Negative: 0
      }))
    : [
        { day: 'Apr 6', Positive: 8, Neutral: 5, Negative: 2 },
        { day: 'Apr 7', Positive: 11, Neutral: 7, Negative: 3 },
        { day: 'Apr 8', Positive: 9, Neutral: 6, Negative: 1 },
        { day: 'Apr 9', Positive: 13, Neutral: 8, Negative: 4 },
        { day: 'Apr 10', Positive: 10, Neutral: 6, Negative: 2 },
        { day: 'Apr 11', Positive: 14, Neutral: 9, Negative: 1 },
        { day: 'Apr 12', Positive: 15, Neutral: 10, Negative: 3 }
      ];

  // Sentiment Distribution Donut (Screen 3)
  const sentimentDonut = [
    { name: 'Positive', value: 68, color: '#10B981' },
    { name: 'Neutral', value: 20, color: '#64748B' },
    { name: 'Negative', value: 12, color: '#EF4444' }
  ];

  // Category Distribution Progress Bars (Screen 3)
  const categoriesList = analyticsData?.categoryDistribution && Object.keys(analyticsData.categoryDistribution).length > 0
    ? Object.entries(analyticsData.categoryDistribution).map(([name, count], idx) => ({
        name,
        count: Number(count),
        color: ['#10B981', '#6366F1', '#8B5CF6', '#FF8F6B', '#06B6D4', '#94A3B8'][idx % 6],
        max: Math.max(10, ...Object.values(analyticsData.categoryDistribution).map(Number))
      }))
    : [
        { name: 'Work', count: 28, color: '#10B981', max: 30 },
        { name: 'Personal', count: 18, color: '#6366F1', max: 30 },
        { name: 'Study', count: 12, color: '#8B5CF6', max: 30 },
        { name: 'Travel', count: 10, color: '#FF8F6B', max: 30 },
        { name: 'Health', count: 8, color: '#06B6D4', max: 30 },
        { name: 'Other', count: 4, color: '#94A3B8', max: 30 }
      ];

  return (
    <div className="analytics-screen">
      {/* 1. Header */}
      <div className="analytics-header-row">
        <div className="analytics-title-group">
          <h1>Journal Sentiment Trends</h1>
          <p>Analysis of your journal entries over time</p>
        </div>

        <div className="date-range-badge-pill">
          <span>Apr 6, 2026 - Apr 12, 2026</span>
          <ChevronRight size={14} />
        </div>
      </div>

      <div className="center-page-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 2. Top Card: Sentiment Trend Line Chart */}
        <div className="sentiment-trend-card">
          <div className="chart-header-row">
            <h3 className="chart-title-text">Sentiment Trend</h3>
            <select className="timeframe-select">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>

          <div className="legend-custom-row">
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● Positive
            </span>
            <span style={{ color: '#06B6D4', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● Neutral
            </span>
            <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● Negative
            </span>
          </div>

          <div style={{ height: 230, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} domain={[0, 16]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                <Line type="monotone" dataKey="Positive" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Neutral" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Negative" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Middle Row: Sentiment Distribution + Category Distribution */}
        <div className="analytics-middle-grid">
          {/* Donut Chart */}
          <div className="distribution-card">
            <h3 className="chart-title-text">Sentiment Distribution</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', height: 180 }}>
              <div style={{ position: 'relative', width: 140, height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentDonut}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sentimentDonut.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>68%</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Positive</div>
                </div>
              </div>

              {/* Legend List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {sentimentDonut.map((item) => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Distribution Horizontal Bars */}
          <div className="distribution-card">
            <h3 className="chart-title-text">Category Distribution</h3>
            <div className="category-bars-list">
              {categoriesList.map((cat) => (
                <div key={cat.name} className="category-bar-row">
                  <span className="cat-label">{cat.name}</span>
                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-progress"
                      style={{
                        width: `${(cat.count / cat.max) * 100}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                  <span className="cat-val">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Bottom Row: 3 Metric Cards */}
        <div className="bottom-metrics-row">
          {/* Writing Streak */}
          <div className="stat-metric-card">
            <div className="metric-icon-wrap" style={{ background: '#FFF1EC', color: '#FF7B54' }}>
              <Flame size={24} />
            </div>
            <div className="metric-text-details">
              <span className="metric-title-small">Writing Streak</span>
              <div className="metric-number-big">
                {insights ? `${insights.currentStreakDays} ${insights.currentStreakDays === 1 ? 'Day' : 'Days'}` : '0 Days'}
              </div>
              <p className="metric-caption-desc">
                {insights && insights.currentStreakDays > 0
                  ? `Keep it up! You've written for ${insights.currentStreakDays} consecutive days.`
                  : 'Write today to build your writing streak!'}
              </p>
            </div>
          </div>

          {/* Total Journals */}
          <div className="stat-metric-card">
            <div className="metric-icon-wrap" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <BookOpen size={24} />
            </div>
            <div className="metric-text-details">
              <span className="metric-title-small">Total Journals</span>
              <div className="metric-number-big">
                {insights ? insights.totalJournals.toLocaleString() : '0'}
              </div>
              <p className="metric-caption-desc">
                {insights ? `${insights.totalWordsWritten.toLocaleString()} words lifetime` : '0 words written'}
              </p>
            </div>
          </div>

          {/* Daily Goal */}
          <div className="stat-metric-card">
            <div className="metric-icon-wrap" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
              <Target size={24} />
            </div>
            <div className="metric-text-details">
              <span className="metric-title-small">Weekly Goal</span>
              <div className="metric-number-big">
                {insights ? `${insights.weeklyGoalCompletionPercent}%` : '0%'}
              </div>
              <p className="metric-caption-desc">
                {insights
                  ? `${insights.wordsWrittenThisWeek.toLocaleString()} of ${insights.weeklyWordGoal.toLocaleString()} words this week`
                  : '0 of 3,500 words this week'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
