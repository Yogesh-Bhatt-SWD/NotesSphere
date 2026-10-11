import React from 'react';
import './Input.css';

export function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  iconRight: IconRight,
  onRightIconClick,
  error,
  pill = false,
  className = '',
  id,
  required = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`input-wrapper ${error ? 'input-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}
      <div className="input-container">
        {Icon && (
          <span className="input-icon-left">
            <Icon size={18} />
          </span>
        )}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`input-field ${pill ? 'input-pill' : ''} ${Icon ? 'has-left-icon' : ''} ${IconRight ? 'has-right-icon' : ''}`}
          {...props}
        />
        {IconRight && (
          <span className="input-icon-right" onClick={onRightIconClick}>
            <IconRight size={18} />
          </span>
        )}
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}

export default Input;
