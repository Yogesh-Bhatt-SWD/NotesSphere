import React from 'react';
import './Badge.css';

export function Badge({
  children,
  variant = 'primary',
  dot = false,
  className = '',
}) {
  const classes = [
    'badge',
    `badge-${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function PillNumber({ count, className = '' }) {
  if (!count) return null;
  return <span className={`badge-pill-number ${className}`}>{count}</span>;
}

export default Badge;
