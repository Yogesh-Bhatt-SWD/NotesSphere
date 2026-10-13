import React from 'react';
import { BookOpen, Rocket, Hourglass, Bookmark, Calendar } from 'lucide-react';
import { formatJournalCardDate } from '../../utils/dateUtils';
import './JournalCard.css';

export function JournalCard({ journal, onClick }) {
  const getIcon = () => {
    switch (journal.icon) {
      case 'rocket':
        return <Rocket size={20} color="#F59E0B" />;
      case 'hourglass':
        return <Hourglass size={20} color="#EF4444" />;
      default:
        return <BookOpen size={20} color="#6366F1" />;
    }
  };

  const coverUrl =
    journal.coverImageUrl ||
    journal.coverImage ||
    'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=600&q=80';

  const dateDisplay = formatJournalCardDate(journal);

  return (
    <div className="journal-card" onClick={onClick}>
      <div className="journal-card-cover-wrapper">
        <img
          src={coverUrl}
          alt={journal.title}
          className="journal-card-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=600&q=80';
          }}
        />
        {/* Frosted floating badge */}
        <div className="journal-card-floating-badge">
          {getIcon()}
        </div>
      </div>

      <div className="journal-card-body">
        <h4 className="journal-card-title">{journal.title}</h4>
        <div className="journal-card-meta">
          <Calendar size={13} className="journal-card-meta-icon" />
          <span>{dateDisplay}</span>
        </div>
      </div>
    </div>
  );
}

export default JournalCard;
