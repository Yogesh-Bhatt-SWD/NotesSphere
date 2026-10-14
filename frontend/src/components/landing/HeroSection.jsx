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
  Compass,
  CheckCircle2,
  MessageSquare
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
      {/* Background Ambient Radial Glows */}
      <div className="hero-glow hero-glow-teal" aria-hidden="true" />
      <div className="hero-glow hero-glow-peach" aria-hidden="true" />

      <div className="landing-hero-container">
        {/* Centered Hero Header, Copy & Actions */}
        <div className="hero-header-center">
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

          {/* Trust & Guarantee Ribbon */}
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

        {/* 3-Pillar Highlight Deck Filling The Space Seamlessly */}
        <div className="hero-pillars-grid">
          {/* Pillar 1: Private Journals */}
          <div className="hero-pillar-card">
            <div className="pillar-header">
              <div className="pillar-icon-box teal">
                <Lock size={20} />
              </div>
              <span className="pillar-tag">Personal Vault</span>
            </div>
            <h2 className="pillar-title">Private Journals</h2>
            <p className="pillar-description">
              A distraction-free sanctuary for unfiltered thoughts, personal milestones, and emotional processing.
            </p>
            <div className="pillar-footer">
              <span className="pillar-bullet">
                <CheckCircle2 size={14} className="pillar-check" />
                <span>AI Sentiment tracking</span>
              </span>
              <span className="pillar-bullet">
                <CheckCircle2 size={14} className="pillar-check" />
                <span>Zero public visibility</span>
              </span>
            </div>
          </div>

          {/* Pillar 2: Public Stories */}
          <div className="hero-pillar-card highlight">
            <div className="pillar-header">
              <div className="pillar-icon-box purple">
                <BookOpen size={20} />
              </div>
              <span className="pillar-tag purple-tag">Global Feed</span>
            </div>
            <h2 className="pillar-title">Public Stories</h2>
            <p className="pillar-description">
              Turn your reflections into public stories. Share customized links with reading times and rich preview cards.
            </p>
            <div className="pillar-footer">
              <span className="pillar-bullet">
                <CheckCircle2 size={14} className="pillar-check" />
                <span>Rich reader engagement</span>
              </span>
              <span className="pillar-bullet">
                <CheckCircle2 size={14} className="pillar-check" />
                <span>Social link sharing</span>
              </span>
            </div>
          </div>

          {/* Pillar 3: Circles & Chat */}
          <div className="hero-pillar-card">
            <div className="pillar-header">
              <div className="pillar-icon-box peach">
                <Users size={20} />
              </div>
              <span className="pillar-tag peach-tag">Real-Time</span>
            </div>
            <h2 className="pillar-title">Circles & Chat</h2>
            <p className="pillar-description">
              Join topic-focused communities and exchange thoughts via instant low-latency WebSocket direct messaging.
            </p>
            <div className="pillar-footer">
              <span className="pillar-bullet">
                <CheckCircle2 size={14} className="pillar-check" />
                <span>Live presence indicators</span>
              </span>
              <span className="pillar-bullet">
                <CheckCircle2 size={14} className="pillar-check" />
                <span>Threaded community posts</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
