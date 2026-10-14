import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Heart } from 'lucide-react';
import './LandingFooter.css';

export function LandingFooter() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer className="landing-footer">
      <div className="landing-footer-container">
        {/* Top Row: Brand & Columns */}
        <div className="landing-footer-top">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="footer-brand-icon">
                <BookOpen size={20} strokeWidth={2.4} />
              </div>
              <span className="footer-brand-text">
                Note<span>Sphere</span>
              </span>
            </Link>
            <p className="footer-tagline">
              A mindful digital sanctuary for personal reflections, public storytelling, and thoughtful creative communities.
            </p>
          </div>

          {/* Links Column 1: Platform */}
          <div className="footer-links-col">
            <h3 className="footer-col-title">Platform</h3>
            <ul className="footer-links-list">
              <li>
                <button type="button" onClick={() => scrollTo('features')} className="footer-link-btn">
                  Features
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('stories')} className="footer-link-btn">
                  Explore Stories
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollTo('insights')} className="footer-link-btn">
                  Journal Insights
                </button>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Account */}
          <div className="footer-links-col">
            <h3 className="footer-col-title">Get Started</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/register" className="footer-link">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="footer-link">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/login" className="footer-link">
                  Google Sign-In
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Trust & Privacy */}
          <div className="footer-links-col">
            <h3 className="footer-col-title">Principles</h3>
            <ul className="footer-links-list">
              <li className="footer-static-text">100% Private by Default</li>
              <li className="footer-static-text">No intrusive trackers</li>
              <li className="footer-static-text">Encrypted sessions & JWT</li>
            </ul>
          </div>
        </div>

        {/* Bottom Row: Copyright & Credits */}
        <div className="landing-footer-bottom">
          <p className="footer-copy">
            © {new Date().getFullYear()} NoteSphere. Built with care for mindful writers and thinkers.
          </p>
          <div className="footer-sub-links">
            <span>Crafted with</span>
            <Heart size={14} color="#EF4444" fill="#EF4444" className="footer-heart" />
            <span>for personal clarity & expression</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
