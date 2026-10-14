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

  // Unified scroll-triggered reveal observer
  useEffect(() => {
    // If user prefers reduced motion, reveal everything immediately
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    const observeUnrevealed = () => {
      const elements = document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)');
      elements.forEach((el) => observer.observe(el));
    };

    observeUnrevealed();

    // Re-observe dynamic content (e.g. asynchronously loaded public stories)
    let mutationObserver = null;
    if (typeof MutationObserver !== 'undefined') {
      const mainEl = document.getElementById('main-content') || document.body;
      mutationObserver = new MutationObserver(() => {
        observeUnrevealed();
      });
      mutationObserver.observe(mainEl, {
        childList: true,
        subtree: true
      });
    }

    return () => {
      observer.disconnect();
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
    };
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
