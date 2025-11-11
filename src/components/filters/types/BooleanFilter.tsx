import React, { useState } from 'react';
import '../../../styles/advanced-filter.css';

export interface BooleanFilterConfig {
  field: string;
  value: boolean;
}

export interface BooleanFilterProps {
  field: string;
  label: string;
  value?: boolean;
  onChange: (config: BooleanFilterConfig) => void;
  onLabel?: string;
  offLabel?: string;
  description?: string;
}

export const BooleanFilter: React.FC<BooleanFilterProps> = ({
  field,
  label,
  value = false,
  onChange,
  onLabel = 'Yes',
  offLabel = 'No',
  description,
}) => {
  const [isEnabled, setIsEnabled] = useState(value);

  const handleToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    onChange({
      field,
      value: newValue,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="boolean-filter">
      <div className="boolean-filter__header">
        <label className="boolean-filter__label">{label}</label>
        {description && (
          <p className="boolean-filter__description">{description}</p>
        )}
      </div>

      <div className="boolean-filter__control">
        <div
          className={`boolean-filter__toggle ${
            isEnabled ? 'boolean-filter__toggle--on' : 'boolean-filter__toggle--off'
          }`}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          role="switch"
          aria-checked={isEnabled}
          aria-label={label}
          tabIndex={0}
        >
          <div className="boolean-filter__toggle-track">
            <div className="boolean-filter__toggle-thumb" />
          </div>
          
          <div className="boolean-filter__toggle-labels">
            <span
              className={`boolean-filter__toggle-label boolean-filter__toggle-label--off ${
                !isEnabled ? 'boolean-filter__toggle-label--active' : ''
              }`}
            >
              {offLabel}
            </span>
            <span
              className={`boolean-filter__toggle-label boolean-filter__toggle-label--on ${
                isEnabled ? 'boolean-filter__toggle-label--active' : ''
              }`}
            >
              {onLabel}
            </span>
          </div>
        </div>

        <div className="boolean-filter__status">
          <span className={`boolean-filter__status-badge ${
            isEnabled ? 'boolean-filter__status-badge--on' : 'boolean-filter__status-badge--off'
          }`}>
            {isEnabled ? onLabel : offLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BooleanFilter;
