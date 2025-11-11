# Implementation Plan: Fix Search Result Navigation

- [x] 1. Update FullscreenSearchPage result selection handler
  - Modify `handleResultSelect` to store complete record data
  - Change navigation target from `/` to `/alumni`
  - Include all identifying fields in sessionStorage
  - _Requirements: 1.1, 1.2, 2.2_

- [x] 2. Update AlumniRoom to handle search selections
  - Add sessionStorage reading on component mount
  - Implement multi-field matching logic (name + year + photo)
  - Auto-open detail dialog when match found
  - Clear sessionStorage after successful match
  - Add error handling for no-match scenarios
  - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.3, 2.4_

- [x] 3. Ensure photo path consistency
  - Verify search results use `/photos/{year}/{filename}` format
  - Verify AlumniRoom constructs same photo paths
  - Test photo display in both search results and detail dialog
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Test end-to-end flow
  - Search for "Carmen Castilla"
  - Click the search result
  - Verify navigation to alumni room
  - Verify detail dialog opens with correct person
  - Verify photo displays correctly
  - Close dialog and verify room remains functional
  - _Requirements: All_
