/**
 * Export Dialog Component
 * 
 * Modal dialog for configuring and executing data exports with MC Law blue styling.
 * Supports CSV and JSON formats with progress tracking and success feedback.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ExportManager, ExportFormat, ExportConfig, ExportProgress, ExportResult } from '../../lib/filters/ExportManager';
import { FilterConfig } from '../../lib/filters/types';
import '../../styles/advanced-filter.css';

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  filters?: FilterConfig;
  contentType?: string;
  className?: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  data,
  filters,
  contentType = 'data',
  className = ''
}) => {
  const [exportManager] = useState(() => new ExportManager());
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [prettyPrint, setPrettyPrint] = useState(true);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [customFilename, setCustomFilename] = useState('');
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<number>(0);

  // Initialize available fields
  useEffect(() => {
    if (isOpen && data.length > 0) {
      const fields = exportManager.getAvailableFields(data);
      setAvailableFields(fields);
      setSelectedFields(fields); // Select all by default
      
      // Estimate size
      const size = exportManager.estimateExportSize(data, format);
      setEstimatedSize(size);
    }
  }, [isOpen, data, format, exportManager]);

  // Update estimated size when format changes
  useEffect(() => {
    if (data.length > 0) {
      const size = exportManager.estimateExportSize(data, format);
      setEstimatedSize(size);
    }
  }, [format, data, exportManager]);

  // Handle export
  const handleExport = useCallback(async () => {
    setProgress({
      total: data.length,
      current: 0,
      percentage: 0,
      status: 'preparing',
      message: 'Preparing export...'
    });
    setResult(null);

    const config: ExportConfig = {
      format,
      includeHeaders: format === 'csv' ? includeHeaders : undefined,
      prettyPrint: format === 'json' ? prettyPrint : undefined,
      fields: selectedFields.length > 0 && selectedFields.length < availableFields.length 
        ? selectedFields 
        : undefined,
      filename: customFilename || undefined
    };

    const exportResult = filters
      ? await exportManager.exportFilteredResults(data, filters, config, setProgress)
      : await exportManager.export(data, config, setProgress);

    setResult(exportResult);
  }, [data, format, includeHeaders, prettyPrint, selectedFields, availableFields, customFilename, filters, exportManager]);

  // Handle field selection
  const toggleField = useCallback((field: string) => {
    setSelectedFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  }, []);

  const selectAllFields = useCallback(() => {
    setSelectedFields(availableFields);
  }, [availableFields]);

  const deselectAllFields = useCallback(() => {
    setSelectedFields([]);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    if (progress?.status === 'exporting') {
      // Don't close while exporting
      return;
    }
    
    // Reset state
    setProgress(null);
    setResult(null);
    setCustomFilename('');
    onClose();
  }, [progress, onClose]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="filter-modal-overlay" onClick={handleClose}>
      <div 
        className={`filter-modal export-dialog ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="export-dialog-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="filter-modal-header">
          <h2 id="export-dialog-title" className="filter-modal-title">
            Export Data
          </h2>
          <button
            className="filter-modal-close"
            onClick={handleClose}
            aria-label="Close export dialog"
            disabled={progress?.status === 'exporting'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="filter-modal-content">
          {/* Show result if complete */}
          {result && (
            <div className={`export-result ${result.success ? 'export-success' : 'export-error'}`}>
              {result.success ? (
                <>
                  <div className="export-result-icon">✓</div>
                  <h3 className="export-result-title">Export Successful!</h3>
                  <div className="export-result-details">
                    <p><strong>File:</strong> {result.filename}</p>
                    <p><strong>Records:</strong> {result.recordCount.toLocaleString()}</p>
                    <p><strong>Size:</strong> {formatFileSize(result.size)}</p>
                    <p><strong>Format:</strong> {result.format.toUpperCase()}</p>
                  </div>
                  <button
                    className="filter-button filter-button-primary"
                    onClick={handleClose}
                    style={{ marginTop: '20px' }}
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <div className="export-result-icon export-error-icon">✗</div>
                  <h3 className="export-result-title">Export Failed</h3>
                  <p className="export-error-message">{result.error}</p>
                  <button
                    className="filter-button filter-button-primary"
                    onClick={() => setResult(null)}
                    style={{ marginTop: '20px' }}
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          )}

          {/* Show progress if exporting */}
          {progress && !result && (
            <div className="export-progress">
              <h3 className="export-progress-title">
                {progress.status === 'preparing' && 'Preparing Export...'}
                {progress.status === 'exporting' && 'Exporting Data...'}
                {progress.status === 'complete' && 'Export Complete!'}
                {progress.status === 'error' && 'Export Error'}
              </h3>
              
              <div className="export-progress-bar-container">
                <div 
                  className="export-progress-bar"
                  style={{ width: `${progress.percentage}%` }}
                  role="progressbar"
                  aria-valuenow={progress.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              
              <div className="export-progress-text">
                {progress.message}
              </div>
              
              <div className="export-progress-stats">
                {progress.current} / {progress.total} records ({progress.percentage}%)
              </div>
            </div>
          )}

          {/* Show configuration if not exporting */}
          {!progress && !result && (
            <>
              {/* Data Info */}
              <div className="export-info">
                <p>
                  <strong>Records to export:</strong> {data.length.toLocaleString()}
                </p>
                <p>
                  <strong>Estimated size:</strong> {formatFileSize(estimatedSize)}
                </p>
                {filters && (
                  <p className="export-info-filters">
                    <strong>Active filters:</strong> {
                      (filters.textFilters?.length || 0) +
                      (filters.dateFilters?.length || 0) +
                      (filters.rangeFilters?.length || 0) +
                      (filters.booleanFilters?.length || 0)
                    } filter(s) applied
                  </p>
                )}
              </div>

              {/* Format Selection */}
              <div className="export-section">
                <label className="export-label">Export Format</label>
                <div className="export-format-options">
                  <button
                    className={`export-format-button ${format === 'csv' ? 'active' : ''}`}
                    onClick={() => setFormat('csv')}
                    aria-pressed={format === 'csv'}
                  >
                    <span className="export-format-icon">📄</span>
                    <span className="export-format-name">CSV</span>
                    <span className="export-format-desc">Comma-separated values</span>
                  </button>
                  
                  <button
                    className={`export-format-button ${format === 'json' ? 'active' : ''}`}
                    onClick={() => setFormat('json')}
                    aria-pressed={format === 'json'}
                  >
                    <span className="export-format-icon">{ }</span>
                    <span className="export-format-name">JSON</span>
                    <span className="export-format-desc">JavaScript Object Notation</span>
                  </button>
                </div>
              </div>

              {/* Format-specific options */}
              <div className="export-section">
                <label className="export-label">Options</label>
                
                {format === 'csv' && (
                  <div className="export-checkbox">
                    <input
                      type="checkbox"
                      id="include-headers"
                      checked={includeHeaders}
                      onChange={(e) => setIncludeHeaders(e.target.checked)}
                    />
                    <label htmlFor="include-headers">Include column headers</label>
                  </div>
                )}
                
                {format === 'json' && (
                  <div className="export-checkbox">
                    <input
                      type="checkbox"
                      id="pretty-print"
                      checked={prettyPrint}
                      onChange={(e) => setPrettyPrint(e.target.checked)}
                    />
                    <label htmlFor="pretty-print">Pretty print (formatted with indentation)</label>
                  </div>
                )}
              </div>

              {/* Field Selection */}
              <div className="export-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label className="export-label">
                    Fields to Export ({selectedFields.length} of {availableFields.length})
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="filter-button-link"
                      onClick={selectAllFields}
                      disabled={selectedFields.length === availableFields.length}
                    >
                      Select All
                    </button>
                    <button
                      className="filter-button-link"
                      onClick={deselectAllFields}
                      disabled={selectedFields.length === 0}
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                
                <div className="export-fields-list">
                  {availableFields.map(field => (
                    <div key={field} className="export-field-item">
                      <input
                        type="checkbox"
                        id={`field-${field}`}
                        checked={selectedFields.includes(field)}
                        onChange={() => toggleField(field)}
                      />
                      <label htmlFor={`field-${field}`}>{field}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Filename */}
              <div className="export-section">
                <label className="export-label" htmlFor="custom-filename">
                  Custom Filename (optional)
                </label>
                <input
                  type="text"
                  id="custom-filename"
                  className="export-input"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder={`export_${new Date().toISOString().slice(0, 10)}.${format}`}
                />
                <p className="export-hint">
                  Leave empty to use automatic filename with timestamp
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!progress && !result && (
          <div className="filter-modal-footer">
            <button
              className="filter-button filter-button-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              className="filter-button filter-button-primary"
              onClick={handleExport}
              disabled={data.length === 0 || selectedFields.length === 0}
            >
              Export {data.length.toLocaleString()} Record{data.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportDialog;
