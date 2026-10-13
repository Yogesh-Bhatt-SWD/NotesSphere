import React from 'react';
import { BookOpen, Rocket, Hourglass, Calendar } from 'lucide-react';
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
        return <BookOpen size={20} color="#00B69B" />;
    }
  };

  const coverUrl = journal.coverImageUrl || journal.coverImage || null;
  const dateDisplay = formatJournalCardDate(journal);

  return (
    <div className="journal-card" onClick={onClick}>
      {coverUrl ? (
        <div className="journal-card-cover-wrapper">
          <img
            src={coverUrl}
            alt={journal.title}
            className="journal-card-cover"
            loading="lazy"
            onError={(e) => {
              // Hide broken image gracefully without falling back to stock mock photos
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.parentElement) {
                e.currentTarget.parentElement.classList.add('no-cover');
              }
            }}
          />
          {/* Frosted floating published date badge over cover */}
          <div className="journal-card-floating-date" title={dateDisplay}>
            <Calendar size={12} className="journal-card-floating-date-icon" />
            <span>{dateDisplay}</span>
          </div>

          {/* Frosted floating badge */}
          <div className="journal-card-floating-badge">
            {getIcon()}
          </div>
        </div>
      ) : (
        <div className="journal-card-cover-wrapper no-cover">
          <div className="journal-card-watermark">
            <BookOpen size={56} strokeWidth={1.5} />
          </div>

          {/* Frosted floating published date badge */}
          <div className="journal-card-floating-date" title={dateDisplay}>
            <Calendar size={12} className="journal-card-floating-date-icon" />
            <span>{dateDisplay}</span>
          </div>

          {/* Frosted floating badge */}
          <div className="journal-card-floating-badge">
            {getIcon()}
          </div>
        </div>
      )}

      <div className="journal-card-body">
        <h4 className="journal-card-title">{journal.title}</h4>
        <div className="journal-card-meta">
          <span className="journal-card-category-badge">{journal.category || 'Reflections'}</span>
          {journal.readingTimeMinutes > 0 ? (
            <span className="journal-card-reading-time"> · {journal.readingTimeMinutes} min read</span>
          ) : (
            journal.wordCount > 0 && (
              <span className="journal-card-reading-time"> · {journal.wordCount} words</span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default JournalCard;
