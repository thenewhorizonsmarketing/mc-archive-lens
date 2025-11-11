/**
 * ShareDialog Component
 * 
 * Provides UI for sharing filter configurations via URL, clipboard,
 * or native share functionality.
 */

import React, { useState, useEffect } from 'react';
import { getShareManager } from '../../lib/filters/ShareManager';
import type { FilterConfig } from '../../lib/filters/types';
import './ShareDialog.css';

interface ShareDialogProps {
  filters: FilterConfig;
  onClose: () => void;
  metadata?: {
    name?: string;
    description?: string;
  };
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  filters,
  onClose,
  metadata,
}) => {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const manager = getShareManager();

  useEffect(() => {
    // Validate filters
    const validation = manager.validateFilters(filters);
    if (!validation.valid) {
      setError(validation.errors.join('. '));
      return;
    }

    // Generate shareable URL
    const url = manager.generateShareableURL(filters, metadata);
    setShareUrl(url);
  }, [filters, metadata]);

  const handleCopy = async () => {
    const success = await manager.copyToClipboard(filters, metadata);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      setError('Failed to copy to clipboard');
    }
  };

  const handleNativeShare = async () => {
    const success = await manager.shareNative(filters, metadata);
    if (!success) {
      setError('Sharing not available on this device');
    }
  };

  const handleExportJSON = () => {
    const filename = metadata?.name
      ? `${metadata.name.replace(/\s+/g, '-').toLowerCase()}-filters.json`
      : 'search-filters.json';
    manager.exportAsJSON(filters, filename);
  };

  const stats = manager.getShareStatistics();

  return (
    <div className="share-dialog-overlay" onClick={onClose}>
      <div className="share-dialog" onClick={e => e.stopPropagation()}>
        <div className="share-dialog-header">
          <h3>Share Search Filters</h3>
          <button
            className="share-close-button"
            onClick={onClose}
            aria-label="Close share dialog"
          >
            ×
          </button>
        </div>

        {error ? (
          <div className="share-error">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        ) : (
          <>
            {metadata?.name && (
              <div className="share-metadata">
                <h4>{metadata.name}</h4>
                {metadata.description && <p>{metadata.description}</p>}
              </div>
            )}

            <div className="share-url-section">
              <label htmlFor="share-url">Shareable URL</label>
              <div className="share-url-container">
                <input
                  id="share-url"
                  type="text"
                  className="share-url-input"
                  value={shareUrl}
                  readOnly
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
                <button
                  className={`copy-button ${copied ? 'copied' : ''}`}
                  onClick={handleCopy}
                  aria-label="Copy URL to clipboard"
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <p className="share-url-hint">
                Share this URL to let others use your filter configuration
              </p>
            </div>

            <div className="share-actions">
              {stats.hasWebShare && (
                <button
                  className="share-action-button native"
                  onClick={handleNativeShare}
                >
                  <span className="button-icon">📱</span>
                  Share via...
                </button>
              )}

              <button
                className="share-action-button export"
                onClick={() => setShowExport(!showExport)}
              >
                <span className="button-icon">💾</span>
                Export
              </button>
            </div>

            {showExport && (
              <div className="export-options">
                <button
                  className="export-option-button"
                  onClick={handleExportJSON}
                >
                  <span className="button-icon">📄</span>
                  <div className="button-content">
                    <span className="button-title">Export as JSON</span>
                    <span className="button-description">
                      Download filter configuration as a JSON file
                    </span>
                  </div>
                </button>
              </div>
            )}

            <div className="share-info">
              <div className="info-item">
                <span className="info-label">URL Length:</span>
                <span className="info-value">{shareUrl.length} characters</span>
              </div>
              {shareUrl.length > 1500 && (
                <p className="info-warning">
                  ⚠️ Long URLs may not work in all contexts. Consider using export instead.
                </p>
              )}
            </div>
          </>
        )}

        <div className="share-dialog-footer">
          <button className="close-footer-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
