// Lazy loading image component for virtual scrolling
import React, { useState, useEffect, useRef } from 'react';

export interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%230C2340" width="400" height="300"/%3E%3Ctext fill="%23C99700" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24"%3ELoading...%3C/text%3E%3C/svg%3E',
  onLoad,
  onError,
  threshold = 0.1
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin: '50px' // Start loading slightly before visible
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Error placeholder
  if (hasError) {
    return (
      <div
        className={`lazy-image-error ${className}`}
        style={{ width, height }}
      >
        <svg
          viewBox="0 0 400 300"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <rect fill="#0C2340" width="400" height="300" />
          <text
            fill="#C99700"
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fontFamily="sans-serif"
            fontSize="20"
          >
            Image not found
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className={`lazy-image-container ${className}`} style={{ width, height }}>
      <img
        ref={imgRef}
        src={isInView ? src : placeholder}
        alt={alt}
        width={width}
        height={height}
        className={`lazy-image ${isLoaded ? 'loaded' : 'loading'}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
      {!isLoaded && (
        <div className="lazy-image-skeleton">
          <div className="skeleton-shimmer" />
        </div>
      )}
    </div>
  );
};

export default LazyImage;
