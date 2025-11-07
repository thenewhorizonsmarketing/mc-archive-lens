import { z } from 'zod';

// Validation schema for alumni CSV rows
export const alumniCSVSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100, "First name too long"),
  middle_name: z.string().trim().max(100, "Middle name too long").optional(),
  last_name: z.string().trim().min(1, "Last name is required").max(100, "Last name too long"),
  class_role: z.string().trim().max(200, "Class role too long").optional(),
  grad_year: z.string().trim().regex(/^\d{4}$/, "Must be a 4-digit year").refine(
    (year) => {
      const y = parseInt(year);
      return y >= 1900 && y <= new Date().getFullYear() + 10;
    },
    "Year must be between 1900 and 10 years in the future"
  ),
  grad_date: z.string().trim().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format"
  ).refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    "Invalid date"
  ),
  photo_file: z.string().trim().max(500, "Photo path too long").optional()
});

export type AlumniCSVRow = z.infer<typeof alumniCSVSchema>;

export interface ValidationIssue {
  row: number;
  field: string;
  value: string;
  issue: string;
  severity: 'error' | 'warning';
}

export interface DuplicateEntry {
  rows: number[];
  name: string;
  grad_year: string;
}

export interface PhotoPathIssue {
  row: number;
  path: string;
  issue: string;
}

export interface ValidationReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  issues: ValidationIssue[];
  duplicates: DuplicateEntry[];
  photoPathIssues: PhotoPathIssue[];
  missingFields: {
    first_name: number;
    last_name: number;
    grad_year: number;
    grad_date: number;
  };
  canProceed: boolean;
}

// Validate a single CSV row
function validateRow(row: any, rowIndex: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  try {
    alumniCSVSchema.parse(row);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        issues.push({
          row: rowIndex + 1,
          field: err.path.join('.'),
          value: row[err.path[0]] || '',
          issue: err.message,
          severity: 'error'
        });
      });
    }
  }
  
  return issues;
}

// Check for suspicious photo paths
function checkPhotoPath(path: string, rowIndex: number): PhotoPathIssue | null {
  if (!path || !path.trim()) return null;
  
  const trimmedPath = path.trim();
  const issues: string[] = [];
  
  // Check for absolute paths (Windows/Unix)
  if (trimmedPath.match(/^[A-Za-z]:\\/i) || trimmedPath.startsWith('/Users/') || trimmedPath.startsWith('/home/')) {
    issues.push('Contains absolute local path - will be normalized during import');
  }
  
  // Check for quotes
  if (trimmedPath.includes("'") || trimmedPath.includes('"')) {
    issues.push('Contains quotes - will be removed during import');
  }
  
  // Check for spaces in filename
  if (trimmedPath.split('/').pop()?.includes(' ')) {
    issues.push('Filename contains spaces - may cause issues');
  }
  
  // Check file extension
  const ext = trimmedPath.split('.').pop()?.toLowerCase();
  if (ext && !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    issues.push(`Unusual file extension: .${ext}`);
  }
  
  if (issues.length > 0) {
    return {
      row: rowIndex + 1,
      path: trimmedPath,
      issue: issues.join('; ')
    };
  }
  
  return null;
}

// Find duplicate entries
function findDuplicates(rows: any[]): DuplicateEntry[] {
  const seen = new Map<string, number[]>();
  
  rows.forEach((row, index) => {
    if (!row.first_name || !row.last_name || !row.grad_year) return;
    
    const key = `${row.first_name.trim().toLowerCase()}_${row.last_name.trim().toLowerCase()}_${row.grad_year.trim()}`;
    
    if (!seen.has(key)) {
      seen.set(key, []);
    }
    seen.get(key)!.push(index + 1);
  });
  
  const duplicates: DuplicateEntry[] = [];
  seen.forEach((rowNums, key) => {
    if (rowNums.length > 1) {
      const parts = key.split('_');
      duplicates.push({
        rows: rowNums,
        name: `${parts[0]} ${parts[1]}`,
        grad_year: parts[2]
      });
    }
  });
  
  return duplicates;
}

// Main validation function
export function validateCSVData(rows: any[]): ValidationReport {
  const issues: ValidationIssue[] = [];
  const photoPathIssues: PhotoPathIssue[] = [];
  const missingFields = {
    first_name: 0,
    last_name: 0,
    grad_year: 0,
    grad_date: 0
  };
  
  // Validate each row
  rows.forEach((row, index) => {
    // Check for missing critical fields
    if (!row.first_name || !row.first_name.trim()) {
      missingFields.first_name++;
      issues.push({
        row: index + 1,
        field: 'first_name',
        value: '',
        issue: 'First name is required',
        severity: 'error'
      });
    }
    
    if (!row.last_name || !row.last_name.trim()) {
      missingFields.last_name++;
      issues.push({
        row: index + 1,
        field: 'last_name',
        value: '',
        issue: 'Last name is required',
        severity: 'error'
      });
    }
    
    if (!row.grad_year || !row.grad_year.trim()) {
      missingFields.grad_year++;
      issues.push({
        row: index + 1,
        field: 'grad_year',
        value: '',
        issue: 'Graduation year is required',
        severity: 'error'
      });
    }
    
    if (!row.grad_date || !row.grad_date.trim()) {
      missingFields.grad_date++;
      issues.push({
        row: index + 1,
        field: 'grad_date',
        value: '',
        issue: 'Graduation date is required',
        severity: 'error'
      });
    }
    
    // Validate row structure
    const rowIssues = validateRow(row, index);
    issues.push(...rowIssues);
    
    // Check photo path
    if (row.photo_file) {
      const photoIssue = checkPhotoPath(row.photo_file, index);
      if (photoIssue) {
        photoPathIssues.push(photoIssue);
      }
    }
  });
  
  // Find duplicates
  const duplicates = findDuplicates(rows);
  
  // Count valid rows (rows with no errors)
  const rowsWithErrors = new Set(
    issues.filter(i => i.severity === 'error').map(i => i.row)
  );
  const validRows = rows.length - rowsWithErrors.size;
  
  // Can proceed if at least 50% of rows are valid and there are some valid rows
  const canProceed = validRows > 0 && validRows >= rows.length * 0.5;
  
  return {
    totalRows: rows.length,
    validRows,
    invalidRows: rowsWithErrors.size,
    issues,
    duplicates,
    photoPathIssues,
    missingFields,
    canProceed
  };
}

// Get validation summary for display
export function getValidationSummary(report: ValidationReport): string {
  const parts: string[] = [];
  
  if (report.validRows === report.totalRows) {
    parts.push(`✓ All ${report.totalRows} rows are valid`);
  } else {
    parts.push(`${report.validRows}/${report.totalRows} rows valid`);
  }
  
  if (report.issues.length > 0) {
    const errors = report.issues.filter(i => i.severity === 'error').length;
    const warnings = report.issues.filter(i => i.severity === 'warning').length;
    if (errors > 0) parts.push(`${errors} errors`);
    if (warnings > 0) parts.push(`${warnings} warnings`);
  }
  
  if (report.duplicates.length > 0) {
    parts.push(`${report.duplicates.length} duplicates`);
  }
  
  if (report.photoPathIssues.length > 0) {
    parts.push(`${report.photoPathIssues.length} photo path issues`);
  }
  
  return parts.join(' • ');
}
