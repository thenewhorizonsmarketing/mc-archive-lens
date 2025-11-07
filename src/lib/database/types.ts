// Database type definitions for the SQLite FTS5 search system
// Updated with UI component compatibility

export interface AlumniRecord {
  id: number;
  full_name: string;
  class_year: number;
  role: string;
  composite_image_path?: string;
  portrait_path?: string;
  caption?: string;
  tags: string;
  sort_key: string;
}

export interface PublicationRecord {
  id: number;
  title: string;
  pub_name: 'Amicus' | 'Legal Eye' | 'Law Review' | 'Directory';
  issue_date: string;
  volume_issue: string;
  pdf_path: string;
  thumb_path?: string;
  description: string;
  tags: string;
}

export interface PhotoRecord {
  id: number;
  collection: string;
  title: string;
  year_or_decade: string;
  image_path: string;
  caption: string;
  tags: string;
}

export interface FacultyRecord {
  id: number;
  full_name: string;
  title: string;
  department: string;
  email?: string;
  phone?: string;
  headshot_path?: string;
}

export interface SearchResult {
  id: string;
  type: 'alumni' | 'publication' | 'photo' | 'faculty';
  title: string;
  subtitle?: string;
  thumbnailPath?: string;
  thumbnail?: string; // For UI compatibility
  relevanceScore: number;
  score?: number; // For UI compatibility (same as relevanceScore)
  snippet?: string; // Text snippet with highlighted terms
  metadata?: {
    year?: number;
    author?: string;
    name?: string;
    department?: string;
    publicationType?: string;
    tags?: string[];
    [key: string]: any;
  };
  data: AlumniRecord | PublicationRecord | PhotoRecord | FacultyRecord;
}

// Specific result types for type-safe filtering
export interface AlumniResult extends SearchResult {
  type: 'alumni';
  data: AlumniRecord;
}

export interface PublicationResult extends SearchResult {
  type: 'publication';
  data: PublicationRecord;
}

export interface PhotoResult extends SearchResult {
  type: 'photo';
  data: PhotoRecord;
}

export interface FacultyResult extends SearchResult {
  type: 'faculty';
  data: FacultyRecord;
}

export interface SearchFilters {
  yearRange?: { start: number; end: number };
  publicationType?: string;
  department?: string;
  decade?: string;
}

export interface YearRange {
  start: number;
  end: number;
}

export interface SearchPerformanceMetrics {
  queryTime: number;
  resultCount: number;
  cacheHit: boolean;
  queryComplexity: number;
  timestamp: number;
}

export type TableType = 'alumni' | 'publications' | 'photos' | 'faculty';

export interface ImportResult {
  success: boolean;
  recordsImported: number;
  errors: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class DatabaseError extends Error {
  type: 'SYNTAX_ERROR' | 'INDEX_CORRUPT' | 'TIMEOUT' | 'CONNECTION_ERROR';
  query?: string;

  constructor(message: string, type?: DatabaseError['type'], query?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.type = type || 'CONNECTION_ERROR';
    this.query = query;
  }
}