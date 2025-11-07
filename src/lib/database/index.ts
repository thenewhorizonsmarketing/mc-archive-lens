// Database module exports
export * from './types';
export * from './schema';
export * from './manager';
export * from './connection';
export * from './import-manager';
export * from './backup-manager';
export * from './index-manager';
export * from './search-manager';
export * from './query-builder';

// Re-export commonly used items for convenience
export { 
  databaseManager,
  dbConnection,
  connectToDatabase,
  disconnectFromDatabase,
  getDatabaseManager,
  isDatabaseConnected
} from './connection';

export { importManager } from './import-manager';
export { backupManager } from './backup-manager';
export { indexManager } from './index-manager';
export { searchManager } from './search-manager';
export { QueryBuilder } from './query-builder';

export type {
  AlumniRecord,
  PublicationRecord,
  PhotoRecord,
  FacultyRecord,
  SearchResult,
  SearchFilters,
  YearRange,
  TableType,
  ImportResult,
  ValidationResult,
  DatabaseError
} from './types';