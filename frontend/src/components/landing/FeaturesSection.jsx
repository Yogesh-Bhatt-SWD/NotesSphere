import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  BookOpen,
  Users,
  MessageSquare,
  UserPlus,
  LineChart,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './FeaturesSection.css';

const FEATURES_DATA = [
  {
    id: 'private-journals',
    icon: Lock,
    iconColor: '#00B69B',
    bgColor: '#E7F8F5',
    title: 'Private Journals',
    description: 'A distraction-free, encrypted sanctuary for unfiltered personal reflection and thoughts.',
    actionLabel: 'Open Journal',
    route: '/journals',
    requiresAuth: true
  },
  {
    id: 'public-stories',
    icon: BookOpen,
    iconColor: '#8B5CF6',
    bgColor: '#F5F3FF',
    title: 'Public Stories',
    description: 'Publish your best reflections to the world with rich shareable links.',
    actionLabel: 'Explore Stories',
    targetSection: 'stories',
    route: '/public-journals',
    requiresAuth: false
  },
  {
    id: 'communities',
    icon: Users,
    iconColor: '#FF8F6B',
    bgColor: '#FFF1EC',
    title: 'Communities',
    description: 'Join topic-driven circles to share stories and exchange thoughtful discussions.',
    actionLabel: 'Join Circles',
    route: '/communities',
    requiresAuth: true
  },
  {
    id: 'real-time-chat',
    icon: MessageSquare,
    iconColor: '#3B82F6',
    bgColor: '#EFF6FF',
    title: 'Real-Time Chat',
    description: 'Connect and message directly with fellow writers using live presence.',
    actionLabel: 'Open Chat',
    route: '/chat',
    requiresAuth: true
  },
  {
    id: 'friends-network',
    icon: UserPlus,
    iconColor: '#F59E0B',
    bgColor: '#FEF3C7',
    title: 'Friends & Connections',
    description: 'Build meaningful friendships and follow inspiring authors across NoteSphere.',
    actionLabel: 'Find Writers',
    route: '/friends',
    requiresAuth: true
  },
  {
    id: 'journal-insights',
    icon: LineChart,
    iconColor: '#10B981',
    bgColor: '#ECFDF5',
    title: 'Journal Insights',
    description: 'Discover emotional patterns and writing habits with automated sentiment analytics.',
    actionLabel: 'View Insights',
    targetSection: 'insights',
    route: '/analytics',
    requiresAuth: false
  }
];

export function FeaturesSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleFeatureClick = (feature) => {
    // If feature points to an in-page section (for unauthenticated visitors)
    if (feature.targetSection && !isAuthenticated) {
      const el = document.getElementById(feature.targetSection);
      if (el) {
        const navOffset = 80;
        const elPos = el.getBoundingClientRect().top;
        const offsetPos = elPos + window.pageYOffset - navOffset;
        window.scrollTo({
          top: offsetPos,
          behavior: 'smooth'
        });
        return;
      }
    }

    // If authenticated, navigate straight to the destination
    if (isAuthenticated) {
      navigate(feature.route);
      return;
    }

    // If requires auth and user is guest, route to login preserving destination
    if (feature.requiresAuth) {
      navigate(`/login?redirect=${encodeURIComponent(feature.route)}`);
      return;
    }

    // Default fallback
    navigate(feature.route);
  };

  return (
    <section className="landing-features-section" id="features">
      <div className="landing-features-container">
        {/* Section Header */}
        <div className="features-header reveal-on-scroll reveal-header">
          <div className="features-eyebrow">
            <Sparkles size={14} />
            <span>BUILT FOR MINDFUL WRITERS</span>
          </div>
          <h2 className="features-title">
            Everything You Need to Write, Connect & Grow
          </h2>
          <p className="features-subtitle">
            Every feature in NoteSphere is carefully designed to balance private introspection with meaningful social storytelling.
          </p>
        </div>

        {/* Simplified Interactive Feature Grid */}
        <div className="features-grid">
          {FEATURES_DATA.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className={`feature-card interactive reveal-on-scroll reveal-delay-${idx + 1}`}
                role="button"
                tabIndex={0}
                onClick={() => handleFeatureClick(feature)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFeatureClick(feature);
                  }
                }}
                aria-label={`${feature.title}: ${feature.description}`}
              >
                <div
                  className="feature-icon-wrapper"
                  style={{ backgroundColor: feature.bgColor, color: feature.iconColor }}
                >
                  <Icon size={22} strokeWidth={2.2} />
                </div>

                <div className="feature-card-body">
                  <h3 className="feature-card-title">{feature.title}</h3>
                  <p className="feature-card-desc">{feature.description}</p>
                </div>

                <div className="feature-action-row">
                  <span className="feature-action-text">{feature.actionLabel}</span>
                  <div className="feature-action-circle">
                    <ArrowUpRight size={15} className="feature-action-icon" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
