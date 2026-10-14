import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Globe,
  TrendingUp,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import heroBgImage from '../../assets/hero-bg.jpg';
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
      {/* Photographic Editorial Background & Gradient Overlay */}
      <div
        className="hero-bg-photo"
        style={{ backgroundImage: `url(${heroBgImage})` }}
        aria-hidden="true"
      />
      <div className="hero-bg-overlay" aria-hidden="true" />

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
      </div>
    </section>
  );
}

export default HeroSection;
