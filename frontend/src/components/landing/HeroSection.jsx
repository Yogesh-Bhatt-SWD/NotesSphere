import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Lock,
  Globe,
  Users,
  ShieldCheck,
  TrendingUp,
  Heart,
  MessageSquare,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './HeroSection.css';

export function HeroSection() {
  const { isAuthenticated } = useAuth();

  const handleExploreClick = (e) => {
    e.preventDefault();
    const element = document.getElementById('stories');
    if (element) {
      const navOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="landing-hero" id="home">
      {/* Background Ambient Glows */}
      <div className="hero-glow hero-glow-teal" aria-hidden="true" />
      <div className="hero-glow hero-glow-peach" aria-hidden="true" />

      <div className="landing-hero-container">
        {/* Left Column: Headline, Description & CTAs */}
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="hero-badge-sparkle" />
            <span>Mindful Journaling & Social Storytelling</span>
          </div>

          <h1 className="hero-headline">
            Your Thoughts Deserve a <span className="hero-headline-accent">Place of Their Own.</span>
          </h1>

          <p className="hero-description">
            Write privately, share your stories with the world, and connect with people who understand your thoughts. Your space to write, reflect, and grow.
          </p>

          <div className="hero-cta-group">
            {isAuthenticated ? (
              <Link to="/" className="hero-btn-primary">
                <span>Open Your Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/register" className="hero-btn-primary">
                <span>Start Writing</span>
                <ArrowRight size={18} />
              </Link>
            )}

            <button
              type="button"
              onClick={handleExploreClick}
              className="hero-btn-secondary"
            >
              <Compass size={18} />
              <span>Explore Stories</span>
            </button>
          </div>

          {/* Social Proof / Trust Points */}
          <div className="hero-trust-bar">
            <div className="hero-trust-item">
              <ShieldCheck size={16} className="trust-icon" />
              <span>100% Private by default</span>
            </div>
            <div className="hero-trust-divider">•</div>
            <div className="hero-trust-item">
              <Globe size={16} className="trust-icon" />
              <span>Public blog previews</span>
            </div>
            <div className="hero-trust-divider">•</div>
            <div className="hero-trust-item">
              <TrendingUp size={16} className="trust-icon" />
              <span>Writing streaks & insights</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Product Showcase */}
        <div className="hero-visual">
          <div className="hero-mockup-wrapper">
            {/* Main Interactive Journal Card */}
            <div className="hero-card-main">
              <div className="hero-card-header">
                <div className="hero-card-author">
                  <div className="hero-author-avatar">YB</div>
                  <div>
                    <h2 className="hero-author-name">Yogesh Bhatt</h2>
                    <span className="hero-entry-date">Today · 3 min read</span>
                  </div>
                </div>
                <div className="hero-card-visibility">
                  <Lock size={12} />
                  <span>Private</span>
                </div>
              </div>

              <div className="hero-card-body">
                <h2 className="hero-entry-title">Morning Clarity & Reflections</h2>
                <p className="hero-entry-text">
                  There is profound freedom in letting your thoughts unfold without judgment. A digital sanctuary for untangled thoughts, personal milestones, and mindful creative clarity...
                </p>

                <div className="hero-entry-tags">
                  <span className="hero-tag-pill">#mindfulness</span>
                  <span className="hero-tag-pill">#journaling</span>
                  <span className="hero-sentiment-pill">Positive ✨</span>
                </div>
              </div>

              <div className="hero-card-footer">
                <div className="hero-footer-stats">
                  <span className="hero-stat-pill">
                    <Heart size={14} color="#EF4444" fill="#EF4444" />
                    <span>28 Likes</span>
                  </span>
                  <span className="hero-stat-pill">
                    <MessageSquare size={14} color="#00B69B" />
                    <span>12 Comments</span>
                  </span>
                </div>
                <span className="hero-saved-indicator">Saved & Encrypted</span>
              </div>
            </div>

            {/* Floating Floating Pill 1: Live Presence */}
            <div className="hero-float-badge float-presence">
              <span className="pulse-dot" />
              <div>
                <strong>Active Community</strong>
                <span>Real-Time WebSocket Presence</span>
              </div>
            </div>

            {/* Floating Pill 2: Community Circles */}
            <div className="hero-float-badge float-community">
              <div className="float-icon-wrap">
                <Users size={16} />
              </div>
              <div>
                <strong>Shared Circles</strong>
                <span>Engage with fellow writers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
