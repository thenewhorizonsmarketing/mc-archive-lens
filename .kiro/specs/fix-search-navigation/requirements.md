# Requirements Document: Fix Search Result Navigation

## Introduction

The fullscreen kiosk search is displaying results but clicking on a result doesn't navigate to the correct person or load their details in the alumni room. This spec addresses the navigation flow from search results to the alumni detail view.

## Glossary

- **Search System**: The fullscreen kiosk search interface that queries the database
- **Alumni Room**: The page that displays alumni records with filtering and detail views
- **Navigation Flow**: The process of moving from search results to the detail view
- **Session Storage**: Browser storage used to pass data between pages

## Requirements

### Requirement 1: Search Result Click Navigation

**User Story:** As a kiosk user, I want to click on a search result and see that person's details, so that I can view their information.

#### Acceptance Criteria

1. WHEN the User clicks a search result, THE Search System SHALL navigate to the alumni room
2. WHEN the User arrives at the alumni room, THE Alumni Room SHALL display the selected person's detail dialog
3. WHEN the detail dialog opens, THE Alumni Room SHALL show the correct person's photo and information
4. WHEN the User closes the detail dialog, THE Alumni Room SHALL remain on the alumni room page with all records visible

### Requirement 2: Data Consistency

**User Story:** As a kiosk user, I want the search to find the same person that appears in the alumni room, so that the information is consistent.

#### Acceptance Criteria

1. THE Search System SHALL use the same data source as the Alumni Room
2. THE Search System SHALL pass sufficient identifying information to locate the exact record
3. THE Alumni Room SHALL successfully match the search selection to a record in its dataset
4. IF no match is found, THE Alumni Room SHALL display an error message to the User

### Requirement 3: Photo Display

**User Story:** As a kiosk user, I want to see photos in both search results and detail views, so that I can visually identify people.

#### Acceptance Criteria

1. WHEN search results include a photo, THE Search System SHALL display the thumbnail
2. WHEN the detail dialog opens, THE Alumni Room SHALL display the full photo using the same path
3. THE Search System SHALL construct photo paths as `/photos/{year}/{filename}`
4. THE Alumni Room SHALL use the same photo path format for consistency
