import React, { useState } from 'react';
import '../../../styles/advanced-filter.css';

export type TextMatchType = 'contains' | 'equals' | 'startsWith' | 'endsWith';

export interface TextFilterConfig {
  field: string;
  value: string;
  matchType: TextMatchType;
  caseSensitive: boolean;
}

export interface TextFilterProps {
  field: string;
  label: string;
  value?: string;
  matchType?: TextMatchType;
  caseSensitive?: boolean;
  onChange: (config: TextFilterConfig) => void;
  placeholder?: string;
}

export const TextFilter: React.FC<TextFilterProps> = ({
  field,
  label,
  value = '',
  matchType = 'contains',
  caseSensitive = false,
  onChange,
  placeholder = 'Enter text...',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [selectedMatchType, setSelectedMatchType] = useState<TextMatchType>(matchType);
  const [isCaseSensitive, setIsCaseSensitive] = useState(caseSensitive);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange({
      field,
      value: newValue,
      matchType: selectedMatchType,
      caseSensitive: isCaseSensitive,
    });
  };

  const handleMatchTypeChange = (newMatchType: TextMatchType) => {
    setSelectedMatchType(newMatchType);
    onChange({
      field,
      value: inputValue,
      matchType: newMatchType,
      caseSensitive: isCaseSensitive,
    });
  };

  const handleCaseSensitiveToggle = () => {
    const newCaseSensitive = !isCaseSensitive;
    setIsCaseSensitive(newCaseSensitive);
    onChange({
      field,
      value: inputValue,
      matchType: selectedMatchType,
      caseSensitive: newCaseSensitive,
    });
  };

  return (
    <div className="text-filter">
      <label className="text-filter__label">{label}</label>
      
      <div className="text-filter__input-group">
        <input
          type="text"
          className="text-filter__input"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
        />
      </div>

      <div className="text-filter__options">
        <div className="text-filter__match-types">
          <label className="text-filter__option-label">Match Type:</label>
          <div className="text-filter__match-buttons">
            {(['contains', 'equals', 'startsWith', 'endsWith'] as TextMatchType[]).map((type) => (
              <button
                key={type}
                type="button"
                className={`text-filter__match-button ${
                  selectedMatchType === type ? 'text-filter__match-button--active' : ''
                }`}
                onClick={() => handleMatchTypeChange(type)}
                aria-pressed={selectedMatchType === type}
              >
                {type === 'startsWith' ? 'Starts With' : 
                 type === 'endsWith' ? 'Ends With' : 
                 type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="text-filter__case-sensitive">
          <label className="text-filter__toggle-label">
            <input
              type="checkbox"
              className="text-filter__checkbox"
              checked={isCaseSensitive}
              onChange={handleCaseSensitiveToggle}
              aria-label="Case sensitive"
            />
            <span className="text-filter__toggle-switch">
              <span className="text-filter__toggle-slider"></span>
            </span>
            <span className="text-filter__toggle-text">Case Sensitive</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default TextFilter;
