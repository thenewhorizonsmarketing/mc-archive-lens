// Reusable card component for displaying individual records
import React, { useState, useEffect, useRef } from 'react';
import { SearchResult } from '@/lib/database/types';
import './RecordCard.css';

export interface RecordCardProps {
  record: SearchResult;
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  onClick: () => void;
  viewMode?: 'grid' | 'list';
  lazyLoad?: boolean;
  progressiveLoad?: boolean;
}

// Generate a tiny placeholder data URL (1x1 transparent pixel)
const PLACEHOLDER_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Generate a blurred placeholder from image path
const generateBlurPlaceholder = (_imagePath: string): string => {
  // For now, return a solid color placeholder
  // In production, you could generate actual blur hashes server-side
  return PLACEHOLDER_IMAGE;
};

export const RecordCard: React.FC<RecordCardProps> = ({
  record,
  contentType,
  onClick,
  viewMode = 'grid',
  lazyLoad = true,
  progressiveLoad = true
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(!lazyLoad);
  const [currentSrc, setCurrentSrc] = useState<string>(PLACEHOLDER_IMAGE);
  const imgRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get thumbnail path
  const getThumbnailPath = (): string | null => {
    if (record.thumbnailPath) return record.thumbnailPath;
    if (record.thumbnail) return record.thumbnail;
    
    // Type-specific fallbacks
    if (contentType === 'alumni' && 'composite_image_path' in record.data) {
      return record.data.composite_image_path || null;
    }
    if (contentType === 'publication' && 'thumb_path' in record.data) {
      return record.data.thumb_path || null;
    }
    if (contentType === 'photo' && 'image_path' in record.data) {
      return record.data.image_path || null;
    }
    if (contentType === 'faculty' && 'headshot_path' in record.data) {
      return record.data.headshot_path || null;
    }
    
    return null;
  };

  // Get subtitle based on content type
  const getSubtitle = (): string => {
    if (record.subtitle) return record.subtitle;
    
    switch (contentType) {
      case 'alumni':
        if ('class_year' in record.data) {
          return `Class of ${record.data.class_year}`;
        }
        break;
      case 'publication':
        if ('pub_name' in record.data && 'issue_date' in record.data) {
          return `${record.data.pub_name} - ${record.data.issue_date}`;
        }
        break;
      case 'photo':
        if ('year_or_decade' in record.data) {
          return record.data.year_or_decade;
        }
        break;
      case 'faculty':
        if ('title' in record.data) {
          return record.data.title;
        }
        break;
    }
    
    return '';
  };

  // Get metadata display
  const getMetadata = (): string | null => {
    if (viewMode === 'grid') return null; // Don't show metadata in grid view
    
    if (record.metadata?.department) {
      return record.metadata.department;
    }
    
    if (contentType === 'alumni' && 'role' in record.data && record.data.role) {
      return record.data.role;
    }
    
    return null;
  };

  const thumbnailPath = getThumbnailPath();
  const subtitle = getSubtitle();
  const metadata = getMetadata();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || !cardRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01
      }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [lazyLoad]);

  // Progressive image loading
  useEffect(() => {
    if (!isInView || !thumbnailPath || imageError) return;

    if (progressiveLoad) {
      // First load a placeholder
      setCurrentSrc(generateBlurPlaceholder(thumbnailPath));
      
      // Then load the actual image
      const img = new Image();
      img.src = thumbnailPath;
      
      img.onload = () => {
        setCurrentSrc(thumbnailPath);
        setImageLoaded(true);
      };
      
      img.onerror = () => {
        setImageError(true);
      };
    } else {
      // Direct loading
      setCurrentSrc(thumbnailPath);
    }
  }, [isInView, thumbnailPath, imageError, progressiveLoad]);

  // Handle keyboard interaction
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  // Build accessible label
  const buildAriaLabel = (): string => {
    let label = `${record.title}`;
    if (subtitle) {
      label += `, ${subtitle}`;
    }
    if (metadata) {
      label += `, ${metadata}`;
    }
    label += '. Press Enter to view details.';
    return label;
  };

  return (
    <div
      ref={cardRef}
      className={`record-card record-card--${viewMode} record-card--${contentType}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="listitem"
      tabIndex={0}
      aria-label={buildAriaLabel()}
    >
      {/* Thumbnail */}
      <div className="record-card__thumbnail" aria-hidden="true">
        {thumbnailPath && !imageError && isInView ? (
          <>
            <img
              ref={imgRef}
              src={currentSrc}
              alt=""
              className={`record-card__image ${imageLoaded ? 'record-card__image--loaded' : ''}`}
              loading={lazyLoad ? 'lazy' : 'eager'}
              decoding="async"
              onLoad={() => {
                if (currentSrc === thumbnailPath) {
                  setImageLoaded(true);
                }
              }}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="record-card__image-placeholder">
                <div className="record-card__image-spinner" aria-label="Loading image" />
              </div>
            )}
          </>
        ) : !isInView ? (
          <div className="record-card__image-placeholder">
            <div className="record-card__image-spinner" aria-label="Loading image" />
          </div>
        ) : (
          <div className="record-card__image-fallback">
            {contentType === 'alumni' && '👤'}
            {contentType === 'publication' && '📄'}
            {contentType === 'photo' && '🖼️'}
            {contentType === 'faculty' && '👨‍🏫'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="record-card__content" aria-hidden="true">
        <h3 className="record-card__title">{record.title}</h3>
        {subtitle && (
          <p className="record-card__subtitle">{subtitle}</p>
        )}
        {metadata && (
          <p className="record-card__metadata">{metadata}</p>
        )}
        {record.snippet && viewMode === 'list' && (
          <p className="record-card__snippet">{record.snippet}</p>
        )}
      </div>

      {/* Hover indicator */}
      <div className="record-card__hover-indicator" aria-hidden="true">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.5 15L12.5 10L7.5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
