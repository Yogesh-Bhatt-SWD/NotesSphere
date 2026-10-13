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

  // 7-day trend matching real activity or clean 7-day zero baseline
  const generateZeroTrend = () => {
    const list = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      list.push({
        day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        Positive: 0,
        Neutral: 0,
        Negative: 0
      });
    }
    return list;
  };

  const trendData = (insights?.dailyActivities && insights.dailyActivities.length > 0)
    ? insights.dailyActivities.map(d => ({
        day: d.dayLabel,
        Positive: d.journalCount > 0 ? d.journalCount : 0,
        Neutral: 0,
        Negative: 0
      }))
    : generateZeroTrend();

  // 1. Real Sentiment Calculation
  const sentimentCounts = analyticsData?.sentimentDistribution || { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
  const posCount = Number(sentimentCounts.POSITIVE || 0);
  const neuCount = Number(sentimentCounts.NEUTRAL || 0);
  const negCount = Number(sentimentCounts.NEGATIVE || 0);
  const totalSentiments = posCount + neuCount + negCount;

  const posPct = totalSentiments > 0 ? Math.round((posCount / totalSentiments) * 100) : 0;
  const neuPct = totalSentiments > 0 ? Math.round((neuCount / totalSentiments) * 100) : 0;
  const negPct = totalSentiments > 0 ? Math.max(0, 100 - posPct - neuPct) : 0;

  const dominantSentiment = posPct >= neuPct && posPct >= negPct
    ? { label: 'Positive', pct: posPct }
    : neuPct >= negPct
      ? { label: 'Neutral', pct: neuPct }
      : { label: 'Negative', pct: negPct };

  const sentimentDonut = totalSentiments > 0
    ? [
        { name: 'Positive', value: posPct, count: posCount, color: '#10B981' },
        { name: 'Neutral', value: neuPct, count: neuCount, color: '#64748B' },
        { name: 'Negative', value: negPct, count: negCount, color: '#EF4444' }
      ]
    : [
        { name: 'Positive', value: 0, count: 0, color: '#10B981' },
        { name: 'Neutral', value: 100, count: 0, color: '#E2E8F0' },
        { name: 'Negative', value: 0, count: 0, color: '#EF4444' }
      ];

  // 2. Real Category Distribution
  const rawCategories = analyticsData?.categoryDistribution || {};
  const hasCategories = Object.keys(rawCategories).length > 0;
  const maxCategoryCount = hasCategories ? Math.max(...Object.values(rawCategories).map(Number)) : 1;

  const categoriesList = hasCategories
    ? Object.entries(rawCategories)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .map(([name, count], idx) => ({
          name,
          count: Number(count),
          color: ['#10B981', '#6366F1', '#8B5CF6', '#FF8F6B', '#06B6D4', '#94A3B8'][idx % 6],
          max: maxCategoryCount
        }))
    : [];

  const getDateRangeLabel = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="analytics-screen">
      {/* 1. Header */}
      <div className="analytics-header-row">
        <div className="analytics-title-group">
          <h1>Journal Sentiment Trends</h1>
          <p>Analysis of your journal entries over time</p>
        </div>

        <div className="date-range-badge-pill">
          <span>{getDateRangeLabel()}</span>
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
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: totalSentiments > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {totalSentiments > 0 ? `${dominantSentiment.pct}%` : '0%'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {totalSentiments > 0 ? dominantSentiment.label : 'No Data'}
                  </div>
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
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalSentiments > 0 ? `${item.value}%` : '0%'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Distribution Horizontal Bars */}
          <div className="distribution-card">
            <h3 className="chart-title-text">Category Distribution</h3>
            {categoriesList.length > 0 ? (
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
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 140,
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                textAlign: 'center',
                padding: '0 16px'
              }}>
                No category data recorded yet. Tag categories when writing journals to see your distribution!
              </div>
            )}
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
