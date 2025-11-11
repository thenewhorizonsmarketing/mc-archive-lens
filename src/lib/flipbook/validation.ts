/**
 * Flipbook path validation utilities
 * Validates flipbook paths before rendering to ensure they meet expected format
 */

export interface FlipbookValidationResult {
  isValid: boolean;
  error?: string;
  normalizedPath?: string;
}

/**
 * Validates a flipbook path to ensure it meets the expected format and structure
 * 
 * @param path - The flipbook path to validate
 * @returns Validation result with isValid flag, optional error message, and normalized path
 */
export function validateFlipbookPath(path: string | undefined | null): FlipbookValidationResult {
  // Check if path exists
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return {
      isValid: false,
      error: 'Flipbook path is empty or undefined'
    };
  }

  const trimmedPath = path.trim();

  // Normalize path - ensure it starts with /
  const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;

  // Check if path starts with /flipbooks/
  if (!normalizedPath.startsWith('/flipbooks/')) {
    return {
      isValid: false,
      error: 'Flipbook path must start with /flipbooks/'
    };
  }

  // Check if path ends with .html
  if (!normalizedPath.endsWith('.html')) {
    return {
      isValid: false,
      error: 'Flipbook path must end with .html'
    };
  }

  // Check for invalid characters that could indicate path traversal attacks
  if (normalizedPath.includes('..') || normalizedPath.includes('//')) {
    return {
      isValid: false,
      error: 'Flipbook path contains invalid characters'
    };
  }

  // Check minimum path length (e.g., /flipbooks/x/index.html = 23 chars minimum)
  if (normalizedPath.length < 23) {
    return {
      isValid: false,
      error: 'Flipbook path is too short to be valid'
    };
  }

  // Path structure validation: should be /flipbooks/{package-name}/{file}.html
  const pathParts = normalizedPath.split('/').filter(part => part.length > 0);
  if (pathParts.length < 3) {
    return {
      isValid: false,
      error: 'Flipbook path must include package directory and HTML file'
    };
  }

  // Validate that the first part is 'flipbooks'
  if (pathParts[0] !== 'flipbooks') {
    return {
      isValid: false,
      error: 'Flipbook path must start with /flipbooks/'
    };
  }

  // All validations passed
  return {
    isValid: true,
    normalizedPath
  };
}

/**
 * Checks if a flipbook path exists and is accessible
 * Note: This performs a basic format check. Actual file existence
 * can only be verified by attempting to load the resource.
 * 
 * @param path - The flipbook path to check
 * @returns True if path format is valid
 */
export function isValidFlipbookPath(path: string | undefined | null): boolean {
  return validateFlipbookPath(path).isValid;
}

/**
 * Normalizes a flipbook path to ensure consistent format
 * 
 * @param path - The flipbook path to normalize
 * @returns Normalized path or null if invalid
 */
export function normalizeFlipbookPath(path: string | undefined | null): string | null {
  const result = validateFlipbookPath(path);
  return result.isValid ? result.normalizedPath! : null;
}

/**
 * Extracts the package name from a flipbook path
 * 
 * @param path - The flipbook path
 * @returns Package name or null if path is invalid
 */
export function getFlipbookPackageName(path: string | undefined | null): string | null {
  const result = validateFlipbookPath(path);
  if (!result.isValid || !result.normalizedPath) {
    return null;
  }

  const pathParts = result.normalizedPath.split('/').filter(part => part.length > 0);
  // pathParts[0] = 'flipbooks', pathParts[1] = package name
  return pathParts.length >= 2 ? pathParts[1] : null;
}
