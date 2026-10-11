import React from 'react';
import { BookOpen, Plus } from 'lucide-react';
import Button from './Button';
import './EmptyState.css';

export function EmptyState({
  icon: Icon = BookOpen,
  title = 'No journals found',
  description = 'Start your mindfulness journey by writing your first journal entry.',
  actionText = 'Write Entry',
  onAction,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon-wrapper">
        <Icon size={32} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {onAction && (
        <Button variant="primary" size="md" icon={Plus} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
