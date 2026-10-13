import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Eye,
  Heart,
  MessageSquare,
  Globe,
  Users,
  Lock,
  Calendar,
  Share2,
  Check
} from 'lucide-react';
import journalService from '../../api/journalService';
import communityService from '../../api/communityService';
import ShareModal from './ShareModal';
import CommentSection from './CommentSection';
import { formatJournalCardDate } from '../../utils/dateUtils';
import './ContentDetailModal.css';

export function ContentDetailModal({
  journal,
  onClose,
  onViewCountUpdate,
  onToggleLike
}) {
  const [currentJournal, setCurrentJournal] = useState(journal || null);
  const [viewCount, setViewCount] = useState(journal?.viewCount || 0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Ref lock to prevent multiple API view calls caused by React re-renders or StrictMode
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (!journal?.id) return;
    setCurrentJournal(journal);
    setViewCount(journal.viewCount || 0);

    // If content is not present, fetch the full journal entry by ID
    if (!journal.content) {
      journalService.getJournalById(journal.id)
        .then((res) => {
          const fullData = res?.data?.data || res?.data || res;
          if (fullData && typeof fullData === 'object') {
            setCurrentJournal((prev) => ({ ...prev, ...fullData }));
          }
        })
        .catch(() => {});
    }

    // Track view once per modal open
    if (!hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true;

      // Only published content (PUBLIC or COMMUNITY) tracks views; backend enforces rules and deduplication
      if (journal.visibility === 'PUBLIC' || journal.visibility === 'COMMUNITY') {
        journalService
          .recordView(journal.id)
          .then((res) => {
            const count = res?.data?.data?.viewCount ?? res?.data?.viewCount;
            if (count !== undefined && count !== null) {
              setViewCount(count);
              if (onViewCountUpdate) {
                onViewCountUpdate(journal.id, count);
              }
            }
          })
          .catch((err) => {
            console.debug('View tracking check:', err?.message);
          });
      }
    }
  }, [journal?.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!currentJournal) return null;

  const isPublic = currentJournal.visibility === 'PUBLIC';
  const isCommunity = currentJournal.visibility === 'COMMUNITY';

  const handleLike = async () => {
    if (onToggleLike) {
      onToggleLike(currentJournal.id);
      setCurrentJournal((prev) => ({
        ...prev,
        likedByCurrentUser: !prev.likedByCurrentUser,
        likeCount: prev.likedByCurrentUser ? Math.max(0, (prev.likeCount || 1) - 1) : (prev.likeCount || 0) + 1
      }));
    } else {
      try {
        const res = await communityService.toggleReaction(currentJournal.id);
        if (res?.data) {
          setCurrentJournal((prev) => ({
            ...prev,
            likedByCurrentUser: res.data.liked,
            likeCount: res.data.likeCount
          }));
        }
      } catch (err) {
        console.error('Failed to react:', err);
      }
    }
  };

  const handleCopyShare = () => {
    setShowShareModal(true);
  };

  return (
    <div className="content-detail-overlay" onClick={onClose}>
      <div className="content-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* 1. Fixed Header */}
        <div className="content-detail-header">
          <div className="content-detail-author-row">
            <div className="content-detail-avatar">
              {(currentJournal.authorName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="content-detail-author-meta">
              <div className="author-name-row">
                <span className="author-name">{currentJournal.authorName || 'Anonymous Author'}</span>
                {isPublic && (
                  <span className="badge-visibility-pill public">
                    <Globe size={11} /> Public
                  </span>
                )}
                {isCommunity && (
                  <span className="badge-visibility-pill community">
                    <Users size={11} /> {currentJournal.communityName || 'Community'}
                  </span>
                )}
                {!isPublic && !isCommunity && (
                  <span className="badge-visibility-pill private">
                    <Lock size={11} /> Private
                  </span>
                )}
              </div>
              <div className="publish-date-row">
                <Calendar size={12} />
                <span>{formatJournalCardDate(currentJournal)}</span>
                {currentJournal.category && (
                  <>
                    <span>•</span>
                    <span className="category-pill">{currentJournal.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn-icon-action"
              onClick={handleCopyShare}
              title="Share link"
            >
              {copiedLink ? <Check size={16} color="var(--primary)" /> : <Share2 size={16} />}
            </button>
            <button
              className="btn-icon-close"
              onClick={onClose}
              title="Close modal (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 2. Unified Scrollable Content Area: Article + Stats + Comments */}
        <div className="content-detail-scroll-area">
          <div className="content-detail-body">
            {(currentJournal.coverImageUrl || currentJournal.coverImage) && (
              <div style={{ width: '100%', height: '240px', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', backgroundColor: 'var(--bg-subtle)' }}>
                <img
                  src={currentJournal.coverImageUrl || currentJournal.coverImage}
                  alt={currentJournal.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.style.display = 'none';
                    }
                  }}
                />
              </div>
            )}

            <h1 className="content-detail-title">{currentJournal.title}</h1>

            {currentJournal.tags && currentJournal.tags.length > 0 && (
              <div className="content-detail-tags">
                {currentJournal.tags.map((tag) => (
                  <span key={tag} className="tag-item">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="content-detail-text">
              {currentJournal.content || 'No content written for this journal entry.'}
            </div>
          </div>

          {/* 3. Engagement Stats Bar */}
          <div className="content-detail-stats-bar">
            <div className="stats-group">
              <div className="stat-pill views" title="Total content views">
                <Eye size={17} />
                <span>{viewCount} {viewCount === 1 ? 'view' : 'views'}</span>
              </div>

              <button
                className={`stat-pill likes-btn ${currentJournal.likedByCurrentUser ? 'active' : ''}`}
                onClick={handleLike}
                title="Like this publication"
              >
                <Heart
                  size={17}
                  fill={currentJournal.likedByCurrentUser ? '#EF4444' : 'none'}
                  color={currentJournal.likedByCurrentUser ? '#EF4444' : 'currentColor'}
                />
                <span>{currentJournal.likeCount || 0} Likes</span>
              </button>

              <div className="stat-pill comments">
                <MessageSquare size={17} />
                <span>{currentJournal.commentCount || 0} Comments</span>
              </div>
            </div>
          </div>

          {/* 4. Comments Section with Emoji Picker */}
          <div className="content-detail-comments-container">
            <CommentSection
              journalId={currentJournal.id}
              onCommentCountChange={(newCount) => {
                setCurrentJournal((prev) => ({ ...prev, commentCount: newCount }));
              }}
            />
          </div>
        </div>
      </div>

      {/* Share Dialog Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        journal={currentJournal}
      />
    </div>
  );
}

export default ContentDetailModal;
