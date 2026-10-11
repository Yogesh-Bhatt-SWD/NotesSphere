import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Folder, Search, X } from 'lucide-react';
import './CustomDropdown.css';

export function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  icon: DefaultIcon,
  onAddNew,
  addNewLabel = '+ Create New Option',
  className = '',
  searchable = false,
  searchPlaceholder = 'Search options...',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || null;

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const label = (opt.label || '').toLowerCase();
    const badge = (opt.badge || '').toLowerCase();
    return label.includes(term) || badge.includes(term);
  });

  const getOptionColor = (opt) => {
    if (opt.color) return opt.color;
    switch (opt.label || opt.value) {
      case 'Mindfulness': return '#06B6D4';
      case 'Goals': return '#F59E0B';
      case 'Daily Life': return '#10B981';
      case 'Work & Projects': return '#3B82F6';
      case 'Reflections': return '#8B5CF6';
      case 'Study': return '#6366F1';
      case 'Travel': return '#FF8F6B';
      case 'Health': return '#EC4899';
      case 'Fitness': return '#14B8A6';
      case 'Personal Growth': return '#EAB308';
      default: return '#00B69B';
    }
  };

  return (
    <div className={`custom-dropdown-container ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`custom-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="custom-dropdown-selected-wrap">
          {selectedOption?.icon ? (
            <div className="custom-dropdown-icon-box">
              {React.createElement(selectedOption.icon, { size: 16 })}
            </div>
          ) : selectedOption ? (
            <div
              className="custom-dropdown-color-dot"
              style={{ backgroundColor: getOptionColor(selectedOption) }}
            />
          ) : DefaultIcon ? (
            <div className="custom-dropdown-icon-box">
              <DefaultIcon size={16} />
            </div>
          ) : null}

          <span className="custom-dropdown-label">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          size={18}
          className={`custom-dropdown-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="custom-dropdown-menu" role="listbox">
          {searchable && (
            <div className="custom-dropdown-search-wrap" onClick={(e) => e.stopPropagation()}>
              <Search size={14} className="custom-dropdown-search-icon" />
              <input
                type="text"
                className="custom-dropdown-search-input"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  className="custom-dropdown-search-clear"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          <div className="custom-dropdown-items-list">
            {filteredOptions.length === 0 ? (
              <div className="custom-dropdown-empty">
                No results found for "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                const OptionIcon = opt.icon;
                const dotColor = getOptionColor(opt);

                return (
                  <div
                    key={opt.value}
                    className={`custom-dropdown-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="custom-dropdown-item-left">
                      {OptionIcon ? (
                        <OptionIcon size={16} color={isSelected ? 'var(--primary)' : 'var(--text-secondary)'} />
                      ) : (
                        <span
                          className="custom-dropdown-color-dot"
                          style={{ backgroundColor: dotColor }}
                        />
                      )}
                      <span className="custom-dropdown-item-name">{opt.label}</span>
                      {opt.badge && (
                        <span className="custom-dropdown-badge-pill">{opt.badge}</span>
                      )}
                    </div>

                    {isSelected && (
                      <Check size={16} color="var(--primary)" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Optional inline Add New action */}
          {onAddNew && (
            <div
              className="custom-dropdown-add-action"
              onClick={() => {
                setIsOpen(false);
                onAddNew();
              }}
            >
              <Plus size={15} />
              <span>{addNewLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;
