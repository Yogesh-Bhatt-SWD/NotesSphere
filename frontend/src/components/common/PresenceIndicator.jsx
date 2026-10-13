import React from 'react';
import { usePresence } from '../../context/PresenceContext';
import { formatLastSeen } from '../../utils/dateUtils';
import './PresenceIndicator.css';

/**
 * Reusable, accessible Presence Indicator component for NoteSphere.
 * Renders:
 * - Green glowing dot + "Online" for active users
 * - Subtle grey dot + relative "Last seen..." for offline users
 * - Pulsing neutral dot for loading/unknown state
 */
export function PresenceIndicator({
  userId,
  showLabel = false,
  size = 'md',
  fallbackOnline = undefined,
  fallbackLastSeen = undefined,
  className = '',
}) {
  const { getPresence } = usePresence();
  const presence = getPresence(userId);

  // If live presence is loaded, use it; otherwise fallback to initial props
  const isOnline = presence.isLoaded
    ? presence.online
    : fallbackOnline !== undefined
    ? fallbackOnline
    : false;

  const lastSeenAt = presence.isLoaded
    ? presence.lastSeenAt
    : fallbackLastSeen !== undefined
    ? fallbackLastSeen
    : null;

  const isLoaded = presence.isLoaded || fallbackOnline !== undefined;

  const statusText = !isLoaded
    ? 'Checking status...'
    : isOnline
    ? 'Online'
    : formatLastSeen(lastSeenAt);

  return (
    <div
      className={`presence-indicator-wrapper ${size} ${className}`}
      title={statusText}
      aria-label={`Presence: ${statusText}`}
      role="status"
    >
      <span
        className={`presence-dot ${
          !isLoaded ? 'loading' : isOnline ? 'online' : 'offline'
        }`}
      />
      {showLabel && (
        <span className={`presence-label ${isOnline ? 'online' : 'offline'}`}>
          {statusText}
        </span>
      )}
    </div>
  );
}

export default PresenceIndicator;
