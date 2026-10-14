import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  Sparkles,
  ShieldCheck,
  Globe,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import heroBgPhoto from '../../assets/hero-bg.jpg';
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
      {/* Full-Width Immersive Photographic Background */}
      <div
        className="hero-bg-photo"
        style={{ backgroundImage: `url(${heroBgPhoto})` }}
        aria-hidden="true"
      />

      {/* Subtle Dark / Teal Overlay Gradient */}
      <div className="hero-bg-overlay" aria-hidden="true" />

      {/* Bottom seamless transition into features section */}
      <div className="hero-bottom-fade" aria-hidden="true" />

      <div className="landing-hero-container">
        <div className="hero-content">
          {/* 1. Introductory Badge */}
          <div className="hero-badge anim-badge">
            <Sparkles size={14} className="hero-badge-sparkle" />
            <span>Mindful Journaling & Social Storytelling</span>
          </div>

          {/* 2. Main Headline Animated Line-by-Line */}
          <h1 className="hero-headline" aria-label="Your Thoughts Deserve a Place of Their Own.">
            <span className="hero-headline-line-wrapper">
              <span className="hero-headline-line anim-headline-line-1" aria-hidden="true">
                Your Thoughts Deserve a
              </span>
            </span>
            <span className="hero-headline-line-wrapper">
              <span className="hero-headline-line anim-headline-line-2" aria-hidden="true">
                <span className="hero-headline-accent">Place of Their Own.</span>
              </span>
            </span>
            <span className="sr-only">Your Thoughts Deserve a Place of Their Own.</span>
          </h1>

          {/* 3. Supporting Description */}
          <p className="hero-description anim-description">
            Write privately, share your stories with the world, and connect with people who understand your thoughts. Your space to write, reflect, and grow.
          </p>

          {/* 4. Action Buttons */}
          <div className="hero-cta-group anim-actions">
            {isAuthenticated ? (
              <Link to="/" className="hero-btn-primary">
                <span>Start Writing</span>
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

          {/* 5. Trust & Guarantee Ribbon */}
          <div className="hero-trust-bar anim-trust">
            <div className="hero-trust-item">
              <ShieldCheck size={16} className="trust-icon" />
              <span>100% Private by default</span>
            </div>
            <div className="hero-trust-divider" aria-hidden="true">•</div>
            <div className="hero-trust-item">
              <Globe size={16} className="trust-icon" />
              <span>Public blog previews</span>
            </div>
            <div className="hero-trust-divider" aria-hidden="true">•</div>
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
