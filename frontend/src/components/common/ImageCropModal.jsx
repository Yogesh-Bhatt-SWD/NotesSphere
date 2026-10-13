import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Move,
  Check,
  X,
  Sparkles,
  Camera
} from 'lucide-react';
import './ImageCropModal.css';

export function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 1,
  outputSize = 300,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.5);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc || !isOpen) {
      setImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      // Determine initial zoom to fit cover
      const initialScale = Math.max(300 / img.width, 300 / img.height, 1);
      setZoom(initialScale);
      setMinZoom(Math.max(0.3, Math.min(300 / img.width, 300 / img.height)));
      setPan({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Render on interactive canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Save context for transform
    ctx.save();

    // Move to center of canvas
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply zoom
    ctx.scale(zoom, zoom);

    // Draw image centered
    ctx.drawImage(
      image,
      -image.width / 2,
      -image.height / 2,
      image.width,
      image.height
    );

    ctx.restore();

    // Draw dark overlay with circular aperture mask
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, width, height);

    const radius = Math.min(width, height) * 0.42;
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2, true);
    ctx.fill();

    // Draw ring border around the crop circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#00B69B';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.stroke();

    // Subtle inner glow
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.restore();
  }, [image, zoom, rotation, pan]);

  useEffect(() => {
    if (isOpen && image) {
      drawCanvas();
    }
  }, [isOpen, image, drawCanvas]);

  // Update real-time mini circular preview
  useEffect(() => {
    if (!image || !isOpen) return;

    const timer = setTimeout(() => {
      generateCroppedDataUrl(80).then((url) => {
        if (url) setPreviewUrl(url);
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [image, zoom, rotation, pan, isOpen]);

  // Mouse / Touch drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.002;
    setZoom((prev) => Math.min(4, Math.max(minZoom, prev + zoomDelta)));
  };

  const handleRotate = (deg) => {
    setRotation((prev) => (prev + deg + 360) % 360);
  };

  const handleReset = () => {
    if (!image) return;
    const initialScale = Math.max(300 / image.width, 300 / image.height, 1);
    setZoom(initialScale);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Generate cropped output image
  const generateCroppedDataUrl = async (size = outputSize) => {
    if (!image || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    const cropRadius = Math.min(width, height) * 0.42;

    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size;
    const octx = offscreen.getContext('2d');

    // Fill white background for clean JPEG export
    octx.fillStyle = '#FFFFFF';
    octx.fillRect(0, 0, size, size);

    // Set high quality smoothing
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';

    octx.save();

    // Map crop circle coordinates to offscreen center
    octx.translate(size / 2, size / 2);

    const scaleFactor = (size / 2) / cropRadius;

    // Apply pan translated by scale
    octx.translate(pan.x * scaleFactor, pan.y * scaleFactor);

    // Apply rotation
    octx.rotate((rotation * Math.PI) / 180);

    // Apply zoom
    octx.scale(zoom * scaleFactor, zoom * scaleFactor);

    // Draw source image centered
    octx.drawImage(
      image,
      -image.width / 2,
      -image.height / 2,
      image.width,
      image.height
    );

    octx.restore();

    return offscreen.toDataURL('image/jpeg', 0.86);
  };

  const handleApply = async () => {
    if (!image) return;
    setIsProcessing(true);
    try {
      const croppedUrl = await generateCroppedDataUrl(outputSize);
      if (croppedUrl && onCropComplete) {
        onCropComplete(croppedUrl);
      }
      onClose();
    } catch (err) {
      console.error('Failed to crop avatar:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="crop-modal-backdrop" onClick={onClose}>
      <div className="crop-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="crop-modal-header">
          <div className="crop-modal-title-row">
            <div className="crop-modal-icon-badge">
              <Camera size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 className="crop-modal-title">Resize & Crop Avatar</h3>
              <p className="crop-modal-subtitle">
                Drag to reposition, adjust zoom slider, or rotate before applying.
              </p>
            </div>
          </div>
          <button className="crop-modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Viewport Canvas */}
        <div
          className="crop-canvas-viewport"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            width={380}
            height={380}
            className="crop-active-canvas"
          />
          <div className="crop-drag-hint">
            <Move size={14} /> Drag to reposition
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="crop-controls-wrapper">
          {/* Zoom Slider */}
          <div className="crop-control-row">
            <span className="crop-control-label">
              <ZoomOut size={16} /> Zoom
            </span>
            <div className="crop-slider-container">
              <button
                type="button"
                className="crop-step-btn"
                onClick={() => setZoom((z) => Math.max(minZoom, z - 0.15))}
                title="Zoom Out"
              >
                -
              </button>
              <input
                type="range"
                min={minZoom}
                max={3.5}
                step={0.02}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="crop-range-input"
              />
              <button
                type="button"
                className="crop-step-btn"
                onClick={() => setZoom((z) => Math.min(3.5, z + 0.15))}
                title="Zoom In"
              >
                +
              </button>
            </div>
            <span className="crop-zoom-value">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Quick Buttons: Rotate & Reset */}
          <div className="crop-action-toolbar">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="crop-tool-btn"
                onClick={() => handleRotate(-90)}
                title="Rotate counter-clockwise"
              >
                <RotateCcw size={15} /> Rotate Left
              </button>
              <button
                type="button"
                className="crop-tool-btn"
                onClick={() => handleRotate(90)}
                title="Rotate clockwise"
              >
                <RotateCw size={15} /> Rotate Right
              </button>
              <button
                type="button"
                className="crop-tool-btn text-btn"
                onClick={handleReset}
                title="Reset to center"
              >
                Reset
              </button>
            </div>

            {/* Live Mini Preview */}
            {previewUrl && (
              <div className="crop-live-preview-box">
                <span className="crop-preview-label">Preview:</span>
                <img
                  src={previewUrl}
                  alt="Live preview"
                  className="crop-preview-thumb"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="crop-modal-footer">
          <button
            type="button"
            className="crop-btn-cancel"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="crop-btn-apply"
            onClick={handleApply}
            disabled={isProcessing || !image}
          >
            {isProcessing ? (
              <span>Applying...</span>
            ) : (
              <>
                <Check size={16} /> Apply & Save Avatar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropModal;
