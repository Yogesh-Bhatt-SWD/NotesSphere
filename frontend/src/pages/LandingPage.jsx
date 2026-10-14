import React, { useEffect } from 'react';
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import PublicStoriesSection from '../components/landing/PublicStoriesSection';
import InsightsPreviewSection from '../components/landing/InsightsPreviewSection';
import CtaSection from '../components/landing/CtaSection';
import LandingFooter from '../components/landing/LandingFooter';
import './LandingPage.css';

export function LandingPage() {
  useEffect(() => {
    // Scroll to top or handle any anchor hashes in URL on mount
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          const navOffset = 80;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="landing-page-root">
      <LandingNav />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <PublicStoriesSection />
        <InsightsPreviewSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}

export default LandingPage;
