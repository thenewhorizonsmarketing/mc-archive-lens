// Memory Management for Large Result Sets and Image Loading
export interface MemoryConfig {
  maxResultSetSize: number;
  maxImageCacheSize: number;
  maxImageCacheSizeMB: number;
  enableLazyLoading: boolean;
  enableVirtualization: boolean;
  gcThreshold: number;
  preloadDistance: number;
}

export interface MemoryMetrics {
  totalMemoryUsage: number;
  resultSetMemory: number;
  imageCacheMemory: number;
  cachedImages: number;
  totalResults: number;
  gcCollections: number;
  lastGcTime: number;
}

interface CachedImage {
  url: string;
  blob: Blob;
  size: number;
  lastAccessed: number;
  accessCount: number;
}

interface ResultPage {
  startIndex: number;
  endIndex: number;
  results: any[];
  size: number;
  lastAccessed: number;
}

export class MemoryManager {
  private config: MemoryConfig;
  private imageCache: Map<string, CachedImage> = new Map();
  private resultPages: Map<string, ResultPage> = new Map();
  private metrics: MemoryMetrics;
  private gcInterval: NodeJS.Timeout | null = null;
  private observers: Set<(metrics: MemoryMetrics) => void> = new Set();

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxResultSetSize: 10000,
      maxImageCacheSize: 100,
      maxImageCacheSizeMB: 50,
      enableLazyLoading: true,
      enableVirtualization: true,
      gcThreshold: 0.8, // Trigger GC at 80% capacity
      preloadDistance: 5,
      ...config
    };

    this.metrics = {
      totalMemoryUsage: 0,
      resultSetMemory: 0,
      imageCacheMemory: 0,
      cachedImages: 0,
      totalResults: 0,
      gcCollections: 0,
      lastGcTime: 0
    };

    this.startGarbageCollection();
  }

  /**
   * Manage large result sets with pagination and virtualization
   */
  manageResultSet<T>(
    results: T[],
    pageSize: number = 50,
    cacheKey: string = 'default'
  ): {
    getPage: (pageIndex: number) => T[];
    getTotalPages: () => number;
    preloadPage: (pageIndex: number) => void;
    clearCache: () => void;
  } {
    const totalPages = Math.ceil(results.length / pageSize);
    
    // Store results in pages
    for (let i = 0; i < totalPages; i++) {
      const startIndex = i * pageSize;
      const endIndex = Math.min(startIndex + pageSize, results.length);
      const pageResults = results.slice(startIndex, endIndex);
      
      const pageKey = `${cacheKey}_page_${i}`;
      const resultPage: ResultPage = {
        startIndex,
        endIndex,
        results: pageResults,
        size: this.estimateObjectSize(pageResults),
        lastAccessed: Date.now()
      };
      
      this.resultPages.set(pageKey, resultPage);
    }

    this.updateMetrics();

    return {
      getPage: (pageIndex: number) => {
        const pageKey = `${cacheKey}_page_${pageIndex}`;
        const page = this.resultPages.get(pageKey);
        
        if (page) {
          page.lastAccessed = Date.now();
          
          // Preload adjacent pages if enabled
          if (this.config.enableVirtualization) {
            this.preloadAdjacentPages(cacheKey, pageIndex, totalPages);
          }
          
          return page.results;
        }
        
        return [];
      },

      getTotalPages: () => totalPages,

      preloadPage: (pageIndex: number) => {
        // Page is already loaded during initialization
        const pageKey = `${cacheKey}_page_${pageIndex}`;
        const page = this.resultPages.get(pageKey);
        if (page) {
          page.lastAccessed = Date.now();
        }
      },

      clearCache: () => {
        // Remove all pages for this cache key
        for (const [key] of this.resultPages) {
          if (key.startsWith(`${cacheKey}_page_`)) {
            this.resultPages.delete(key);
          }
        }
        this.updateMetrics();
      }
    };
  }

  /**
   * Manage image loading with caching and lazy loading
   */
  async loadImage(
    url: string,
    options: {
      priority?: 'high' | 'normal' | 'low';
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {}
  ): Promise<string> {
    // Check cache first
    const cached = this.imageCache.get(url);
    if (cached) {
      cached.lastAccessed = Date.now();
      cached.accessCount++;
      return URL.createObjectURL(cached.blob);
    }

    // Check if we need to free up space
    if (this.shouldTriggerImageGC()) {
      this.garbageCollectImages();
    }

    try {
      // Fetch and process image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.statusText}`);
      }

      let blob = await response.blob();
      
      // Optimize image if needed
      if (options.maxWidth || options.maxHeight || options.quality) {
        blob = await this.optimizeImage(blob, options);
      }

      // Cache the image
      const cachedImage: CachedImage = {
        url,
        blob,
        size: blob.size,
        lastAccessed: Date.now(),
        accessCount: 1
      };

      this.imageCache.set(url, cachedImage);
      this.updateMetrics();

      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to load image:', url, error);
      throw error;
    }
  }

  /**
   * Preload images for better user experience
   */
  async preloadImages(urls: string[], priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
    const loadPromises = urls.map(async (url) => {
      try {
        await this.loadImage(url, { priority });
      } catch (error) {
        // Ignore preload errors
        console.warn('Failed to preload image:', url);
      }
    });

    // Don't wait for all to complete if priority is low
    if (priority === 'low') {
      // Fire and forget
      Promise.all(loadPromises);
    } else {
      await Promise.all(loadPromises);
    }
  }

  /**
   * Create lazy loading observer for images
   */
  createLazyLoadObserver(
    callback: (entries: IntersectionObserverEntry[]) => void
  ): IntersectionObserver {
    if (!this.config.enableLazyLoading) {
      throw new Error('Lazy loading is disabled');
    }

    return new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          callback(visibleEntries);
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1
      }
    );
  }

  /**
   * Get memory usage metrics
   */
  getMetrics(): MemoryMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection(): void {
    this.garbageCollectResults();
    this.garbageCollectImages();
    this.metrics.gcCollections++;
    this.metrics.lastGcTime = Date.now();
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.imageCache.clear();
    this.resultPages.clear();
    this.updateMetrics();
  }

  /**
   * Subscribe to memory metrics updates
   */
  subscribe(callback: (metrics: MemoryMetrics) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Shutdown memory manager
   */
  shutdown(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
    this.clearAllCaches();
    this.observers.clear();
  }

  /**
   * Preload adjacent pages for smooth scrolling
   */
  private preloadAdjacentPages(cacheKey: string, currentPage: number, totalPages: number): void {
    const distance = this.config.preloadDistance;
    
    for (let i = Math.max(0, currentPage - distance); 
         i <= Math.min(totalPages - 1, currentPage + distance); 
         i++) {
      if (i !== currentPage) {
        const pageKey = `${cacheKey}_page_${i}`;
        const page = this.resultPages.get(pageKey);
        if (page) {
          page.lastAccessed = Date.now();
        }
      }
    }
  }

  /**
   * Optimize image for better performance
   */
  private async optimizeImage(
    blob: Blob,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    }
  ): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const { maxWidth = img.width, maxHeight = img.height, quality = 0.8 } = options;
        
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (optimizedBlob) => resolve(optimizedBlob || blob),
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(blob);
      img.src = URL.createObjectURL(blob);
    });
  }

  /**
   * Estimate object size in bytes
   */
  private estimateObjectSize(obj: any): number {
    const jsonString = JSON.stringify(obj);
    return new Blob([jsonString]).size;
  }

  /**
   * Check if image garbage collection should be triggered
   */
  private shouldTriggerImageGC(): boolean {
    const currentSizeMB = this.metrics.imageCacheMemory / (1024 * 1024);
    const maxSizeMB = this.config.maxImageCacheSizeMB;
    
    return (
      this.imageCache.size >= this.config.maxImageCacheSize ||
      currentSizeMB >= maxSizeMB * this.config.gcThreshold
    );
  }

  /**
   * Garbage collect old result pages
   */
  private garbageCollectResults(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    for (const [key, page] of this.resultPages) {
      if (now - page.lastAccessed > maxAge) {
        this.resultPages.delete(key);
      }
    }
  }

  /**
   * Garbage collect old images
   */
  private garbageCollectImages(): void {
    const entries = Array.from(this.imageCache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    // Remove oldest entries until we're under the limit
    const targetSize = Math.floor(this.config.maxImageCacheSize * 0.7); // Remove to 70% capacity
    
    while (this.imageCache.size > targetSize && entries.length > 0) {
      const [url] = entries.shift()!;
      this.imageCache.delete(url);
    }
  }

  /**
   * Start automatic garbage collection
   */
  private startGarbageCollection(): void {
    this.gcInterval = setInterval(() => {
      if (this.shouldTriggerImageGC()) {
        this.garbageCollectImages();
      }
      this.garbageCollectResults();
      this.updateMetrics();
    }, 30000); // Run every 30 seconds
  }

  /**
   * Update memory metrics
   */
  private updateMetrics(): void {
    let resultSetMemory = 0;
    let totalResults = 0;
    
    for (const page of this.resultPages.values()) {
      resultSetMemory += page.size;
      totalResults += page.results.length;
    }

    let imageCacheMemory = 0;
    for (const image of this.imageCache.values()) {
      imageCacheMemory += image.size;
    }

    this.metrics = {
      ...this.metrics,
      totalMemoryUsage: resultSetMemory + imageCacheMemory,
      resultSetMemory,
      imageCacheMemory,
      cachedImages: this.imageCache.size,
      totalResults
    };

    // Notify observers
    for (const observer of this.observers) {
      observer(this.metrics);
    }
  }
}

// Global memory manager instance
let globalMemoryManager: MemoryManager | null = null;

/**
 * Get or create the global memory manager
 */
export function getMemoryManager(config?: Partial<MemoryConfig>): MemoryManager {
  if (!globalMemoryManager) {
    globalMemoryManager = new MemoryManager(config);
  }
  return globalMemoryManager;
}

/**
 * Shutdown the global memory manager
 */
export function shutdownMemoryManager(): void {
  if (globalMemoryManager) {
    globalMemoryManager.shutdown();
    globalMemoryManager = null;
  }
}

export default MemoryManager;