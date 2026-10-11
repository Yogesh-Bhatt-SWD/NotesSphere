import React from 'react';

export function LoadingSpinner({ size = 'md', message = 'Loading...', fullScreen = false }) {
  const pixelSize = size === 'sm' ? 24 : size === 'lg' ? 48 : 36;

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: '30px',
      color: 'var(--text-secondary)'
    }}>
      <div style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        border: '3px solid var(--border-subtle)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {message && <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(244, 249, 248, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999
      }}>
        {content}
      </div>
    );
  }

  return content;
}

export default LoadingSpinner;
