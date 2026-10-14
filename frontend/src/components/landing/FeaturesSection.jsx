import React from 'react';
import {
  Lock,
  BookOpen,
  Users,
  MessageSquare,
  UserPlus,
  LineChart,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import './FeaturesSection.css';

const FEATURES_DATA = [
  {
    id: 'private-journals',
    icon: Lock,
    iconColor: '#00B69B',
    bgColor: '#E7F8F5',
    tag: 'Private & Secure',
    title: 'Private Journals',
    description: 'Capture your unfiltered thoughts in a distraction-free digital journal. Tag entries, track emotional tone, and keep reflections strictly private to you.',
    bullets: ['Sentiment analysis', 'Custom tag filtering', 'Distraction-free editor'],
  },
  {
    id: 'public-stories',
    icon: BookOpen,
    iconColor: '#8B5CF6',
    bgColor: '#F5F3FF',
    tag: 'Publish & Share',
    title: 'Public Stories',
    description: 'Turn your best thoughts into published articles. Share customized story links with rich Open Graph preview cards for social media and messaging apps.',
    bullets: ['Public teaser previews', 'Custom cover photos', 'Read time & view counts'],
  },
  {
    id: 'communities',
    icon: Users,
    iconColor: '#FF8F6B',
    bgColor: '#FFF1EC',
    tag: 'Shared Circles',
    title: 'Communities',
    description: 'Join vibrant topic-based circles of writers, philosophers, and thinkers. Post stories directly to community feeds and engage with threaded comments.',
    bullets: ['Topic-driven circles', 'Threaded discussions', 'Rich emoji reactions'],
  },
  {
    id: 'real-time-chat',
    icon: MessageSquare,
    iconColor: '#3B82F6',
    bgColor: '#EFF6FF',
    tag: 'Live WebSocket',
    title: 'Real-Time Chat',
    description: 'Engage in instantaneous 1-on-1 conversations with writers and friends powered by low-latency STOMP WebSocket message delivery.',
    bullets: ['Low-latency messaging', 'Instant message delivery', 'Secure conversation history'],
  },
  {
    id: 'friends-network',
    icon: UserPlus,
    iconColor: '#F59E0B',
    bgColor: '#FEF3C7',
    tag: 'Presence & Network',
    title: 'Friends & Connections',
    description: 'Discover inspiring users across NoteSphere. Send friend requests, track live presence status indicators, and cultivate your trusted circle.',
    bullets: ['Live online indicators', 'Discover new writers', 'Inner circle privacy'],
  },
  {
    id: 'journal-insights',
    icon: LineChart,
    iconColor: '#10B981',
    bgColor: '#ECFDF5',
    tag: 'Writing Analytics',
    title: 'Journal Insights',
    description: 'Track your personal growth and writing velocity. View mood distribution charts, daily writing streaks, and weekly output volume.',
    bullets: ['Mood sentiment distribution', 'Streak & word count trends', 'Interactive visual charts'],
  },
];

export function FeaturesSection() {
  return (
    <section className="landing-features-section" id="features">
      <div className="landing-features-container">
        {/* Section Header */}
        <div className="features-header">
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

        {/* Feature Grid */}
        <div className="features-grid">
          {FEATURES_DATA.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.id} className="feature-card">
                <div className="feature-card-top">
                  <div
                    className="feature-icon-wrapper"
                    style={{ backgroundColor: feature.bgColor, color: feature.iconColor }}
                  >
                    <Icon size={24} strokeWidth={2.2} />
                  </div>
                  <span className="feature-tag-badge">{feature.tag}</span>
                </div>

                <h3 className="feature-card-title">{feature.title}</h3>
                <p className="feature-card-desc">{feature.description}</p>

                <ul className="feature-bullets">
                  {feature.bullets.map((bullet, idx) => (
                    <li key={idx} className="feature-bullet-item">
                      <CheckCircle2 size={15} className="bullet-check-icon" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
