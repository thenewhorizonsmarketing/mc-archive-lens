import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { KioskSearchErrorBoundary } from '@/components/kiosk/KioskSearchErrorBoundary';
import { SearchInterface } from '@/components/search/SearchInterface';
import { useSearch } from '@/lib/search-context';
import { SearchResult } from '@/lib/database/types';
import '../styles/fullscreen-search.css';

interface FullscreenSearchPageProps {
  onClose?: () => void;
  initialQuery?: string;
}

interface NavigationContext {
  query: string;
  filters: Record<string, unknown>;
  fromPath?: string;
}

export default function FullscreenSearchPage({ 
  onClose, 
  initialQuery = '' 
}: FullscreenSearchPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Get query from URL params for deep linking support (Requirement 10.3)
  const queryFromUrl = searchParams.get('q') || initialQuery;
  
  // Navigation context to pass to child components (Requirement 10.3)
  const navigationContext: NavigationContext = {
    query: queryFromUrl,
    filters: {},
    fromPath: location.state?.from || '/'
  };
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the existing search context
  const { searchManager, isInitialized, error: searchError } = useSearch();

  // Handle close action with proper back navigation (Requirement 10.3)
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      // Navigate back to the page we came from, or home if no history
      const fromPath = navigationContext.fromPath || '/';
      navigate(fromPath);
    }
  }, [onClose, navigate, navigationContext.fromPath]);

  // Handle result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    console.log('[FullscreenSearch] handleResultSelect called with:', result);
    console.log('[FullscreenSearch] result.data:', result.data);
    
    // Store complete record data for accurate matching in AlumniRoom
    const searchSelection = {
      type: result.type,
      fullName: result.title,
      classYear: result.type === 'alumni' && result.data && 'class_year' in result.data ? result.data.class_year : undefined,
      photoFile: result.type === 'alumni' && result.data && 'photo_file' in result.data ? result.data.photo_file : undefined,
      role: result.type === 'alumni' && result.data && 'role' in result.data ? result.data.role : undefined,
      id: result.id
    };
    
    // Store in sessionStorage FIRST before any navigation
    sessionStorage.setItem('searchSelection', JSON.stringify(searchSelection));
    console.log('[FullscreenSearch] Stored selection in sessionStorage:', searchSelection);
    
    // Verify it was stored
    const stored = sessionStorage.getItem('searchSelection');
    console.log('[FullscreenSearch] Verified storage:', stored);
    
    console.log('[FullscreenSearch] Navigating to /alumni...');
    
    // Navigate directly - no need for onClose or delay since we're using routes
    navigate('/alumni');
  }, [navigate]);

  // Handle error boundary reset
  const handleErrorReset = useCallback(() => {
    console.log('[FullscreenSearch] Error boundary reset');
    // Could reload the page or reset state here if needed
  }, []);

  // Handle return to home from error boundary
  const handleReturnHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Handle escape key to exit fullscreen (Requirement 1.4)
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  // Handle browser back button (Requirement 10.3)
  useEffect(() => {
    const handlePopState = () => {
      // Browser back button was pressed, close the fullscreen search
      handleClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleClose]);

  // Prevent background scroll when fullscreen is active (Requirement 1.5)
  useEffect(() => {
    console.log('[FullscreenSearch] Setting up body scroll prevention');
    
    // Store original body styles
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;
    
    // Add class to body to prevent scroll
    document.body.classList.add('fullscreen-search-active');
    
    // Additional iOS Safari scroll prevention
    const preventTouchMove = (e: TouchEvent) => {
      // Allow scrolling within the fullscreen container
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        return;
      }
      e.preventDefault();
    };
    
    document.addEventListener('touchmove', preventTouchMove, { passive: false });
    
    // Cleanup on unmount OR route change
    return () => {
      console.log('[FullscreenSearch] Cleaning up body scroll prevention');
      document.body.classList.remove('fullscreen-search-active');
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.removeEventListener('touchmove', preventTouchMove);
    };
  }, []);

  // Implement focus trap within fullscreen container (Requirement 1.5)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // If shift+tab on first element, focus last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
      // If tab on last element, focus first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    // Focus first element on mount
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus();
    }

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div 
        className="fullscreen-search-container" 
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Fullscreen search interface"
      >
        <button
          className="fullscreen-search-close"
          onClick={handleClose}
          aria-label="Close search"
          type="button"
        >
          <X className="w-8 h-8" />
        </button>
        <div className="fullscreen-search-content">
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            <p className="text-xl text-gray-600">Initializing search...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (searchError || !searchManager) {
    return (
      <div 
        className="fullscreen-search-container" 
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Fullscreen search interface"
      >
        <button
          className="fullscreen-search-close"
          onClick={handleClose}
          aria-label="Close search"
          type="button"
        >
          <X className="w-8 h-8" />
        </button>
        <div className="fullscreen-search-content">
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <X className="w-16 h-16 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-800">Search Unavailable</h2>
            <p className="text-lg text-gray-600 text-center max-w-md">
              {searchError || 'Failed to initialize search. Please try again.'}
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fullscreen-search-container" 
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen search interface"
    >
      {/* Close button - 60x60px minimum (Requirement 1.3) */}
      <button
        className="fullscreen-search-close"
        onClick={handleClose}
        aria-label="Close search"
        type="button"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Main content area with error boundary */}
      <div className="fullscreen-search-content">
        <KioskSearchErrorBoundary
          onReset={handleErrorReset}
          onReturnHome={handleReturnHome}
        >
          <SearchInterface
            onResultSelect={handleResultSelect}
            placeholder="Search alumni, publications, photos, and faculty..."
            showFilters={true}
            showKeyboard={true}
            keyboardPosition="below"
            maxResults={50}
          />
        </KioskSearchErrorBoundary>
      </div>
    </div>
  );
}
