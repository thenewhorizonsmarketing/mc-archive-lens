import React, { useState } from 'react';
import '../../../styles/advanced-filter.css';

export type DatePreset = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface DateFilterConfig {
  field: string;
  startDate?: Date;
  endDate?: Date;
  preset?: DatePreset;
}

export interface DateFilterProps {
  field: string;
  label: string;
  startDate?: Date;
  endDate?: Date;
  preset?: DatePreset;
  onChange: (config: DateFilterConfig) => void;
  showPresets?: boolean;
}

export const DateFilter: React.FC<DateFilterProps> = ({
  field,
  label,
  startDate,
  endDate,
  preset = 'custom',
  onChange,
  showPresets = true,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>(preset);
  const [customStartDate, setCustomStartDate] = useState<string>(
    startDate ? formatDateForInput(startDate) : ''
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    endDate ? formatDateForInput(endDate) : ''
  );

  const presets: Array<{ value: DatePreset; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const handlePresetChange = (newPreset: DatePreset) => {
    setSelectedPreset(newPreset);
    
    if (newPreset !== 'custom') {
      const dates = getPresetDates(newPreset);
      onChange({
        field,
        startDate: dates.start,
        endDate: dates.end,
        preset: newPreset,
      });
    } else {
      onChange({
        field,
        startDate: customStartDate ? new Date(customStartDate) : undefined,
        endDate: customEndDate ? new Date(customEndDate) : undefined,
        preset: 'custom',
      });
    }
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setCustomStartDate(value);
    } else {
      setCustomEndDate(value);
    }

    onChange({
      field,
      startDate: type === 'start' && value ? new Date(value) : customStartDate ? new Date(customStartDate) : undefined,
      endDate: type === 'end' && value ? new Date(value) : customEndDate ? new Date(customEndDate) : undefined,
      preset: 'custom',
    });
  };

  return (
    <div className="date-filter">
      <label className="date-filter__label">{label}</label>

      {showPresets && (
        <div className="date-filter__presets">
          {presets.map((presetOption) => (
            <button
              key={presetOption.value}
              type="button"
              className={`date-filter__preset-button ${
                selectedPreset === presetOption.value ? 'date-filter__preset-button--active' : ''
              }`}
              onClick={() => handlePresetChange(presetOption.value)}
              aria-pressed={selectedPreset === presetOption.value}
            >
              {presetOption.label}
            </button>
          ))}
        </div>
      )}

      {selectedPreset === 'custom' && (
        <div className="date-filter__custom-range">
          <div className="date-filter__date-input-group">
            <label className="date-filter__date-label">Start Date</label>
            <input
              type="date"
              className="date-filter__date-input"
              value={customStartDate}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              aria-label="Start date"
            />
          </div>

          <div className="date-filter__date-input-group">
            <label className="date-filter__date-label">End Date</label>
            <input
              type="date"
              className="date-filter__date-input"
              value={customEndDate}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              min={customStartDate}
              aria-label="End date"
            />
          </div>
        </div>
      )}

      {selectedPreset !== 'custom' && (
        <div className="date-filter__preset-info">
          {getPresetDescription(selectedPreset)}
        </div>
      )}
    </div>
  );
};

// Helper functions
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPresetDates(preset: DatePreset): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    
    case 'week': {
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { start: startOfWeek, end: endOfWeek };
    }
    
    case 'month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return { start: startOfMonth, end: endOfMonth };
    }
    
    case 'year': {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      endOfYear.setHours(23, 59, 59, 999);
      return { start: startOfYear, end: endOfYear };
    }
    
    default:
      return { start: today, end: today };
  }
}

function getPresetDescription(preset: DatePreset): string {
  const dates = getPresetDates(preset);
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  return `${formatDate(dates.start)} - ${formatDate(dates.end)}`;
}

export default DateFilter;
