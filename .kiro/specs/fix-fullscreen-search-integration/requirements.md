# Requirements Document

## Introduction

The fullscreen search interface currently uses a browser-compatible mock data system (`BrowserSearchManager`) instead of integrating with the existing SQLite FTS5 search infrastructure used throughout the application. This creates inconsistency in search results and prevents users from accessing the full, optimized search capabilities. This specification defines the requirements to properly integrate the fullscreen search with the existing search infrastructure.

## Glossary

- **Fullscreen_Search**: The fullscreen search interface component at `/search` route
- **Search_Manager**: The existing SQLite FTS5-based search system used in the application
- **Browser_Search_Manager**: The current mock data-based search system used by fullscreen search
- **Search_Context**: The React context that provides search functionality to components
- **Search_Interface**: The reusable search UI component that can work with any search backend
- **FTS5_Search**: Full-text search using SQLite FTS5 indexes for optimal performance

## Requirements

### Requirement 1

**User Story:** As a kiosk user, I want the fullscreen search to return the same results as the rest of the application, so that I have a consistent search experience

#### Acceptance Criteria

1. THE Fullscreen_Search SHALL use the same Search_Manager instance as other application components
2. WHEN a user searches in fullscreen mode, THE Search_Manager SHALL query the SQLite FTS5 database
3. THE Fullscreen_Search SHALL return identical results to searches performed elsewhere in the application
4. THE Fullscreen_Search SHALL not use mock data or Browser_Search_Manager
5. WHEN the database is unavailable, THE Fullscreen_Search SHALL display an appropriate error message

### Requirement 2

**User Story:** As a developer, I want the fullscreen search to use the existing search infrastructure, so that I don't have to maintain duplicate search implementations

#### Acceptance Criteria

1. THE Fullscreen_Search SHALL import and use the existing Search_Context
2. THE Fullscreen_Search SHALL not create a separate search manager instance
3. THE Search_Interface component SHALL accept the Search_Manager from context
4. THE Fullscreen_Search SHALL leverage existing search caching and optimization
5. THE Fullscreen_Search SHALL use existing error handling and recovery mechanisms

### Requirement 3

**User Story:** As a kiosk user, I want search results to include all alumni data from the CSV, so that I can find any person in the database

#### Acceptance Criteria

1. THE Search_Manager SHALL index all alumni records from the CSV file
2. WHEN a user searches for an alumni name, THE Search_Manager SHALL return matching records from the full dataset
3. THE Fullscreen_Search SHALL display thumbnails from the correct photo paths
4. THE Fullscreen_Search SHALL include all metadata fields (year, role, etc.) in results
5. WHEN a user selects a result, THE Fullscreen_Search SHALL navigate with complete record data

### Requirement 4

**User Story:** As a kiosk user, I want the fullscreen search to work offline using the local database, so that I can search without network connectivity

#### Acceptance Criteria

1. THE Search_Manager SHALL operate entirely offline using the local SQLite database
2. THE Fullscreen_Search SHALL not require network connectivity for any operations
3. WHEN the application loads, THE Search_Manager SHALL initialize the database from local files
4. THE Fullscreen_Search SHALL display search results within 150 milliseconds
5. THE Fullscreen_Search SHALL maintain full functionality in offline mode
