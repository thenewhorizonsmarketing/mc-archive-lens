// ============================================================================
// MC MUSEUM KIOSK - DATA STRUCTURE DEFINITIONS
// ============================================================================

export interface AlumniRecord {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name: string;
  class_role?: string;
  grad_year: number;
  grad_date: string;
  photo_file?: string;
  composite_image_path: string;
  portrait_path?: string;
  sort_key: string;
  decade: string;
  tags: string[];
}

export interface PublicationRecord {
  id: string;
  title: string;
  pub_name: string;
  issue_date: string;
  volume_issue?: string;
  pdf_path: string;
  thumb_path: string;
  description?: string;
  tags: string[];
  page_count?: number;
  year: number;
  decade: string;
}

export interface PhotoRecord {
  id: string;
  collection: string;
  title: string;
  year_or_decade: string;
  image_path: string;
  caption: string;
  tags: string[];
  rights_note?: string;
}

export interface FacultyRecord {
  id: string;
  full_name: string;
  title: string;
  department?: string;
  email: string;
  phone?: string;
  headshot_path?: string;
  bio_snippet?: string;
  sort_key: string;
}

export interface SearchableAlumni {
  id: string;
  searchText: string;
  grad_year: number;
  decade: string;
  has_photo: boolean;
  record: AlumniRecord;
}

export interface SearchIndex {
  alumni: SearchableAlumni[];
  publications: PublicationRecord[];
  photos: PhotoRecord[];
}

export interface AlumniFilters {
  year?: number;
  decade?: string;
  hasPhoto?: boolean;
  hasRole?: boolean;
  searchQuery?: string;
}

export interface PublicationFilters {
  pub_name?: string;
  year?: number;
  decade?: string;
  searchQuery?: string;
}

export type RoomType = 'home' | 'alumni' | 'publications' | 'photos' | 'faculty';

export interface AppState {
  current_room: RoomType;
  current_view_id: string | null;
  search_query: string;
  active_filters: AlumniFilters | PublicationFilters | null;
  idle_timer: number;
}

export interface AnalyticsEvent {
  timestamp: string;
  event_type: 'room_opened' | 'search_performed' | 'publication_viewed' | 
              'alumni_viewed' | 'photo_viewed' | 'idle_reset';
  details: {
    room?: string;
    year?: number;
    alumni_id?: string;
    publication_id?: string;
    search_query?: string;
    [key: string]: any;
  };
}
