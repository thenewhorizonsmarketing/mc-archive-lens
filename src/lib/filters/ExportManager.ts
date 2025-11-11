/**
 * Export Manager for Advanced Filter System
 * 
 * Handles CSV and JSON export of filtered search results with progress tracking.
 * Supports customizable export configurations and field selection.
 */

import { FilterConfig } from './types';

export type ExportFormat = 'csv' | 'json';

export interface ExportConfig {
  format: ExportFormat;
  includeHeaders?: boolean;
  fields?: string[];
  filename?: string;
  dateFormat?: 'iso' | 'locale' | 'custom';
  customDateFormat?: string;
  prettyPrint?: boolean; // For JSON
  delimiter?: string; // For CSV (default: comma)
}

export interface ExportProgress {
  total: number;
  current: number;
  percentage: number;
  status: 'preparing' | 'exporting' | 'complete' | 'error';
  message?: string;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  recordCount: number;
  format: ExportFormat;
  size: number; // in bytes
  error?: string;
}

export class ExportManager {
  private defaultConfig: Partial<ExportConfig> = {
    includeHeaders: true,
    dateFormat: 'iso',
    prettyPrint: true,
    delimiter: ','
  };

  /**
   * Export filtered results to CSV format
   */
  async exportToCSV(
    data: any[],
    config: Partial<ExportConfig> = {},
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    const finalConfig = { ...this.defaultConfig, ...config, format: 'csv' as ExportFormat };
    
    try {
      // Report preparation
      onProgress?.({
        total: data.length,
        current: 0,
        percentage: 0,
        status: 'preparing',
        message: 'Preparing CSV export...'
      });

      // Determine fields to export
      const fields = finalConfig.fields || this.extractFields(data);
      
      if (fields.length === 0) {
        throw new Error('No fields available for export');
      }

      // Build CSV content
      let csvContent = '';
      const delimiter = finalConfig.delimiter || ',';

      // Add headers
      if (finalConfig.includeHeaders) {
        csvContent += fields.map(field => this.escapeCSVValue(field)).join(delimiter) + '\n';
      }

      // Add data rows with progress tracking
      const batchSize = 100;
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const values = fields.map(field => {
          const value = this.getNestedValue(row, field);
          return this.formatValueForCSV(value, finalConfig);
        });
        
        csvContent += values.map(v => this.escapeCSVValue(v)).join(delimiter) + '\n';

        // Report progress every batch
        if (i % batchSize === 0 || i === data.length - 1) {
          onProgress?.({
            total: data.length,
            current: i + 1,
            percentage: Math.round(((i + 1) / data.length) * 100),
            status: 'exporting',
            message: `Exporting record ${i + 1} of ${data.length}...`
          });
        }
      }

      // Generate filename
      const filename = finalConfig.filename || this.generateFilename('csv');

      // Trigger download
      this.downloadFile(csvContent, filename, 'text/csv');

      // Report completion
      const result: ExportResult = {
        success: true,
        filename,
        recordCount: data.length,
        format: 'csv',
        size: new Blob([csvContent]).size
      };

      onProgress?.({
        total: data.length,
        current: data.length,
        percentage: 100,
        status: 'complete',
        message: `Successfully exported ${data.length} records`
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      onProgress?.({
        total: data.length,
        current: 0,
        percentage: 0,
        status: 'error',
        message: errorMessage
      });

      return {
        success: false,
        filename: '',
        recordCount: 0,
        format: 'csv',
        size: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Export filtered results to JSON format
   */
  async exportToJSON(
    data: any[],
    config: Partial<ExportConfig> = {},
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    const finalConfig = { ...this.defaultConfig, ...config, format: 'json' as ExportFormat };
    
    try {
      // Report preparation
      onProgress?.({
        total: data.length,
        current: 0,
        percentage: 0,
        status: 'preparing',
        message: 'Preparing JSON export...'
      });

      // Filter fields if specified
      let exportData = data;
      if (finalConfig.fields && finalConfig.fields.length > 0) {
        exportData = data.map(item => {
          const filtered: any = {};
          finalConfig.fields!.forEach(field => {
            const value = this.getNestedValue(item, field);
            this.setNestedValue(filtered, field, value);
          });
          return filtered;
        });
      }

      // Format dates
      exportData = exportData.map((item, index) => {
        const formatted = this.formatDatesInObject(item, finalConfig);
        
        // Report progress
        if (index % 100 === 0 || index === data.length - 1) {
          onProgress?.({
            total: data.length,
            current: index + 1,
            percentage: Math.round(((index + 1) / data.length) * 100),
            status: 'exporting',
            message: `Processing record ${index + 1} of ${data.length}...`
          });
        }
        
        return formatted;
      });

      // Convert to JSON string
      const jsonContent = finalConfig.prettyPrint
        ? JSON.stringify(exportData, null, 2)
        : JSON.stringify(exportData);

      // Generate filename
      const filename = finalConfig.filename || this.generateFilename('json');

      // Trigger download
      this.downloadFile(jsonContent, filename, 'application/json');

      // Report completion
      const result: ExportResult = {
        success: true,
        filename,
        recordCount: data.length,
        format: 'json',
        size: new Blob([jsonContent]).size
      };

      onProgress?.({
        total: data.length,
        current: data.length,
        percentage: 100,
        status: 'complete',
        message: `Successfully exported ${data.length} records`
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      onProgress?.({
        total: data.length,
        current: 0,
        percentage: 0,
        status: 'error',
        message: errorMessage
      });

      return {
        success: false,
        filename: '',
        recordCount: 0,
        format: 'json',
        size: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Export data with automatic format detection
   */
  async export(
    data: any[],
    config: ExportConfig,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    if (config.format === 'csv') {
      return this.exportToCSV(data, config, onProgress);
    } else if (config.format === 'json') {
      return this.exportToJSON(data, config, onProgress);
    } else {
      throw new Error(`Unsupported export format: ${config.format}`);
    }
  }

  /**
   * Export filtered results (convenience method)
   */
  async exportFilteredResults(
    data: any[],
    filters: FilterConfig,
    config: Partial<ExportConfig> = {},
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    // Add filter metadata to export
    const metadata = {
      exportDate: new Date().toISOString(),
      filters: this.serializeFilters(filters),
      recordCount: data.length
    };

    // For JSON, include metadata
    if (config.format === 'json') {
      const dataWithMetadata = {
        metadata,
        data
      };
      return this.exportToJSON([dataWithMetadata], config, onProgress);
    }

    // For CSV, just export the data
    return this.exportToCSV(data, config, onProgress);
  }

  /**
   * Get available fields from data
   */
  getAvailableFields(data: any[]): string[] {
    if (data.length === 0) {
      return [];
    }

    return this.extractFields(data);
  }

  /**
   * Estimate export size
   */
  estimateExportSize(data: any[], format: ExportFormat): number {
    if (data.length === 0) {
      return 0;
    }

    // Sample first 10 records
    const sample = data.slice(0, Math.min(10, data.length));
    
    if (format === 'csv') {
      const csvSample = this.convertToCSVPreview(sample);
      const avgSize = new Blob([csvSample]).size / sample.length;
      return Math.round(avgSize * data.length);
    } else {
      const jsonSample = JSON.stringify(sample);
      const avgSize = new Blob([jsonSample]).size / sample.length;
      return Math.round(avgSize * data.length);
    }
  }

  // Private helper methods

  private extractFields(data: any[]): string[] {
    if (data.length === 0) {
      return [];
    }

    const fields = new Set<string>();
    
    // Extract fields from first few records
    const sampleSize = Math.min(5, data.length);
    for (let i = 0; i < sampleSize; i++) {
      this.extractFieldsRecursive(data[i], '', fields);
    }

    return Array.from(fields).sort();
  }

  private extractFieldsRecursive(obj: any, prefix: string, fields: Set<string>): void {
    if (obj === null || obj === undefined) {
      return;
    }

    if (typeof obj !== 'object' || obj instanceof Date) {
      if (prefix) {
        fields.add(prefix);
      }
      return;
    }

    if (Array.isArray(obj)) {
      if (prefix) {
        fields.add(prefix);
      }
      return;
    }

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        this.extractFieldsRecursive(obj[key], fieldPath, fields);
      }
    }
  }

  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return null;
      }
      value = value[key];
    }
    
    return value;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  private formatValueForCSV(value: any, config: ExportConfig): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return this.formatDate(value, config);
    }

    if (Array.isArray(value)) {
      return value.join('; ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  private escapeCSVValue(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    
    // Check if value needs escaping
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  private formatDate(date: Date, config: ExportConfig): string {
    switch (config.dateFormat) {
      case 'iso':
        return date.toISOString();
      
      case 'locale':
        return date.toLocaleString();
      
      case 'custom':
        if (config.customDateFormat) {
          return this.formatDateCustom(date, config.customDateFormat);
        }
        return date.toISOString();
      
      default:
        return date.toISOString();
    }
  }

  private formatDateCustom(date: Date, format: string): string {
    // Simple date formatting (can be extended)
    const replacements: Record<string, string> = {
      'YYYY': date.getFullYear().toString(),
      'MM': String(date.getMonth() + 1).padStart(2, '0'),
      'DD': String(date.getDate()).padStart(2, '0'),
      'HH': String(date.getHours()).padStart(2, '0'),
      'mm': String(date.getMinutes()).padStart(2, '0'),
      'ss': String(date.getSeconds()).padStart(2, '0')
    };

    let result = format;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(key, value);
    }

    return result;
  }

  private formatDatesInObject(obj: any, config: ExportConfig): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (obj instanceof Date) {
      return this.formatDate(obj, config);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.formatDatesInObject(item, config));
    }

    if (typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = this.formatDatesInObject(obj[key], config);
        }
      }
      return result;
    }

    return obj;
  }

  private generateFilename(extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `export_${timestamp}.${extension}`;
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }

  private convertToCSVPreview(data: any[]): string {
    if (data.length === 0) {
      return '';
    }

    const fields = this.extractFields(data);
    let csv = fields.join(',') + '\n';
    
    data.forEach(row => {
      const values = fields.map(field => {
        const value = this.getNestedValue(row, field);
        return this.escapeCSVValue(String(value || ''));
      });
      csv += values.join(',') + '\n';
    });

    return csv;
  }

  private serializeFilters(filters: FilterConfig): any {
    return {
      type: filters.type,
      operator: filters.operator,
      textFilters: filters.textFilters?.length || 0,
      dateFilters: filters.dateFilters?.length || 0,
      rangeFilters: filters.rangeFilters?.length || 0,
      booleanFilters: filters.booleanFilters?.length || 0,
      customFilters: filters.customFilters?.length || 0
    };
  }
}

export default ExportManager;
