import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Trash2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import './CoverPhotoUploader.css';

/**
 * CoverPhotoUploader
 * Allows uploading, previewing, replacing, and removing journal cover photos.
 * Validates image types (JPG, PNG, WebP, GIF) and size (<= 5MB).
 * Compresses large images client-side into durable Base64 data URLs.
 *
 * @param {string} value - Current cover photo URL or base64 string
 * @param {function} onChange - Callback with updated image URL / base64 (or '' on removal)
 * @param {function} onError - Optional callback for error messages
 */
export function CoverPhotoUploader({ value, onChange, onError }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [localError, setLocalError] = useState('');

  const reportError = (msg) => {
    setLocalError(msg);
    if (onError) onError(msg);
    setTimeout(() => setLocalError(''), 5000);
  };

  const processFile = (file) => {
    setLocalError('');
    if (!file) return;

    // Supported formats validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      reportError('Unsupported image format. Please upload a JPG, PNG, WebP, or GIF image.');
      return;
    }

    // Size validation: 5MB maximum
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      reportError('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      reportError('Failed to read image file. Please try again.');
    };

    reader.onload = (e) => {
      const dataUrl = e.target.result;

      // Optimize image client-side if needed so it persists smoothly and compactly
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 900;
        let width = img.width;
        let height = img.height;

        // Only scale down if image exceeds dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);

          try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
            onChange(optimizedDataUrl);
            return;
          } catch {
            // Fallback to original data URL if canvas fails
            onChange(dataUrl);
            return;
          }
        }

        onChange(dataUrl);
      };

      img.onerror = () => {
        reportError('The selected file is not a valid image.');
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset file input so user can choose same file again if desired
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange('');
    setUrlDraft('');
    setShowUrlInput(false);
    setLocalError('');
  };

  const handleApplyUrl = (e) => {
    e.preventDefault();
    if (!urlDraft.trim()) return;
    if (!urlDraft.startsWith('http://') && !urlDraft.startsWith('https://') && !urlDraft.startsWith('data:image/')) {
      reportError('Please enter a valid image URL starting with https://');
      return;
    }
    onChange(urlDraft.trim());
    setShowUrlInput(false);
  };

  return (
    <div className="cover-photo-uploader-container">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
      />

      {value ? (
        /* Preview State with Frosted Overlay Actions */
        <div className="cover-photo-preview-wrapper">
          <img
            src={value}
            alt="Cover preview"
            className="cover-photo-preview-img"
            onError={() => {
              reportError('Failed to load image preview. Please check the image or upload a different one.');
            }}
          />

          <div className="cover-photo-preview-overlay">
            <button
              type="button"
              className="btn-cover-action replace"
              onClick={() => fileInputRef.current?.click()}
              title="Replace cover photo"
            >
              <Upload size={14} /> Replace Photo
            </button>
            <button
              type="button"
              className="btn-cover-action remove"
              onClick={handleRemove}
              title="Remove cover photo"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        /* Placeholder State */
        <div
          className={`cover-photo-placeholder-box ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="placeholder-icon-circle">
            <ImageIcon size={22} className="placeholder-icon" />
          </div>

          <div className="placeholder-text-group">
            <div className="placeholder-primary-text">
              <span className="upload-link-text">Upload Cover Photo</span> or drag and drop
            </div>
            <div className="placeholder-sub-text">
              JPG, PNG, WebP or GIF up to 5MB (Optional)
            </div>
          </div>

          <div className="placeholder-url-toggle-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn-toggle-url"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              <LinkIcon size={12} /> {showUrlInput ? 'Hide Link Input' : 'Paste Image Link'}
            </button>
          </div>
        </div>
      )}

      {/* Optional URL Input Mode */}
      {!value && showUrlInput && (
        <form onSubmit={handleApplyUrl} className="cover-photo-url-form">
          <input
            type="url"
            placeholder="Paste image URL (https://images.unsplash.com/...)"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            className="cover-photo-url-input"
          />
          <button type="submit" className="cover-photo-url-submit" disabled={!urlDraft.trim()}>
            Use Link
          </button>
        </form>
      )}

      {/* Local Error Banner */}
      {localError && (
        <div className="cover-photo-error-banner">
          <AlertCircle size={14} />
          <span>{localError}</span>
        </div>
      )}
    </div>
  );
}

export default CoverPhotoUploader;
