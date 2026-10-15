import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Send, Smile, X, Loader2, Sparkles, Heart } from 'lucide-react';
import communityService from '../../api/communityService';
import { useAuth } from '../../context/AuthContext';
import { normalizeAvatarUrl, getAuthorInitial } from '../../utils/avatarUtils';
import './CommentSection.css';

const QUICK_EMOJIS = ['❤️', '👏', '🔥', '✨', '💡', '🙌', '😍', '🎉', '🚀', '👍'];

const EMOJI_CATEGORIES = [
  {
    name: 'Top Reactions',
    emojis: ['❤️', '👏', '🔥', '✨', '💡', '🙌', '😍', '🎉', '🚀', '👍'],
  },
  {
    name: 'Expressions & Smiles',
    emojis: ['😊', '😄', '😂', '🥹', '🥳', '😎', '🥰', '😌', '🤔', '😇', '🤗', '🤩', '🫡', '😴'],
  },
  {
    name: 'Hearts & Energy',
    emojis: ['💖', '💕', '💯', '💫', '🌟', '💥', '✌️', '🤝', '🫶', '🙏', '⭐', '🎯', '🏆'],
  },
  {
    name: 'Mindful & Creative',
    emojis: ['✍️', '📖', '📚', '☕', '🌱', '🌿', '🧘', '🕊️', '🌸', '🌻', '☀️', '🌙'],
  },
];

export function CommentSection({
  journalId,
  initialComments = null,
  onCommentCountChange = null,
  className = '',
}) {
  const { user } = useAuth();
  const location = useLocation();

  const [comments, setComments] = useState(initialComments || []);
  const [loading, setLoading] = useState(!initialComments);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState(null);

  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Load comments if not provided initially
  useEffect(() => {
    if (!journalId) return;

    if (initialComments !== null && initialComments !== undefined) {
      setComments(initialComments);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    communityService
      .getComments(journalId)
      .then((res) => {
        if (isMounted) {
          const list = res?.data || [];
          setComments(list);
          if (onCommentCountChange) {
            onCommentCountChange(list.length);
          }
        }
      })
      .catch((err) => {
        console.debug('Failed to fetch comments:', err?.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [journalId, initialComments]);

  // Click outside listener for emoji picker popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest('.emoji-toggle-btn')
      ) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Insert emoji at current cursor position
  const handleInsertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setCommentText((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const nextText =
      commentText.substring(0, start) + emoji + commentText.substring(end);

    setCommentText(nextText);

    // Reposition cursor right after inserted emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || isSubmitting || !journalId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await communityService.addComment(journalId, trimmed);
      const added = res?.data || {
        id: 'tmp-' + Date.now(),
        journalId,
        content: trimmed,
        authorName: user?.username || user?.fullName || 'You',
        createdAt: new Date().toISOString(),
      };

      const updated = [...comments, added];
      setComments(updated);
      setCommentText('');
      setShowEmojiPicker(false);

      if (onCommentCountChange) {
        onCommentCountChange(updated.length);
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCommentDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className={`comment-section-root ${className}`}>
      {/* Header */}
      <div className="comment-section-header">
        <h3 className="comment-section-title">
          <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
          <span>Comments</span>
          <span className="comment-count-badge">{comments.length}</span>
        </h3>
      </div>

      {/* Quick Emoji Reaction Pill Bar */}
      <div className="quick-emoji-bar">
        <span className="quick-emoji-label">React with emoji:</span>
        {QUICK_EMOJIS.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            className="quick-emoji-btn"
            onClick={() => handleInsertEmoji(emoji)}
            title={`Add ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Comment Input Composer (if logged in) */}
      {user ? (
        <form onSubmit={handleSubmit} className="comment-composer-box">
          <textarea
            ref={textareaRef}
            className="comment-textarea"
            placeholder="Share your thoughts, supportive reflection, or reaction with emojis..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={isSubmitting}
            maxLength={2000}
            rows={3}
          />

          <div className="comment-composer-footer">
            <div className="comment-toolbar-left">
              <button
                type="button"
                className={`emoji-toggle-btn ${showEmojiPicker ? 'active' : ''}`}
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                title="Add emoji"
              >
                <Smile size={17} />
                <span>Emoji</span>
              </button>

              {/* Floating Emoji Picker Popover */}
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="emoji-picker-popover">
                  <div className="emoji-picker-header">
                    <span className="emoji-picker-title">Pick an emoji</span>
                    <button
                      type="button"
                      className="emoji-picker-close"
                      onClick={() => setShowEmojiPicker(false)}
                      title="Close"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {EMOJI_CATEGORIES.map((cat, cIdx) => (
                      <div key={cIdx} className="emoji-category-group">
                        <div className="emoji-category-name">{cat.name}</div>
                        <div className="emoji-grid">
                          {cat.emojis.map((emoji, eIdx) => (
                            <button
                              key={eIdx}
                              type="button"
                              className="emoji-grid-item"
                              onClick={() => handleInsertEmoji(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="comment-toolbar-right">
              <span className="comment-char-counter">
                {commentText.length}/2000
              </span>
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className="btn-post-comment"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="login-to-comment-banner">
          <span className="login-to-comment-text">
            Sign in to join the conversation and share reflections.
          </span>
          <Link
            to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
            className="login-to-comment-btn"
          >
            Sign In to Comment
          </Link>
        </div>
      )}

      {error && (
        <div style={{
          padding: '8px 12px',
          background: '#FEE2E2',
          color: '#DC2626',
          borderRadius: '8px',
          fontSize: '0.84rem'
        }}>
          {error}
        </div>
      )}

      {/* Comments List */}
      <div className="comments-list-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
            <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: '0.85rem' }}>Loading conversation...</div>
          </div>
        ) : comments.length === 0 ? (
          <div className="empty-comments-state">
            <MessageSquare size={26} style={{ opacity: 0.4 }} />
            <div className="empty-comments-title">No comments yet</div>
            <p className="empty-comments-desc">
              Be the first to share an inspiring thought or reflection with emojis!
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const author = comment.authorName || 'Member';
            const initial = getAuthorInitial(author);
            const avatarUrl = normalizeAvatarUrl(comment.authorAvatarUrl || comment.avatarUrl);

            return (
              <div key={comment.id} className="comment-card-item">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={author}
                    className="comment-user-avatar-img"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className="comment-user-avatar"
                  style={{ display: avatarUrl ? 'none' : 'flex' }}
                >
                  {initial}
                </div>
                <div className="comment-content-wrap">
                  <div className="comment-author-header">
                    <span className="comment-author-name">{author}</span>
                    <span className="comment-timestamp">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="comment-body-text">{comment.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CommentSection;
