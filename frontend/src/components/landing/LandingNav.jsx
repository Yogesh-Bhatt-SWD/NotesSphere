import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './LandingNav.css';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
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
    <header className={`landing-nav-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="landing-nav-container">
        {/* Brand Logo */}
        <Link to="/" className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="landing-brand-icon">
            <BookOpen size={22} strokeWidth={2.4} />
          </div>
          <span className="landing-brand-text">
            Note<span>Sphere</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="landing-nav-links" aria-label="Main Navigation">
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Home
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollToSection('features')}
          >
            Features
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollToSection('stories')}
          >
            Explore Stories
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollToSection('insights')}
          >
            Insights
          </button>
        </nav>

        {/* Auth CTA Actions */}
        <div className="landing-nav-actions">
          {isAuthenticated ? (
            <Link to="/" className="landing-btn-primary">
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="landing-btn-ghost">
                Sign In
              </Link>
              <Link to="/register" className="landing-btn-primary">
                <span>Get Started</span>
                <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="landing-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <div className={`landing-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="landing-mobile-drawer-content">
          <nav className="landing-mobile-links">
            <button
              type="button"
              className="landing-mobile-link"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setMobileMenuOpen(false);
              }}
            >
              Home
            </button>
            <button
              type="button"
              className="landing-mobile-link"
              onClick={() => scrollToSection('features')}
            >
              Features
            </button>
            <button
              type="button"
              className="landing-mobile-link"
              onClick={() => scrollToSection('stories')}
            >
              Explore Stories
            </button>
            <button
              type="button"
              className="landing-mobile-link"
              onClick={() => scrollToSection('insights')}
            >
              Insights
            </button>
          </nav>

          <div className="landing-mobile-actions">
            {isAuthenticated ? (
              <Link to="/" className="landing-btn-primary full-width">
                <span>Go to Dashboard</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-btn-ghost full-width">
                  Sign In
                </Link>
                <Link to="/register" className="landing-btn-primary full-width">
                  <span>Get Started Free</span>
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default LandingNav;
