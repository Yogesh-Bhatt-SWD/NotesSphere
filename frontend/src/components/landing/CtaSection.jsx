import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, HeartHandshake, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './CtaSection.css';

export function CtaSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="landing-cta-section">
      <div className="landing-cta-container">
        <div className="cta-card">
          {/* Subtle Ambient Radial Glow */}
          <div className="cta-ambient-glow" aria-hidden="true" />

          <div className="cta-badge">
            <Sparkles size={14} className="cta-badge-icon" />
            <span>JOIN THE SANCTUARY</span>
          </div>

          <h2 className="cta-headline">Your Next Story Starts Here.</h2>

          <p className="cta-description">
            Whether you are documenting quiet morning reflections or sharing powerful essays with a global audience, NoteSphere gives your thoughts a place to thrive.
          </p>

          <div className="cta-action-row">
            {isAuthenticated ? (
              <Link to="/" className="cta-btn-primary">
                <span>Go to Your Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="cta-btn-primary">
                  <span>Get Started for Free</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="cta-btn-secondary">
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          <div className="cta-reassurances">
            <span className="reassurance-item">
              <CheckCircle size={15} className="reassurance-icon" />
              <span>100% Free Forever</span>
            </span>
            <span className="reassurance-item">
              <ShieldCheck size={15} className="reassurance-icon" />
              <span>Private by Default</span>
            </span>
            <span className="reassurance-item">
              <HeartHandshake size={15} className="reassurance-icon" />
              <span>Supportive Community</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
