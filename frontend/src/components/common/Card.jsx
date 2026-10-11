import React from 'react';
import './Card.css';

export function Card({
  children,
  className = '',
  hoverable = false,
  padding,
  onClick,
  ...props
}) {
  const classes = [
    'card',
    hoverable ? 'card-hoverable' : '',
    className
  ].filter(Boolean).join(' ');

  const style = padding !== undefined ? { padding } : {};

  return (
    <div className={classes} style={style} onClick={onClick} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, children, className = '' }) {
  return (
    <div className={`card-header ${className}`}>
      <div>
        {title && <h3 className="card-title">{title}</h3>}
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="card-header-action">{action}</div>}
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`card-footer ${className}`}>{children}</div>;
}

export default Card;
