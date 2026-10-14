import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import heroWritingPhoto from '../../assets/hero-bg.jpg';
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
      <div className="landing-hero-container">
        {/* Left Column: Typography & Primary Actions */}
        <div className="hero-content-col">
          <h1 className="hero-headline">
            Your Thoughts Deserve a <span className="hero-headline-accent">Place of Their Own.</span>
          </h1>

          <p className="hero-description">
            Write privately, share your stories with the world, and connect with people who understand your thoughts. Your space to write, reflect, and grow.
          </p>

          <div className="hero-cta-group">
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
        </div>

        {/* Right Column: Editorial Visual Showcase */}
        <div className="hero-visual-col">
          <div className="hero-photo-frame">
            <img
              src={heroWritingPhoto}
              alt="Handwritten journal with notes, pen, and glasses on a wooden desk"
              className="hero-editorial-img"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
