// Filename sanitization and generation utilities

export interface PhotoNamingOptions {
  sequenceNumber: number;
  firstName: string;
  lastName: string;
  role?: string;
  extension: string;
}

/**
 * Sanitizes a filename by removing problematic characters
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/['"\/\\:*?<>|]/g, '') // Remove problematic characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Trim leading/trailing underscores
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents
}

/**
 * Generates a standardized filename based on naming convention
 * Format: {sequence}-{FirstName}_{LastName}-{Role}.{ext}
 */
export function generateStandardFilename(options: PhotoNamingOptions): string {
  const { sequenceNumber, firstName, lastName, role, extension } = options;
  
  const sanitizedFirst = sanitizeFilename(firstName);
  const sanitizedLast = sanitizeFilename(lastName);
  const sanitizedRole = role ? `-${sanitizeFilename(role)}` : '';
  
  return `${sequenceNumber}-${sanitizedFirst}_${sanitizedLast}${sanitizedRole}.${extension}`;
}

/**
 * Extracts the file extension from a filename
 */
export function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  return ext.replace(/['"]/g, ''); // Remove quotes from extension
}

/**
 * Extracts the base filename without path and extension
 */
export function getBaseFilename(filepath: string): string {
  // Remove path
  const filename = filepath.split('/').pop() || filepath;
  // Remove extension
  return filename.split('.')[0] || filename;
}
