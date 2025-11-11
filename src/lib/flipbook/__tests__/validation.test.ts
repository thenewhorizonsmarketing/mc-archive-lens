import { describe, it, expect } from 'vitest';
import {
  validateFlipbookPath,
  isValidFlipbookPath,
  normalizeFlipbookPath,
  getFlipbookPackageName
} from '../validation';

describe('Flipbook Path Validation', () => {
  describe('validateFlipbookPath', () => {
    it('should validate correct flipbook paths', () => {
      const result = validateFlipbookPath('/flipbooks/amicus-2024/index.html');
      expect(result.isValid).toBe(true);
      expect(result.normalizedPath).toBe('/flipbooks/amicus-2024/index.html');
      expect(result.error).toBeUndefined();
    });

    it('should normalize paths without leading slash', () => {
      const result = validateFlipbookPath('flipbooks/amicus-2024/index.html');
      expect(result.isValid).toBe(true);
      expect(result.normalizedPath).toBe('/flipbooks/amicus-2024/index.html');
    });

    it('should reject empty or null paths', () => {
      expect(validateFlipbookPath('').isValid).toBe(false);
      expect(validateFlipbookPath(null).isValid).toBe(false);
      expect(validateFlipbookPath(undefined).isValid).toBe(false);
    });

    it('should reject paths not starting with /flipbooks/', () => {
      const result = validateFlipbookPath('/pdfs/document.html');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must start with /flipbooks/');
    });

    it('should reject paths not ending with .html', () => {
      const result = validateFlipbookPath('/flipbooks/amicus-2024/index.pdf');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must end with .html');
    });

    it('should reject paths with path traversal attempts', () => {
      const result1 = validateFlipbookPath('/flipbooks/../etc/passwd.html');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('invalid characters');

      const result2 = validateFlipbookPath('/flipbooks//amicus/index.html');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('invalid characters');
    });

    it('should reject paths that are too short', () => {
      const result = validateFlipbookPath('/flipbooks/x.html');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too short');
    });

    it('should reject paths without package directory', () => {
      const result = validateFlipbookPath('/flipbooks/index.html');
      expect(result.isValid).toBe(false);
      // This path is caught by the "too short" check first
      expect(result.error).toBeTruthy();
    });
  });

  describe('isValidFlipbookPath', () => {
    it('should return true for valid paths', () => {
      expect(isValidFlipbookPath('/flipbooks/amicus-2024/index.html')).toBe(true);
    });

    it('should return false for invalid paths', () => {
      expect(isValidFlipbookPath('/pdfs/document.pdf')).toBe(false);
      expect(isValidFlipbookPath('')).toBe(false);
      expect(isValidFlipbookPath(null)).toBe(false);
    });
  });

  describe('normalizeFlipbookPath', () => {
    it('should return normalized path for valid paths', () => {
      expect(normalizeFlipbookPath('flipbooks/amicus-2024/index.html'))
        .toBe('/flipbooks/amicus-2024/index.html');
    });

    it('should return null for invalid paths', () => {
      expect(normalizeFlipbookPath('/pdfs/document.pdf')).toBe(null);
      expect(normalizeFlipbookPath('')).toBe(null);
    });
  });

  describe('getFlipbookPackageName', () => {
    it('should extract package name from valid paths', () => {
      expect(getFlipbookPackageName('/flipbooks/amicus-2024/index.html'))
        .toBe('amicus-2024');
      expect(getFlipbookPackageName('/flipbooks/law-review-vol-45/viewer.html'))
        .toBe('law-review-vol-45');
    });

    it('should return null for invalid paths', () => {
      expect(getFlipbookPackageName('/pdfs/document.pdf')).toBe(null);
      expect(getFlipbookPackageName('')).toBe(null);
      expect(getFlipbookPackageName(null)).toBe(null);
    });
  });
});
