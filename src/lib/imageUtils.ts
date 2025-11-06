import { AlumniRecord } from "@/types";

/**
 * Get the photo URL for an alumni record
 * Supports multiple path configurations
 */
export function getPhotoUrl(alumnus: AlumniRecord): string | null {
  if (!alumnus.photo_file) return null;

  if (alumnus.uploaded_photo_url) {
    return alumnus.uploaded_photo_url;
  }

  // If it's already a full URL, return it
  if (alumnus.photo_file.startsWith('http')) {
    return alumnus.photo_file;
  }
  
  // Use composite_image_path if available
  if (alumnus.composite_image_path) {
    return alumnus.composite_image_path;
  }
  
  // Construct path from year and filename
  // Assumes photos are in /photos/{year}/ directory
  return `/photos/${alumnus.grad_year}/${alumnus.photo_file}`;
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
