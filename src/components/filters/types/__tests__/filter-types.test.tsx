import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextFilter } from '../TextFilter';
import { DateFilter } from '../DateFilter';
import { RangeFilter } from '../RangeFilter';
import { BooleanFilter } from '../BooleanFilter';

describe('Filter Types', () => {
  describe('TextFilter', () => {
    it('renders with label and input', () => {
      const onChange = vi.fn();
      render(<TextFilter field="test" label="Test Filter" onChange={onChange} />);
      
      expect(screen.getByText('Test Filter')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('calls onChange when input changes', () => {
      const onChange = vi.fn();
      render(<TextFilter field="test" label="Test Filter" onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test value' } });
      
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          field: 'test',
          value: 'test value',
        })
      );
    });

    it('updates match type when button clicked', () => {
      const onChange = vi.fn();
      render(<TextFilter field="test" label="Test Filter" onChange={onChange} />);
      
      const equalsButton = screen.getByText('Equals');
      fireEvent.click(equalsButton);
      
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          matchType: 'equals',
        })
      );
    });
  });

  describe('DateFilter', () => {
    it('renders with label and preset buttons', () => {
      const onChange = vi.fn();
      render(<DateFilter field="test" label="Date Filter" onChange={onChange} />);
      
      expect(screen.getByText('Date Filter')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('This Week')).toBeInTheDocument();
    });

    it('calls onChange when preset selected', () => {
      const onChange = vi.fn();
      render(<DateFilter field="test" label="Date Filter" onChange={onChange} />);
      
      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);
      
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          field: 'test',
          preset: 'today',
        })
      );
    });
  });

  describe('RangeFilter', () => {
    it('renders with label and values', () => {
      const onChange = vi.fn();
      render(
        <RangeFilter
          field="test"
          label="Range Filter"
          min={0}
          max={100}
          onChange={onChange}
        />
      );
      
      expect(screen.getByText('Range Filter')).toBeInTheDocument();
    });

    it('calls onChange when input changes', () => {
      const onChange = vi.fn();
      render(
        <RangeFilter
          field="test"
          label="Range Filter"
          min={0}
          max={100}
          currentMin={20}
          currentMax={80}
          onChange={onChange}
        />
      );
      
      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '30' } });
      
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          field: 'test',
          min: 30,
        })
      );
    });
  });

  describe('BooleanFilter', () => {
    it('renders with label and toggle', () => {
      const onChange = vi.fn();
      render(<BooleanFilter field="test" label="Boolean Filter" onChange={onChange} />);
      
      expect(screen.getByText('Boolean Filter')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('calls onChange when toggle clicked', () => {
      const onChange = vi.fn();
      render(<BooleanFilter field="test" label="Boolean Filter" onChange={onChange} />);
      
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
      
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          field: 'test',
          value: true,
        })
      );
    });

    it('toggles state on click', () => {
      const onChange = vi.fn();
      render(<BooleanFilter field="test" label="Boolean Filter" onChange={onChange} />);
      
      const toggle = screen.getByRole('switch');
      
      // First click - turn on
      fireEvent.click(toggle);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: true })
      );
      
      // Second click - turn off
      fireEvent.click(toggle);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: false })
      );
    });
  });
});
