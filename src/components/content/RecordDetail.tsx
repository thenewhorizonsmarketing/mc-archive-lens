// Modal component for displaying full record details
import React, { useEffect } from 'react';
import { SearchResult } from '@/lib/database/types';
import './RecordDetail.css';

export interface RecordDetailProps {
  record: SearchResult;
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  showNavigation?: boolean;
}

export const RecordDetail: React.FC<RecordDetailProps> = ({
  record,
  contentType,
  onClose,
  onNavigate,
  showNavigation = false
}) => {
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (onNavigate) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onNavigate('prev');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          onNavigate('next');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Render content based on type
  const renderContent = () => {
    switch (contentType) {
      case 'alumni':
        return renderAlumniContent();
      case 'publication':
        return renderPublicationContent();
      case 'photo':
        return renderPhotoContent();
      case 'faculty':
        return renderFacultyContent();
      default:
        return null;
    }
  };

  const renderAlumniContent = () => {
    const data = record.data as any;
    return (
      <>
        <div className="record-detail__image-container">
          {(data.composite_image_path || data.portrait_path) ? (
            <img
              src={data.composite_image_path || data.portrait_path}
              alt={record.title}
              className="record-detail__image"
            />
          ) : (
            <div className="record-detail__image-fallback">👤</div>
          )}
        </div>
        <div className="record-detail__info">
          <div className="record-detail__field">
            <span className="record-detail__label">Name:</span>
            <span className="record-detail__value">{data.full_name}</span>
          </div>
          {data.class_year && (
            <div className="record-detail__field">
              <span className="record-detail__label">Class Year:</span>
              <span className="record-detail__value">{data.class_year}</span>
            </div>
          )}
          {data.role && (
            <div className="record-detail__field">
              <span className="record-detail__label">Role:</span>
              <span className="record-detail__value">{data.role}</span>
            </div>
          )}
          {data.caption && (
            <div className="record-detail__field record-detail__field--full">
              <span className="record-detail__label">Caption:</span>
              <span className="record-detail__value">{data.caption}</span>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderPublicationContent = () => {
    const data = record.data as any;
    return (
      <>
        <div className="record-detail__image-container">
          {data.thumb_path ? (
            <img
              src={data.thumb_path}
              alt={record.title}
              className="record-detail__image"
            />
          ) : (
            <div className="record-detail__image-fallback">📄</div>
          )}
        </div>
        <div className="record-detail__info">
          <div className="record-detail__field record-detail__field--full">
            <span className="record-detail__label">Title:</span>
            <span className="record-detail__value">{data.title}</span>
          </div>
          {data.pub_name && (
            <div className="record-detail__field">
              <span className="record-detail__label">Publication:</span>
              <span className="record-detail__value">{data.pub_name}</span>
            </div>
          )}
          {data.issue_date && (
            <div className="record-detail__field">
              <span className="record-detail__label">Date:</span>
              <span className="record-detail__value">{data.issue_date}</span>
            </div>
          )}
          {data.volume_issue && (
            <div className="record-detail__field">
              <span className="record-detail__label">Volume/Issue:</span>
              <span className="record-detail__value">{data.volume_issue}</span>
            </div>
          )}
          {data.description && (
            <div className="record-detail__field record-detail__field--full">
              <span className="record-detail__label">Description:</span>
              <span className="record-detail__value">{data.description}</span>
            </div>
          )}
          {data.pdf_path && (
            <div className="record-detail__actions">
              <a
                href={data.pdf_path}
                target="_blank"
                rel="noopener noreferrer"
                className="record-detail__button"
              >
                View PDF
              </a>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderPhotoContent = () => {
    const data = record.data as any;
    return (
      <>
        <div className="record-detail__image-container record-detail__image-container--large">
          {data.image_path ? (
            <img
              src={data.image_path}
              alt={record.title}
              className="record-detail__image record-detail__image--photo"
            />
          ) : (
            <div className="record-detail__image-fallback">🖼️</div>
          )}
        </div>
        <div className="record-detail__info">
          {data.title && (
            <div className="record-detail__field record-detail__field--full">
              <span className="record-detail__label">Title:</span>
              <span className="record-detail__value">{data.title}</span>
            </div>
          )}
          {data.collection && (
            <div className="record-detail__field">
              <span className="record-detail__label">Collection:</span>
              <span className="record-detail__value">{data.collection}</span>
            </div>
          )}
          {data.year_or_decade && (
            <div className="record-detail__field">
              <span className="record-detail__label">Year:</span>
              <span className="record-detail__value">{data.year_or_decade}</span>
            </div>
          )}
          {data.caption && (
            <div className="record-detail__field record-detail__field--full">
              <span className="record-detail__label">Caption:</span>
              <span className="record-detail__value">{data.caption}</span>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderFacultyContent = () => {
    const data = record.data as any;
    return (
      <>
        <div className="record-detail__image-container">
          {data.headshot_path ? (
            <img
              src={data.headshot_path}
              alt={record.title}
              className="record-detail__image"
            />
          ) : (
            <div className="record-detail__image-fallback">👨‍🏫</div>
          )}
        </div>
        <div className="record-detail__info">
          <div className="record-detail__field">
            <span className="record-detail__label">Name:</span>
            <span className="record-detail__value">{data.full_name}</span>
          </div>
          {data.title && (
            <div className="record-detail__field">
              <span className="record-detail__label">Title:</span>
              <span className="record-detail__value">{data.title}</span>
            </div>
          )}
          {data.department && (
            <div className="record-detail__field">
              <span className="record-detail__label">Department:</span>
              <span className="record-detail__value">{data.department}</span>
            </div>
          )}
          {data.email && (
            <div className="record-detail__field">
              <span className="record-detail__label">Email:</span>
              <span className="record-detail__value">
                <a href={`mailto:${data.email}`}>{data.email}</a>
              </span>
            </div>
          )}
          {data.phone && (
            <div className="record-detail__field">
              <span className="record-detail__label">Phone:</span>
              <span className="record-detail__value">
                <a href={`tel:${data.phone}`}>{data.phone}</a>
              </span>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div
      className="record-detail-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-detail-title"
      aria-describedby="record-detail-content"
    >
      <div className="record-detail">
        {/* Screen reader announcement */}
        <div className="sr-only" role="status" aria-live="assertive">
          Viewing details for {record.title}. Press Escape to close.
          {showNavigation && ' Use arrow keys to navigate between records.'}
        </div>

        {/* Header */}
        <div className="record-detail__header">
          <h2 id="record-detail-title" className="record-detail__title">
            {record.title}
          </h2>
          <button
            className="record-detail__close"
            onClick={onClose}
            aria-label="Close detail view and return to list"
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div id="record-detail-content" className="record-detail__content">
          {renderContent()}
        </div>

        {/* Navigation */}
        {showNavigation && onNavigate && (
          <nav className="record-detail__navigation" aria-label="Record navigation">
            <button
              className="record-detail__nav-button record-detail__nav-button--prev"
              onClick={() => onNavigate('prev')}
              aria-label="Go to previous record. Press left arrow key."
              type="button"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="record-detail__nav-button record-detail__nav-button--next"
              onClick={() => onNavigate('next')}
              aria-label="Go to next record. Press right arrow key."
              type="button"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};
