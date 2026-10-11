import React from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import Header from '../components/layout/Header';
import { mockStats } from '../mock/mockData';
import './AnalyticsPage.css';

export function AnalyticsPage() {
  const { toggleMobileMenu } = useOutletContext() || {};

  const activityData = [
    { date: 'Mon', entries: 2 },
    { date: 'Tue', entries: 3 },
    { date: 'Wed', entries: 1 },
    { date: 'Thu', entries: 4 },
    { date: 'Fri', entries: 2 },
    { date: 'Sat', entries: 5 },
    { date: 'Sun', entries: 3 },
  ];

  return (
    <div className="analytics-page">
      <Header
        title="Mood & Journal Analytics"
        subtitle="Holistic insights into your sentiments, journaling habits, and writing activity"
        onToggleMobileMenu={toggleMobileMenu}
      />

      <div className="center-page-body">
        {/* Metrics Grid */}
        <div className="analytics-metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Writing Streak</span>
            <div className="metric-value">14 Days</div>
            <span className="metric-sub">+3 days from last week</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Positive Sentiment</span>
            <div className="metric-value">68%</div>
            <span className="metric-sub">Predominantly Mindful</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Total Journals</span>
            <div className="metric-value">4.6k</div>
            <span className="metric-sub">Across all categories</span>
          </div>

          <div className="metric-card">
            <span className="metric-label">Total Words</span>
            <div className="metric-value">128.4k</div>
            <span className="metric-sub">~450 words / entry avg</span>
          </div>
        </div>

        {/* 2-Column Charts */}
        <div className="charts-two-col">
          {/* Sentiment Distribution Pie */}
          <div className="chart-card">
            <h3 className="chart-title">Mood & Sentiment Distribution</h3>
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockStats.sentimentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {mockStats.sentimentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Share']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown Bar Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Entries by Category</h3>
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockStats.categoryStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(val) => [val, 'Entries']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="count" fill="#00B69B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Weekly Activity Area Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Weekly Writing Frequency</h3>
          <div style={{ height: 220, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B69B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00B69B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                <Area type="monotone" dataKey="entries" stroke="#00B69B" strokeWidth={3} fillOpacity={1} fill="url(#colorTeal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
