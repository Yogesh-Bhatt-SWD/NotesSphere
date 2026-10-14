import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Smile,
  Flame,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './InsightsPreviewSection.css';

export function InsightsPreviewSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="landing-insights-section" id="insights">
      <div className="landing-insights-container">
        {/* Section Header */}
        <div className="insights-header reveal-on-scroll reveal-header">
          <div className="insights-eyebrow">
            <Sparkles size={14} />
            <span>JOURNAL INSIGHTS</span>
          </div>
          <h2 className="insights-title">
            Transform Fleeting Thoughts into Lasting Growth
          </h2>
          <p className="insights-subtitle">
            Gain meaningful awareness through emotional sentiment tracking, daily streak metrics, and reflective writing patterns.
          </p>
        </div>

        {/* 3 Metric Preview Cards */}
        <div className="insights-grid">
          {/* Card 1: Emotional Spectrum */}
          <div className="insight-card reveal-on-scroll reveal-delay-1">
            <div className="insight-card-header">
              <div className="insight-icon-wrap mint">
                <Smile size={22} />
              </div>
              <span className="insight-badge">Emotional Spectrum</span>
            </div>

            <h3 className="insight-card-title">Sentiment Distribution</h3>
            <p className="insight-card-desc">
              Understand your emotional well-being over time with automatic sentiment labeling on every entry.
            </p>

            <div className="sentiment-bars">
              <div className="sentiment-row">
                <div className="sentiment-label">
                  <span>Positive & Optimistic</span>
                  <span className="percent">68%</span>
                </div>
                <div className="sentiment-track">
                  <div className="sentiment-fill positive" style={{ width: '68%' }} />
                </div>
              </div>

              <div className="sentiment-row">
                <div className="sentiment-label">
                  <span>Reflective & Mindful</span>
                  <span className="percent">24%</span>
                </div>
                <div className="sentiment-track">
                  <div className="sentiment-fill mindful" style={{ width: '24%' }} />
                </div>
              </div>

              <div className="sentiment-row">
                <div className="sentiment-label">
                  <span>Challenging & Processing</span>
                  <span className="percent">8%</span>
                </div>
                <div className="sentiment-track">
                  <div className="sentiment-fill processing" style={{ width: '8%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Writing Streaks */}
          <div className="insight-card reveal-on-scroll reveal-delay-2">
            <div className="insight-card-header">
              <div className="insight-icon-wrap amber">
                <Flame size={22} />
              </div>
              <span className="insight-badge">Habit Formation</span>
            </div>

            <h3 className="insight-card-title">Momentum & Streaks</h3>
            <p className="insight-card-desc">
              Build a lifelong daily reflection habit. Celebrate writing milestones and watch your vocabulary grow.
            </p>

            <div className="streak-stats-box">
              <div className="streak-metric">
                <span className="metric-number">18</span>
                <span className="metric-label">Days Writing Streak 🔥</span>
              </div>
              <div className="streak-divider" />
              <div className="streak-metric">
                <span className="metric-number">4,280</span>
                <span className="metric-label">Words Penned This Month</span>
              </div>
            </div>

            <div className="mini-streak-calendar">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="streak-day-cell">
                  <div className={`streak-dot ${idx < 6 ? 'active' : 'today'}`} />
                  <span>{day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Categorical Focus */}
          <div className="insight-card reveal-on-scroll reveal-delay-3">
            <div className="insight-card-header">
              <div className="insight-icon-wrap purple">
                <Layers size={22} />
              </div>
              <span className="insight-badge">Topic Exploration</span>
            </div>

            <h3 className="insight-card-title">Categorical Balance</h3>
            <p className="insight-card-desc">
              Organize your musings by personal domain, from creative breakthroughs to mindfulness and goals.
            </p>

            <div className="category-tags-preview">
              <span className="cat-chip active">Mindfulness (24)</span>
              <span className="cat-chip">Goals & Growth (18)</span>
              <span className="cat-chip">Reflections (14)</span>
              <span className="cat-chip">Work & Projects (11)</span>
              <span className="cat-chip">Creative Ideas (9)</span>
              <span className="cat-chip">Travel Notes (6)</span>
            </div>

            <div className="insight-cta-wrap">
              <Link
                to={isAuthenticated ? '/analytics' : '/register'}
                className="insight-link-btn"
              >
                <span>{isAuthenticated ? 'View Your Full Insights' : 'Explore Your Insights'}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InsightsPreviewSection;
