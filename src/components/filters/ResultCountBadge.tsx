/**
 * Result Count Badge Component
 * 
 * Displays result count in a gold badge with loading skeleton support.
 * Updates dynamically when filter changes occur.
 */

import React from 'react';
import '../../styles/advanced-filter.css';

export interface ResultCountBadgeProps {
  count: number;
  loading?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showZero?: boolean;
}

export const ResultCountBadge: React.FC<ResultCountBadgeProps> = ({
  count,
  loading = false,
  className = '',
  size = 'small',
  showZero = true
}) => {
  // Don't show badge if count is 0 and showZero is false
  if (count === 0 && !showZero && !loading) {
    return null;
  }

  // Format count for display (e.g., 1000 -> 1K)
  const formatCount = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Size-specific styles
  const sizeStyles = {
    small: {
      fontSize: '0.75rem',
      padding: '4px 8px',
      minWidth: '24px'
    },
    medium: {
      fontSize: '0.875rem',
      padding: '6px 12px',
      minWidth: '32px'
    },
    large: {
      fontSize: '1rem',
      padding: '8px 16px',
      minWidth: '40px'
    }
  };

  const style = sizeStyles[size];

  // Loading skeleton
  if (loading) {
    return (
      <div
        className={`filter-badge filter-skeleton ${className}`}
        style={{
          ...style,
          width: '40px',
          height: style.padding.split(' ')[0]
        }}
        role="status"
        aria-label="Loading count"
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <span
      className={`filter-badge ${className}`}
      style={style}
      role="status"
      aria-label={`${count} result${count !== 1 ? 's' : ''}`}
      title={`${count.toLocaleString()} result${count !== 1 ? 's' : ''}`}
    >
      {formatCount(count)}
    </span>
  );
};

/**
 * Result Count Badge with Auto-Update
 * 
 * Automatically fetches and updates count when filter changes.
 */
export interface AutoUpdateResultCountBadgeProps extends Omit<ResultCountBadgeProps, 'count' | 'loading'> {
  filterValue: string;
  onCountFetch: (filterValue: string) => Promise<number>;
  debounceMs?: number;
}

export const AutoUpdateResultCountBadge: React.FC<AutoUpdateResultCountBadgeProps> = ({
  filterValue,
  onCountFetch,
  debounceMs = 200,
  ...badgeProps
}) => {
  const [count, setCount] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set loading state
    setLoading(true);

    // Debounce the count fetch
    timeoutRef.current = setTimeout(async () => {
      try {
        const newCount = await onCountFetch(filterValue);
        setCount(newCount);
      } catch (error) {
        console.error('Failed to fetch result count:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filterValue, onCountFetch, debounceMs]);

  return <ResultCountBadge count={count} loading={loading} {...badgeProps} />;
};

/**
 * Multiple Result Count Badges Container
 * 
 * Displays multiple count badges in a row with proper spacing.
 */
export interface ResultCountBadgesProps {
  counts: Array<{
    label: string;
    count: number;
    loading?: boolean;
  }>;
  className?: string;
}

export const ResultCountBadges: React.FC<ResultCountBadgesProps> = ({
  counts,
  className = ''
}) => {
  return (
    <div
      className={`filter-count-badges ${className}`}
      style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}
    >
      {counts.map((item, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span
            style={{
              color: 'var(--filter-text-muted)',
              fontSize: '0.875rem'
            }}
          >
            {item.label}:
          </span>
          <ResultCountBadge
            count={item.count}
            loading={item.loading}
            size="small"
          />
        </div>
      ))}
    </div>
  );
};

export default ResultCountBadge;
