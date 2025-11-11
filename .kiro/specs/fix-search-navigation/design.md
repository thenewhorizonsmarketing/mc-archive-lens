# Design Document: Fix Search Result Navigation

## Overview

The search navigation is broken because:
1. The search uses a database/mock data system
2. The alumni room loads from CSV files
3. The data formats and matching logic are incompatible
4. Photo paths aren't being constructed consistently

## Architecture

### Current Flow (Broken)
```
Search Result Click
  → Store in sessionStorage {type, title, id}
  → Navigate to /
  → Index reads sessionStorage
  → Navigate to /alumni with selectedResultName
  → AlumniRoom tries to match by name
  → ❌ Fails because data sources differ
```

### Fixed Flow
```
Search Result Click
  → Store full record data in sessionStorage
  → Navigate to /alumni directly
  → AlumniRoom reads sessionStorage
  → Match by multiple fields (name, year, photo)
  → ✅ Opens detail dialog with correct person
```

## Components and Interfaces

### 1. FullscreenSearchPage - Result Selection Handler

**Changes:**
- Store complete search result data in sessionStorage
- Navigate directly to `/alumni` instead of `/`
- Include all identifying fields: name, year, photo, role

```typescript
interface SearchSelection {
  fullName: string;
  classYear: number;
  photoFile?: string;
  role?: string;
  type: 'alumni';
}
```

### 2. AlumniRoom - Selection Handler

**Changes:**
- Read from sessionStorage on mount
- Match using multiple fields for accuracy
- Handle both CSV data and search selections
- Clear sessionStorage after successful match

**Matching Logic:**
1. Try exact name + year match
2. Try name match with fuzzy comparison
3. Try photo filename match
4. Fall back to name-only match

### 3. Photo Path Consistency

**Ensure both systems use:**
- Format: `/photos/{year}/{filename}`
- Same field names: `portrait_path` or `photo_file`
- Fallback to composite image if portrait missing

## Data Models

### CSV Alumni Record
```typescript
{
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name: string;
  class_year: number;
  role?: string;
  photo_file?: string;  // Just filename
}
```

### Search Result (from database)
```typescript
{
  id: string;
  type: 'alumni';
  title: string;  // Full name
  subtitle: string;  // "Class of YYYY • Role"
  thumbnailPath?: string;  // Full path
  data: {
    full_name: string;
    class_year: number;
    role?: string;
    portrait_path?: string;  // Just filename
  }
}
```

## Error Handling

1. **No Match Found**: Show toast message "Person not found in alumni records"
2. **Missing Data**: Log warning and attempt partial match
3. **Invalid Session Data**: Clear sessionStorage and continue normally

## Testing Strategy

1. Search for a person with a photo
2. Click the result
3. Verify navigation to alumni room
4. Verify detail dialog opens
5. Verify correct person and photo displayed
6. Close dialog and verify room state
