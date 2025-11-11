import React, { useState, useRef, useEffect } from 'react';
import '../../../styles/advanced-filter.css';

export interface RangeFilterConfig {
  field: string;
  min: number;
  max: number;
  step?: number;
}

export interface RangeFilterProps {
  field: string;
  label: string;
  min: number;
  max: number;
  currentMin?: number;
  currentMax?: number;
  step?: number;
  onChange: (config: RangeFilterConfig) => void;
  formatValue?: (value: number) => string;
}

export const RangeFilter: React.FC<RangeFilterProps> = ({
  field,
  label,
  min,
  max,
  currentMin = min,
  currentMax = max,
  step = 1,
  onChange,
  formatValue = (value) => value.toString(),
}) => {
  const [minValue, setMinValue] = useState(currentMin);
  const [maxValue, setMaxValue] = useState(currentMax);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMinValue(currentMin);
    setMaxValue(currentMax);
  }, [currentMin, currentMax]);

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, maxValue - step);
    setMinValue(newMin);
    onChange({
      field,
      min: newMin,
      max: maxValue,
      step,
    });
  };

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, minValue + step);
    setMaxValue(newMax);
    onChange({
      field,
      min: minValue,
      max: newMax,
      step,
    });
  };

  const getPercentage = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const value = Math.round((min + percentage * (max - min)) / step) * step;
    
    // Determine which handle is closer
    const distToMin = Math.abs(value - minValue);
    const distToMax = Math.abs(value - maxValue);
    
    if (distToMin < distToMax) {
      handleMinChange(value);
    } else {
      handleMaxChange(value);
    }
  };

  const minPercentage = getPercentage(minValue);
  const maxPercentage = getPercentage(maxValue);

  return (
    <div className="range-filter">
      <div className="range-filter__header">
        <label className="range-filter__label">{label}</label>
        <div className="range-filter__values">
          <span className="range-filter__value">{formatValue(minValue)}</span>
          <span className="range-filter__separator">-</span>
          <span className="range-filter__value">{formatValue(maxValue)}</span>
        </div>
      </div>

      <div className="range-filter__slider-container">
        <div
          ref={sliderRef}
          className="range-filter__slider-track"
          onClick={handleSliderClick}
        >
          <div
            className="range-filter__slider-range"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`,
            }}
          />
          
          <div
            className={`range-filter__slider-handle range-filter__slider-handle--min ${
              isDragging === 'min' ? 'range-filter__slider-handle--dragging' : ''
            }`}
            style={{ left: `${minPercentage}%` }}
            onMouseDown={() => setIsDragging('min')}
            onMouseUp={() => setIsDragging(null)}
            role="slider"
            aria-label={`Minimum ${label}`}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={minValue}
            tabIndex={0}
          />
          
          <div
            className={`range-filter__slider-handle range-filter__slider-handle--max ${
              isDragging === 'max' ? 'range-filter__slider-handle--dragging' : ''
            }`}
            style={{ left: `${maxPercentage}%` }}
            onMouseDown={() => setIsDragging('max')}
            onMouseUp={() => setIsDragging(null)}
            role="slider"
            aria-label={`Maximum ${label}`}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={maxValue}
            tabIndex={0}
          />
        </div>

        <div className="range-filter__labels">
          <span className="range-filter__label-min">{formatValue(min)}</span>
          <span className="range-filter__label-max">{formatValue(max)}</span>
        </div>
      </div>

      <div className="range-filter__inputs">
        <div className="range-filter__input-group">
          <label className="range-filter__input-label">Min</label>
          <input
            type="number"
            className="range-filter__input"
            value={minValue}
            min={min}
            max={maxValue - step}
            step={step}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            aria-label={`Minimum ${label} value`}
          />
        </div>

        <div className="range-filter__input-group">
          <label className="range-filter__input-label">Max</label>
          <input
            type="number"
            className="range-filter__input"
            value={maxValue}
            min={minValue + step}
            max={max}
            step={step}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            aria-label={`Maximum ${label} value`}
          />
        </div>
      </div>
    </div>
  );
};

export default RangeFilter;
