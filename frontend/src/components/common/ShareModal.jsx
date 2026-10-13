import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Globe,
  ExternalLink,
  X,
  MessageCircle,
  Eye,
  Sparkles
} from 'lucide-react';
import './ShareModal.css';

export function ShareModal({ isOpen, onClose, journal }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !journal) return null;

  const slug = journal.slug || journal.id;
  const shareUrl = `${window.location.origin}/blogs/${slug}`;
  const title = journal.title || 'NoteSphere Blog';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      // Fallback for browsers that block async clipboard
      const input = document.getElementById('notesphere-share-input');
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Read "${title}" on NoteSphere:\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out "${title}" on NoteSphere!`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleOpenPreview = () => {
    window.open(`/blogs/${slug}`, '_blank');
  };

  return (
    <div className="share-modal-backdrop" onClick={onClose}>
      <div className="share-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="share-modal-header">
          <div className="share-modal-title-row">
            <div className="share-modal-icon-badge">
              <Share2 size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 className="share-modal-title">Share Article</h3>
              <p className="share-modal-subtitle">
                Distribute your published story with a public preview link.
              </p>
            </div>
          </div>
          <button className="share-modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="share-modal-body">
          {/* Article Info Pill */}
          <div className="share-article-card">
            <h4 className="share-article-title">{title}</h4>
            <div className="share-article-meta">
              <span className="share-badge-pill">
                <Globe size={11} /> Published Story
              </span>
              <span>•</span>
              <span style={{ color: 'var(--text-muted)' }}>
                {journal.category || 'Mindfulness'}
              </span>
            </div>
          </div>

          {/* Copy Link Input Box */}
          <div className="share-input-section">
            <label className="share-input-label">Shareable Public URL</label>
            <div className="share-url-container">
              <input
                id="notesphere-share-input"
                type="text"
                readOnly
                value={shareUrl}
                className="share-url-input"
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className={`share-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check size={15} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={15} /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="share-quick-actions">
            <button
              type="button"
              className="share-quick-btn whatsapp-btn"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle size={16} />
              <span>Share on WhatsApp</span>
            </button>

            {navigator.share && (
              <button
                type="button"
                className="share-quick-btn native-share-btn"
                onClick={handleNativeShare}
              >
                <Share2 size={16} />
                <span>More Apps...</span>
              </button>
            )}

            <button
              type="button"
              className="share-quick-btn preview-btn"
              onClick={handleOpenPreview}
            >
              <Eye size={16} />
              <span>View Public Page</span>
              <ExternalLink size={12} style={{ opacity: 0.7 }} />
            </button>
          </div>

          {/* Note Info */}
          <div className="share-modal-info-note">
            <Sparkles size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span>
              Anyone with this link will see the title, cover image, and introductory excerpt.
              Readers can log in to unlock the full article.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="share-modal-footer">
          <button type="button" className="share-btn-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
