import Papa from 'papaparse';
import { AlumniRecord, SearchableAlumni } from '@/types';

// CSV row interface matching the actual CSV structure
interface AlumniCSVRow {
  first_name: string;
  middle_name: string;
  last_name: string;
  class_role: string;
  grad_year: string;
  grad_date: string;
  photo_file: string;
}

// Transform a single CSV row into an AlumniRecord
function transformAlumniRecord(row: AlumniCSVRow, index: number): AlumniRecord {
  const gradYear = parseInt(row.grad_year);
  const decade = `${Math.floor(gradYear / 10) * 10}s`;
  
  // Clean up photo path: remove local paths, quotes, normalize to kiosk structure
  let portraitPath: string | undefined;
  if (row.photo_file && row.photo_file.trim()) {
    // Extract filename from full path
    const filename = row.photo_file
      .split('/')
      .pop()
      ?.replace(/'/g, '')
      .replace(/"/g, '')
      .trim();
    
    portraitPath = filename ? `alumni/${gradYear}/portraits/${filename}` : undefined;
  }
  
  const fullName = [row.first_name, row.middle_name, row.last_name]
    .filter(Boolean)
    .map(s => s.trim())
    .join(' ');
  
  const tags = [decade];
  if (row.class_role && row.class_role.trim()) {
    tags.push('leadership');
    tags.push(row.class_role.toLowerCase().trim());
  }
  
  return {
    id: `alum_${gradYear}_${String(index).padStart(3, '0')}`,
    first_name: row.first_name.trim(),
    middle_name: row.middle_name?.trim() || undefined,
    last_name: row.last_name.trim(),
    full_name: fullName,
    class_role: row.class_role?.trim() || undefined,
    grad_year: gradYear,
    grad_date: row.grad_date.trim(),
    photo_file: row.photo_file?.trim() || undefined,
    composite_image_path: `alumni/${gradYear}/composite_${gradYear}.jpg`,
    portrait_path: portraitPath,
    sort_key: `${row.last_name.trim()}, ${row.first_name.trim()}`,
    decade: decade,
    tags: tags
  };
}

// Parse CSV file and return AlumniRecord array
export async function parseAlumniCSV(file: File): Promise<AlumniRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<AlumniCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        try {
          // Filter out rows with missing critical data
          const validRows = results.data.filter(row => 
            row.first_name && 
            row.last_name && 
            row.grad_year &&
            !isNaN(parseInt(row.grad_year))
          );
          
          const alumni = validRows.map((row, index) => transformAlumniRecord(row, index));
          
          // Sort by sort_key (last name, first name)
          alumni.sort((a, b) => a.sort_key.localeCompare(b.sort_key));
          
          resolve(alumni);
        } catch (error) {
          reject(new Error(`Error transforming CSV data: ${error}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}

// Parse CSV from URL/path
export async function parseAlumniCSVFromURL(url: string): Promise<AlumniRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<AlumniCSVRow>(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (results) => {
        try {
          const validRows = results.data.filter(row => 
            row.first_name && 
            row.last_name && 
            row.grad_year &&
            !isNaN(parseInt(row.grad_year))
          );
          
          const alumni = validRows.map((row, index) => transformAlumniRecord(row, index));
          alumni.sort((a, b) => a.sort_key.localeCompare(b.sort_key));
          
          resolve(alumni);
        } catch (error) {
          reject(new Error(`Error transforming CSV data: ${error}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}

// Build search index from alumni records
export function buildAlumniSearchIndex(records: AlumniRecord[]): SearchableAlumni[] {
  return records.map(record => ({
    id: record.id,
    searchText: `${record.full_name} ${record.class_role || ''}`.toLowerCase(),
    grad_year: record.grad_year,
    decade: record.decade,
    has_photo: !!record.portrait_path,
    record: record
  }));
}

// Filter alumni by criteria
export function filterAlumni(
  alumni: AlumniRecord[],
  filters: {
    decade?: string | null;
    year?: number | null;
    searchQuery?: string;
    hasPhoto?: boolean;
    hasRole?: boolean;
    specificRole?: string | null;
  }
): AlumniRecord[] {
  return alumni.filter(alumnus => {
    // Year filter (takes precedence over decade)
    if (filters.year && alumnus.grad_year !== filters.year) return false;
    
    // Decade filter
    if (!filters.year && filters.decade && alumnus.decade !== filters.decade) return false;
    
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchText = `${alumnus.full_name} ${alumnus.class_role || ''} ${alumnus.grad_year}`.toLowerCase();
      if (!searchText.includes(query)) return false;
    }
    
    // Photo filter
    if (filters.hasPhoto && !alumnus.portrait_path) return false;
    
    // Role filter (has any role)
    if (filters.hasRole && !alumnus.class_role) return false;
    
    // Specific role filter
    if (filters.specificRole && alumnus.class_role !== filters.specificRole) return false;
    
    return true;
  });
}

// Get unique decades from alumni records
export function getUniqueDecades(alumni: AlumniRecord[]): string[] {
  const decades = new Set(alumni.map(a => a.decade));
  return Array.from(decades).sort();
}

// Get unique graduation years from alumni records
export function getUniqueYears(alumni: AlumniRecord[]): number[] {
  const years = new Set(alumni.map(a => a.grad_year));
  return Array.from(years).sort((a, b) => a - b);
}

// Get unique roles from alumni records
export function getUniqueRoles(alumni: AlumniRecord[]): string[] {
  const roles = new Set(
    alumni
      .map(a => a.class_role)
      .filter((role): role is string => !!role && role.trim().length > 0)
  );
  return Array.from(roles).sort();
}

// Get alumni statistics
export interface AlumniStats {
  total: number;
  withPhotos: number;
  withRoles: number;
  yearRange: { min: number; max: number } | null;
  decadeBreakdown: Record<string, number>;
}

export function getAlumniStats(alumni: AlumniRecord[]): AlumniStats {
  if (alumni.length === 0) {
    return {
      total: 0,
      withPhotos: 0,
      withRoles: 0,
      yearRange: null,
      decadeBreakdown: {}
    };
  }
  
  const years = alumni.map(a => a.grad_year);
  const decadeBreakdown: Record<string, number> = {};
  
  alumni.forEach(a => {
    decadeBreakdown[a.decade] = (decadeBreakdown[a.decade] || 0) + 1;
  });
  
  return {
    total: alumni.length,
    withPhotos: alumni.filter(a => a.portrait_path).length,
    withRoles: alumni.filter(a => a.class_role).length,
    yearRange: {
      min: Math.min(...years),
      max: Math.max(...years)
    },
    decadeBreakdown
  };
}
