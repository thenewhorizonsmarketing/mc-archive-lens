import { AlumniRecord } from "@/types";

/**
 * Get the photo URL for an alumni record
 * Supports multiple path configurations
 */
export function getPhotoUrl(alumnus: AlumniRecord): string | null {
  // Check photo_file first (standard CSV data)
  if (alumnus.photo_file) {
    // If it's already a full URL, return it
    if (alumnus.photo_file.startsWith('http') || alumnus.photo_file.startsWith('/')) {
      return alumnus.photo_file;
    }
    // Construct path from year and filename
    return `/photos/${alumnus.grad_year}/${alumnus.photo_file}`;
  }
  
  // Check portrait_path (from search results or database)
  if (alumnus.portrait_path) {
    // If it's already a full URL, return it
    if (alumnus.portrait_path.startsWith('http') || alumnus.portrait_path.startsWith('/')) {
      return alumnus.portrait_path;
    }
    return `/photos/${alumnus.portrait_path}`;
  }
  
  // Check composite_image_path
  if (alumnus.composite_image_path) {
    if (alumnus.composite_image_path.startsWith('http') || alumnus.composite_image_path.startsWith('/')) {
      return alumnus.composite_image_path;
    }
    return `/photos/${alumnus.composite_image_path}`;
  }
  
  return null;
}

/**
 * Get initials from full name for placeholder
 */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Preload an image and return a promise
 */
export function preloadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
