import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Eye,
  Heart,
  MessageSquare,
  Globe,
  Users,
  Lock,
  Send,
  Flag,
  Calendar,
  Share2,
  Check
} from 'lucide-react';
import journalService from '../../api/journalService';
import communityService from '../../api/communityService';
import ShareModal from './ShareModal';
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
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Ref lock to prevent multiple API view calls caused by React re-renders or StrictMode
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (!journal?.id) return;
    setCurrentJournal(journal);
    setViewCount(journal.viewCount || 0);

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
            // Silently handle any non-fatal tracking error
            console.debug('View tracking check:', err?.message);
          });
      }
    }

    // Load comments for published post
    communityService
      .getComments(journal.id)
      .then((res) => {
        if (res?.data) {
          setComments(res.data);
        }
      })
      .catch(() => {});
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

  const handleAddComment = async (e) => {
    e?.preventDefault();
    const content = newComment.trim();
    if (!content || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await communityService.addComment(currentJournal.id, content);
      if (res?.data) {
        setComments((prev) => [...prev, res.data]);
        setCurrentJournal((prev) => ({
          ...prev,
          commentCount: (prev.commentCount || 0) + 1
        }));
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCopyShare = () => {
    setShowShareModal(true);
  };

  const formattedDate = currentJournal.publishedAt || currentJournal.createdAt
    ? new Date(currentJournal.publishedAt || currentJournal.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Recently';

  return (
    <div className="content-detail-overlay" onClick={onClose}>
      <div className="content-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
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

        {/* Scrollable Body */}
        <div className="content-detail-body">
          {currentJournal.coverImageUrl && (
            <div style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', marginBottom: '18px' }}>
              <img
                src={currentJournal.coverImageUrl}
                alt={currentJournal.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
            {currentJournal.content}
          </div>
        </div>

        {/* Engagement Stats Bar */}
        <div className="content-detail-stats-bar">
          <div className="stats-group">
            {/* View Count Display with Eye Icon */}
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
              <span>{comments.length || currentJournal.commentCount || 0} Comments</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="content-detail-comments-section">
          <h3>Community Conversation</h3>

          <div className="comments-scroll-list">
            {comments.length === 0 ? (
              <div className="empty-comments-box">
                <MessageSquare size={24} style={{ opacity: 0.35, marginBottom: '6px' }} />
                <p>No comments yet. Share your supportive reflections!</p>
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="comment-bubble">
                  <div className="comment-header">
                    <span className="comment-author">{c.authorName || 'Member'}</span>
                    <span className="comment-time">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="comment-text">{c.content}</p>
                </div>
              ))
            )}
          </div>

          <form className="comment-form-row" onSubmit={handleAddComment}>
            <input
              type="text"
              placeholder="Write a supportive comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmittingComment}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmittingComment}
              className="btn-send-comment"
            >
              <Send size={15} /> Post
            </button>
          </form>
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
