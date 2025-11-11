// Image optimization utilities for lazy loading and responsive images

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Generate optimized image URL with size parameters
 * This is a placeholder for future server-side image optimization
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  _options: ImageOptimizationOptions = {}
): string {
  // For now, return original URL
  // In production, this could append query parameters for image CDN
  // or use a service like Cloudinary, imgix, etc.
  
  // Example: If using a CDN that supports URL parameters
  // const { width, height, quality = 80, format } = options;
  // const url = new URL(originalUrl);
  // if (width) url.searchParams.set('w', width.toString());
  // if (height) url.searchParams.set('h', height.toString());
  // if (quality) url.searchParams.set('q', quality.toString());
  // if (format) url.searchParams.set('f', format);
  // return url.toString();
  
  return originalUrl;
}

/**
 * Calculate optimal thumbnail size based on viewport and display context
 */
export function calculateThumbnailSize(
  viewMode: 'grid' | 'list',
  containerWidth: number
): { width: number; height: number } {
  if (viewMode === 'grid') {
    // Grid view: responsive columns
    const columns = containerWidth > 1200 ? 4 : containerWidth > 768 ? 3 : containerWidth > 480 ? 2 : 1;
    const gap = 16;
    const width = Math.floor((containerWidth - gap * (columns + 1)) / columns);
    const height = Math.floor(width * 0.75); // 4:3 aspect ratio
    
    return { width, height };
  } else {
    // List view: fixed thumbnail size
    return { width: 120, height: 120 };
  }
}

/**
 * Preload images for better perceived performance
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
          img.src = url;
        })
    )
  );
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    const img = new Image();
    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = webP;
  });
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  baseUrl: string,
  sizes: number[] = [320, 640, 960, 1280, 1920]
): string {
  return sizes
    .map((size) => `${getOptimizedImageUrl(baseUrl, { width: size })} ${size}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(
  viewMode: 'grid' | 'list',
  maxWidth: number = 1200
): string {
  if (viewMode === 'grid') {
    return `(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: ${maxWidth}px) 33vw, 25vw`;
  } else {
    return '120px';
  }
}

/**
 * Create a blur placeholder data URL
 * This is a simple implementation - in production, you'd generate these server-side
 */
export function createBlurPlaceholder(width: number = 10, height: number = 10): string {
  // Create a tiny canvas with a gradient
  if (typeof document === 'undefined') {
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  // Create a simple gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f0f0f0');
  gradient.addColorStop(1, '#e0e0e0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Lazy load image with Intersection Observer
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  options: IntersectionObserverInit = {}
): () => void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        img.src = src;
        observer.disconnect();
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.01,
    ...options
  });

  observer.observe(img);

  // Return cleanup function
  return () => observer.disconnect();
}

/**
 * Estimate image file size based on dimensions and format
 */
export function estimateImageSize(
  width: number,
  height: number,
  format: 'webp' | 'jpeg' | 'png' = 'jpeg',
  quality: number = 80
): number {
  const pixels = width * height;
  
  // Rough estimates in bytes per pixel
  const bytesPerPixel = {
    webp: 0.1 * (quality / 100),
    jpeg: 0.15 * (quality / 100),
    png: 0.5
  };
  
  return Math.round(pixels * bytesPerPixel[format]);
}

/**
 * Check if image should be lazy loaded based on position
 */
export function shouldLazyLoad(element: HTMLElement, threshold: number = 2): boolean {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  
  // Load if within threshold viewports
  return rect.top > viewportHeight * threshold;
}
