# Export Manager Documentation

## Overview

The Export Manager provides comprehensive data export functionality for the Advanced Filter System. It supports CSV and JSON formats with progress tracking, field selection, and MC Law blue styling.

## Features

### ✅ Supported Formats
- **CSV**: Comma-separated values with customizable headers and delimiters
- **JSON**: JavaScript Object Notation with optional pretty printing

### ✅ Core Capabilities
- Real-time progress tracking with percentage display
- Customizable field selection
- Automatic filename generation with timestamps
- Filter metadata inclusion
- Date formatting options
- Large dataset handling with batch processing
- Error handling and recovery

### ✅ MC Law Styling
- MC Blue (#0C2340) primary background
- MC Gold (#C99700) accents and progress indicators
- White (#FFFFFF) text for maximum contrast
- Smooth animations and transitions

## Usage

### Basic Export

```typescript
import { ExportManager } from '@/lib/filters/ExportManager';
import { ExportDialog } from '@/components/filters/ExportDialog';

// Initialize the export manager
const exportManager = new ExportManager();

// Export to CSV
const result = await exportManager.exportToCSV(
  data,
  {
    includeHeaders: true,
    filename: 'alumni_export.csv'
  },
  (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
  }
);

// Export to JSON
const result = await exportManager.exportToJSON(
  data,
  {
    prettyPrint: true,
    filename: 'alumni_export.json'
  },
  (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
  }
);
```

### Using the Export Dialog Component

```typescript
import { ExportDialog } from '@/components/filters/ExportDialog';

function MyComponent() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [data, setData] = useState([]);

  return (
    <>
      <button onClick={() => setIsExportOpen(true)}>
        Export Data
      </button>

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={data}
        filters={activeFilters}
        contentType="alumni"
      />
    </>
  );
}
```

### Export with Filtered Results

```typescript
import { ExportManager } from '@/lib/filters/ExportManager';
import { FilterConfig } from '@/lib/filters/types';

const exportManager = new ExportManager();

const filters: FilterConfig = {
  type: 'alumni',
  operator: 'AND',
  textFilters: [
    {
      field: 'state',
      value: 'MS',
      matchType: 'equals',
      caseSensitive: false
    }
  ]
};

// Export with filter metadata
const result = await exportManager.exportFilteredResults(
  filteredData,
  filters,
  {
    format: 'json',
    prettyPrint: true
  },
  (progress) => {
    console.log(`Exporting: ${progress.message}`);
  }
);
```

## API Reference

### ExportManager Class

#### Methods

##### `exportToCSV(data, config, onProgress)`

Export data to CSV format.

**Parameters:**
- `data: any[]` - Array of records to export
- `config: Partial<ExportConfig>` - Export configuration options
- `onProgress?: (progress: ExportProgress) => void` - Progress callback

**Returns:** `Promise<ExportResult>`

**Example:**
```typescript
const result = await exportManager.exportToCSV(
  data,
  {
    includeHeaders: true,
    delimiter: ',',
    fields: ['firstName', 'lastName', 'email'],
    filename: 'custom_export.csv'
  },
  (progress) => {
    console.log(`${progress.percentage}% complete`);
  }
);
```

##### `exportToJSON(data, config, onProgress)`

Export data to JSON format.

**Parameters:**
- `data: any[]` - Array of records to export
- `config: Partial<ExportConfig>` - Export configuration options
- `onProgress?: (progress: ExportProgress) => void` - Progress callback

**Returns:** `Promise<ExportResult>`

**Example:**
```typescript
const result = await exportManager.exportToJSON(
  data,
  {
    prettyPrint: true,
    fields: ['id', 'name', 'graduationYear'],
    dateFormat: 'iso',
    filename: 'alumni_data.json'
  },
  (progress) => {
    console.log(progress.message);
  }
);
```

##### `export(data, config, onProgress)`

Export data with automatic format detection.

**Parameters:**
- `data: any[]` - Array of records to export
- `config: ExportConfig` - Export configuration with format specified
- `onProgress?: (progress: ExportProgress) => void` - Progress callback

**Returns:** `Promise<ExportResult>`

##### `exportFilteredResults(data, filters, config, onProgress)`

Export filtered results with metadata.

**Parameters:**
- `data: any[]` - Array of filtered records
- `filters: FilterConfig` - Active filter configuration
- `config: Partial<ExportConfig>` - Export configuration options
- `onProgress?: (progress: ExportProgress) => void` - Progress callback

**Returns:** `Promise<ExportResult>`

##### `getAvailableFields(data)`

Extract available field names from data.

**Parameters:**
- `data: any[]` - Array of records

**Returns:** `string[]` - Array of field names

##### `estimateExportSize(data, format)`

Estimate the size of the export file.

**Parameters:**
- `data: any[]` - Array of records
- `format: ExportFormat` - Export format ('csv' or 'json')

**Returns:** `number` - Estimated size in bytes

### Type Definitions

#### ExportConfig

```typescript
interface ExportConfig {
  format: 'csv' | 'json';
  includeHeaders?: boolean;      // CSV only
  fields?: string[];              // Optional field selection
  filename?: string;              // Custom filename
  dateFormat?: 'iso' | 'locale' | 'custom';
  customDateFormat?: string;      // For custom date format
  prettyPrint?: boolean;          // JSON only
  delimiter?: string;             // CSV only (default: ',')
}
```

#### ExportProgress

```typescript
interface ExportProgress {
  total: number;                  // Total records
  current: number;                // Current record
  percentage: number;             // Progress percentage (0-100)
  status: 'preparing' | 'exporting' | 'complete' | 'error';
  message?: string;               // Status message
}
```

#### ExportResult

```typescript
interface ExportResult {
  success: boolean;               // Export success status
  filename: string;               // Generated filename
  recordCount: number;            // Number of records exported
  format: 'csv' | 'json';        // Export format used
  size: number;                   // File size in bytes
  error?: string;                 // Error message if failed
}
```

## ExportDialog Component

### Props

```typescript
interface ExportDialogProps {
  isOpen: boolean;                // Dialog visibility
  onClose: () => void;            // Close handler
  data: any[];                    // Data to export
  filters?: FilterConfig;         // Optional filter configuration
  contentType?: string;           // Content type label
  className?: string;             // Additional CSS classes
}
```

### Features

- **Format Selection**: Choose between CSV and JSON
- **Field Selection**: Multi-select with select all/none
- **Progress Tracking**: Real-time progress with MC Blue indicator
- **Success Feedback**: Clear success message with file details
- **Error Handling**: User-friendly error messages
- **Responsive Design**: Works on desktop and mobile

### Styling

The ExportDialog uses MC Law blue theme:
- Primary background: `#0C2340` (MC Blue)
- Accent color: `#C99700` (MC Gold)
- Text color: `#FFFFFF` (White)
- Progress bar: Animated gold gradient
- Success icon: Gold background with blue text

## Examples

### Example 1: Simple CSV Export

```typescript
const exportManager = new ExportManager();

const data = [
  { id: 1, name: 'John Doe', year: 1980 },
  { id: 2, name: 'Jane Smith', year: 1985 }
];

const result = await exportManager.exportToCSV(data, {
  includeHeaders: true,
  filename: 'alumni.csv'
});

if (result.success) {
  console.log(`Exported ${result.recordCount} records`);
}
```

### Example 2: JSON Export with Field Selection

```typescript
const result = await exportManager.exportToJSON(data, {
  fields: ['firstName', 'lastName', 'email'],
  prettyPrint: true,
  dateFormat: 'locale'
});
```

### Example 3: Export with Progress Tracking

```typescript
const result = await exportManager.exportToCSV(
  largeDataset,
  { includeHeaders: true },
  (progress) => {
    if (progress.status === 'exporting') {
      updateProgressBar(progress.percentage);
    } else if (progress.status === 'complete') {
      showSuccessMessage();
    }
  }
);
```

### Example 4: Export Dialog Integration

```typescript
import { useState } from 'react';
import { ExportDialog } from '@/components/filters/ExportDialog';

function AlumniPage() {
  const [showExport, setShowExport] = useState(false);
  const [alumniData, setAlumniData] = useState([]);

  return (
    <div>
      <button onClick={() => setShowExport(true)}>
        Export Alumni Data
      </button>

      <ExportDialog
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={alumniData}
        contentType="alumni"
      />
    </div>
  );
}
```

## Performance Considerations

### Batch Processing

The ExportManager processes data in batches of 100 records to maintain UI responsiveness:

```typescript
const batchSize = 100;
for (let i = 0; i < data.length; i++) {
  // Process record
  
  // Report progress every batch
  if (i % batchSize === 0) {
    onProgress?.({
      current: i + 1,
      total: data.length,
      percentage: Math.round(((i + 1) / data.length) * 100),
      status: 'exporting'
    });
  }
}
```

### Memory Management

For large datasets:
- Use streaming for very large exports (>10,000 records)
- Consider server-side export for datasets >50,000 records
- Monitor memory usage during export

### Size Estimation

The `estimateExportSize()` method samples the first 10 records to estimate total file size:

```typescript
const estimatedSize = exportManager.estimateExportSize(data, 'csv');
console.log(`Estimated size: ${formatFileSize(estimatedSize)}`);
```

## Error Handling

The ExportManager provides comprehensive error handling:

```typescript
const result = await exportManager.exportToCSV(data, config);

if (!result.success) {
  console.error(`Export failed: ${result.error}`);
  // Handle error (show message to user, retry, etc.)
}
```

Common errors:
- Empty dataset
- Invalid field names
- Browser download restrictions
- Memory limitations

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Testing

See `ExportExample.tsx` for a complete working example with sample data.

## Related Documentation

- [Advanced Filter System](./README.md)
- [Filter Types](./types.ts)
- [MC Law Styling Guide](../../styles/advanced-filter.css)

## Support

For issues or questions, refer to the main Advanced Filter System documentation.
