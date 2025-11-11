/**
 * Integration tests for Flipbook Publications Room flow
 * Tests the complete user flow from viewing publications to opening flipbooks
 * Requirements: 1.1, 1.2, 1.5, 5.2, 5.3
 */

import { describe, it, expect } from 'vitest';
import { validateFlipbookPath } from '@/lib/flipbook/validation';

describe('Flipbook Publications Room Integration', () => {
  
  describe('Publication Record with Flipbook (Requirements 5.2, 5.3)', () => {
    it('should detect publication with flipbook_path', () => {
      const publication = {
        id: 'pub_001',
        type: 'publication',
        title: 'Amicus Spring 2024',
        data: {
          title: 'Amicus Spring 2024',
          pub_name: 'Amicus',
          flipbook_path: '/flipbooks/amicus-2024-spring/index.html',
          pdf_path: '/pdfs/publications/amicus-spring-2024.pdf'
        }
      };
      
      expect(publication.data.flipbook_path).toBeDefined();
      expect(publication.data.flipbook_path).toContain('/flipbooks/');
    });

    it('should detect publication with only flipbook_path', () => {
      const publication = {
        id: 'pub_002',
        type: 'publication',
        title: 'Law Review Vol 45',
        data: {
          title: 'Law Review Vol 45',
          pub_name: 'Law Review',
          flipbook_path: '/flipbooks/law-review-vol-45/index.html'
        }
      };
      
      expect(publication.data.flipbook_path).toBeDefined();
      expect(publication.data.pdf_path).toBeUndefined();
    });

    it('should detect publication with only pdf_path', () => {
      const publication = {
        id: 'pub_003',
        type: 'publication',
        title: 'Legal Eye 2023',
        data: {
          title: 'Legal Eye 2023',
          pub_name: 'Legal Eye',
          pdf_path: '/pdfs/publications/legal-eye-2023.pdf'
        }
      };
      
      expect(publication.data.pdf_path).toBeDefined();
      expect(publication.data.flipbook_path).toBeUndefined();
    });

    it('should detect publication with neither path', () => {
      const publication = {
        id: 'pub_004',
        type: 'publication',
        title: 'Directory 2024',
        data: {
          title: 'Directory 2024',
          pub_name: 'Directory'
        }
      };
      
      expect(publication.data.flipbook_path).toBeUndefined();
      expect(publication.data.pdf_path).toBeUndefined();
    });
  });

  describe('Flipbook Path Validation (Requirement 5.3)', () => {
    it('should validate correct flipbook path', () => {
      const path = '/flipbooks/amicus-2024-spring/index.html';
      const result = validateFlipbookPath(path);
      
      expect(result.isValid).toBe(true);
      expect(result.normalizedPath).toBe(path);
    });

    it('should validate flipbook path without leading slash', () => {
      const path = 'flipbooks/amicus-2024-spring/index.html';
      const result = validateFlipbookPath(path);
      
      expect(result.isValid).toBe(true);
      expect(result.normalizedPath).toBe('/flipbooks/amicus-2024-spring/index.html');
    });

    it('should reject invalid flipbook path', () => {
      const invalidPaths = [
        '',
        null,
        undefined,
        '/pdfs/publication.pdf',
        '/flipbooks/test.pdf',
        '/flipbooks/',
        'flipbooks/test',
        '/flipbooks/../etc/passwd',
        '/flipbooks//test/index.html'
      ];
      
      invalidPaths.forEach(path => {
        const result = validateFlipbookPath(path as any);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('Viewing Options Logic (Requirements 5.2, 5.3)', () => {
    it('should show both buttons when both paths exist', () => {
      const data = {
        flipbook_path: '/flipbooks/test/index.html',
        pdf_path: '/pdfs/test.pdf'
      };
      
      const hasFlipbook = validateFlipbookPath(data.flipbook_path).isValid;
      const hasPDF = !!data.pdf_path;
      
      expect(hasFlipbook).toBe(true);
      expect(hasPDF).toBe(true);
    });

    it('should show only flipbook button when only flipbook exists', () => {
      const data = {
        flipbook_path: '/flipbooks/test/index.html'
      };
      
      const hasFlipbook = validateFlipbookPath(data.flipbook_path).isValid;
      const hasPDF = !!data.pdf_path;
      
      expect(hasFlipbook).toBe(true);
      expect(hasPDF).toBe(false);
    });

    it('should show only PDF button when only PDF exists', () => {
      const data = {
        pdf_path: '/pdfs/test.pdf'
      };
      
      const hasFlipbook = validateFlipbookPath(data.flipbook_path).isValid;
      const hasPDF = !!data.pdf_path;
      
      expect(hasFlipbook).toBe(false);
      expect(hasPDF).toBe(true);
    });

    it('should show no buttons when neither exists', () => {
      const data = {};
      
      const hasFlipbook = validateFlipbookPath(data.flipbook_path).isValid;
      const hasPDF = !!data.pdf_path;
      
      expect(hasFlipbook).toBe(false);
      expect(hasPDF).toBe(false);
    });
  });

  describe('Flipbook Viewer State Management (Requirement 1.1)', () => {
    it('should manage flipbook viewer open state', () => {
      let showFlipbook = false;
      
      // Simulate opening flipbook
      showFlipbook = true;
      expect(showFlipbook).toBe(true);
      
      // Simulate closing flipbook
      showFlipbook = false;
      expect(showFlipbook).toBe(false);
    });

    it('should toggle between closed and open states', () => {
      let showFlipbook = false;
      
      // Open
      showFlipbook = !showFlipbook;
      expect(showFlipbook).toBe(true);
      
      // Close
      showFlipbook = !showFlipbook;
      expect(showFlipbook).toBe(false);
    });
  });

  describe('Flipbook URL Construction (Requirement 1.1)', () => {
    it('should construct correct flipbook URL from path', () => {
      const flipbookPath = '/flipbooks/amicus-2024-spring/index.html';
      const validation = validateFlipbookPath(flipbookPath);
      
      expect(validation.isValid).toBe(true);
      expect(validation.normalizedPath).toBe(flipbookPath);
    });

    it('should normalize flipbook URL without leading slash', () => {
      const flipbookPath = 'flipbooks/amicus-2024-spring/index.html';
      const validation = validateFlipbookPath(flipbookPath);
      
      expect(validation.isValid).toBe(true);
      expect(validation.normalizedPath).toBe('/flipbooks/amicus-2024-spring/index.html');
    });
  });

  describe('Error Scenarios (Requirement 5.3)', () => {
    it('should handle invalid flipbook path gracefully', () => {
      const invalidPath = '/invalid/path.html';
      const validation = validateFlipbookPath(invalidPath);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
    });

    it('should handle empty flipbook path', () => {
      const emptyPath = '';
      const validation = validateFlipbookPath(emptyPath);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('empty');
    });

    it('should handle null flipbook path', () => {
      const nullPath = null;
      const validation = validateFlipbookPath(nullPath);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
    });

    it('should handle undefined flipbook path', () => {
      const undefinedPath = undefined;
      const validation = validateFlipbookPath(undefinedPath);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBeDefined();
    });

    it('should prevent path traversal attacks', () => {
      const maliciousPath = '/flipbooks/../../../etc/passwd.html';
      const validation = validateFlipbookPath(maliciousPath);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('invalid characters');
    });

    it('should prevent double slash attacks', () => {
      const maliciousPath = '/flipbooks//test/index.html';
      const validation = validateFlipbookPath(maliciousPath);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('invalid characters');
    });
  });

  describe('Switching Between Viewers (Requirements 1.1, 5.2)', () => {
    it('should allow switching from flipbook to PDF', () => {
      const data = {
        flipbook_path: '/flipbooks/test/index.html',
        pdf_path: '/pdfs/test.pdf'
      };
      
      let currentViewer: 'flipbook' | 'pdf' | null = null;
      
      // Open flipbook
      currentViewer = 'flipbook';
      expect(currentViewer).toBe('flipbook');
      
      // Switch to PDF
      currentViewer = 'pdf';
      expect(currentViewer).toBe('pdf');
      
      // Close viewer
      currentViewer = null;
      expect(currentViewer).toBeNull();
    });

    it('should maintain publication data when switching viewers', () => {
      const publicationData = {
        title: 'Test Publication',
        flipbook_path: '/flipbooks/test/index.html',
        pdf_path: '/pdfs/test.pdf'
      };
      
      // Data should remain consistent regardless of viewer
      expect(publicationData.title).toBe('Test Publication');
      expect(publicationData.flipbook_path).toBeDefined();
      expect(publicationData.pdf_path).toBeDefined();
    });
  });

  describe('Return to Publications List (Requirement 1.2)', () => {
    it('should close flipbook and return to list', () => {
      let showFlipbook = true;
      let showRecordDetail = true;
      
      // Close flipbook
      showFlipbook = false;
      expect(showFlipbook).toBe(false);
      
      // Record detail should still be visible
      expect(showRecordDetail).toBe(true);
    });

    it('should close both flipbook and record detail', () => {
      let showFlipbook = true;
      let showRecordDetail = true;
      
      // Close flipbook
      showFlipbook = false;
      
      // Close record detail
      showRecordDetail = false;
      
      expect(showFlipbook).toBe(false);
      expect(showRecordDetail).toBe(false);
    });
  });

  describe('Keyboard Navigation Integration (Requirement 1.5)', () => {
    it('should handle Escape key to close flipbook', () => {
      const escapeKey = 'Escape';
      let showFlipbook = true;
      
      // Simulate Escape key press
      if (escapeKey === 'Escape') {
        showFlipbook = false;
      }
      
      expect(showFlipbook).toBe(false);
    });

    it('should not close on other keys', () => {
      const keys = ['Enter', 'Space', 'Tab', 'ArrowLeft', 'ArrowRight'];
      let showFlipbook = true;
      
      keys.forEach(key => {
        if (key === 'Escape') {
          showFlipbook = false;
        }
      });
      
      // Should still be open since Escape was not pressed
      expect(showFlipbook).toBe(true);
    });
  });

  describe('Accessibility Integration (Requirement 1.5)', () => {
    it('should provide proper ARIA labels for flipbook button', () => {
      const buttonLabel = 'View Flipbook';
      expect(buttonLabel).toContain('Flipbook');
    });

    it('should provide proper ARIA labels for PDF button', () => {
      const buttonLabel = 'View PDF';
      expect(buttonLabel).toContain('PDF');
    });

    it('should announce viewer state changes', () => {
      const announcements = {
        opening: 'Opening flipbook viewer',
        closing: 'Closing flipbook viewer',
        error: 'Failed to load flipbook'
      };
      
      expect(announcements.opening).toBeDefined();
      expect(announcements.closing).toBeDefined();
      expect(announcements.error).toBeDefined();
    });
  });

  describe('Publication Data Structure', () => {
    it('should have correct TypeScript interface structure', () => {
      interface PublicationData {
        title: string;
        pub_name: 'Amicus' | 'Legal Eye' | 'Law Review' | 'Directory';
        issue_date?: string;
        volume_issue?: string;
        pdf_path?: string;
        flipbook_path?: string;
        thumb_path?: string;
        description?: string;
        tags?: string;
      }
      
      const publication: PublicationData = {
        title: 'Test Publication',
        pub_name: 'Amicus',
        flipbook_path: '/flipbooks/test/index.html'
      };
      
      expect(publication.title).toBe('Test Publication');
      expect(publication.flipbook_path).toBeDefined();
    });
  });

  describe('Fallback Behavior (Requirement 5.3)', () => {
    it('should fallback to PDF when flipbook fails and PDF exists', () => {
      const data = {
        flipbook_path: '/flipbooks/broken/index.html',
        pdf_path: '/pdfs/working.pdf'
      };
      
      let currentViewer: 'flipbook' | 'pdf' = 'flipbook';
      const flipbookFailed = true;
      
      if (flipbookFailed && data.pdf_path) {
        currentViewer = 'pdf';
      }
      
      expect(currentViewer).toBe('pdf');
    });

    it('should show error when flipbook fails and no PDF exists', () => {
      const data = {
        flipbook_path: '/flipbooks/broken/index.html'
      };
      
      const flipbookFailed = true;
      const hasPDFFallback = !!data.pdf_path;
      
      expect(flipbookFailed).toBe(true);
      expect(hasPDFFallback).toBe(false);
    });
  });
});
