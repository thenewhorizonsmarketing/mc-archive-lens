import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import "./FlipbookViewer.css";

interface FlipbookViewerProps {
  flipbookUrl: string;
  title: string;
  onClose: () => void;
  className?: string;
  pdfPath?: string; // Optional PDF fallback path
  onOpenPDF?: () => void; // Optional callback to open PDF viewer
}

export function FlipbookViewer({ 
  flipbookUrl, 
  title, 
  onClose, 
  className,
  pdfPath,
  onOpenPDF
}: FlipbookViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing flipbook...');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle iframe load success
  function handleIframeLoad() {
    // Complete the progress bar
    setLoadProgress(100);
    setLoadingMessage('Flipbook loaded successfully!');
    
    // Small delay to show completion message
    setTimeout(() => {
      setIsLoading(false);
      setLoadError(null);
    }, 300);
    
    // Clear timeout if load succeeds
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Additional check: verify iframe content loaded successfully
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        // Check if iframe has actual content
        iframe.contentWindow.addEventListener('error', () => {
          handleIframeError();
        });
      }
    } catch (error) {
      // Cross-origin restrictions may prevent access, which is fine
      console.warn('Unable to access iframe content for error detection:', error);
    }
  }

  // Handle iframe load error
  function handleIframeError() {
    setIsLoading(false);
    
    // Clear timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Provide user-friendly error message with fallback option
    if (pdfPath) {
      setLoadError('Failed to load flipbook. You can view the PDF version instead.');
    } else {
      setLoadError('Failed to load flipbook. The file may be missing or corrupted. Please contact support.');
    }
  }

  // Handle PDF fallback
  function handleOpenPDF() {
    if (onOpenPDF) {
      onOpenPDF();
    } else if (pdfPath) {
      // Default behavior: open PDF in new tab
      window.open(pdfPath, '_blank', 'noopener,noreferrer');
      onClose();
    }
  }

  // Handle Escape key to close viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Focus management - trap focus within viewer
  useEffect(() => {
    const viewer = document.querySelector('.flipbook-viewer');
    if (viewer) {
      const closeButton = viewer.querySelector('button');
      closeButton?.focus();
    }
  }, []);

  // Set loading timeout - if flipbook doesn't load within 30 seconds, show error
  useEffect(() => {
    loadTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setLoadError('Flipbook is taking too long to load. The file may be too large or your connection may be slow.');
      }
    }, 30000); // 30 second timeout

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isLoading]);

  // Simulate loading progress for better user feedback
  useEffect(() => {
    if (isLoading) {
      setLoadProgress(0);
      setLoadingMessage('Initializing flipbook...');
      
      // Simulate progress with realistic stages
      const stages = [
        { progress: 20, message: 'Loading flipbook assets...', delay: 500 },
        { progress: 40, message: 'Loading page images...', delay: 1500 },
        { progress: 60, message: 'Preparing interactive features...', delay: 2500 },
        { progress: 80, message: 'Almost ready...', delay: 4000 }
      ];

      stages.forEach(stage => {
        setTimeout(() => {
          if (isLoading) {
            setLoadProgress(stage.progress);
            setLoadingMessage(stage.message);
          }
        }, stage.delay);
      });

      // Gradual progress increase for smoother experience
      progressIntervalRef.current = setInterval(() => {
        setLoadProgress(prev => {
          if (prev >= 90) {
            // Stop at 90% until actual load completes
            return prev;
          }
          return prev + 1;
        });
      }, 200);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isLoading]);

  return (
    <div
      className={cn(
        "flipbook-viewer",
        "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="flipbook-title"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="assertive">
        Viewing flipbook: {title}. Press Escape to close.
      </div>

      {/* Header with title and controls */}
      <div className="flipbook-viewer__header flex items-center justify-between p-4 border-b bg-card">
        <div className="flex-1 min-w-0">
          <h2 
            id="flipbook-title" 
            className="text-2xl font-bold truncate"
          >
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Close Button - Touch-friendly 44x44px minimum */}
          <Button
            variant="kiosk"
            size="touch"
            onClick={onClose}
            aria-label="Close flipbook viewer and return to publications"
          >
            <X className="w-6 h-6 mr-2" />
            Close
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flipbook-viewer__content flex-1 relative overflow-hidden bg-muted/30">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-6 max-w-md w-full px-6">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="w-full space-y-3">
                <p className="text-lg text-center text-muted-foreground">{loadingMessage}</p>
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${loadProgress}%` }}
                    role="progressbar"
                    aria-valuenow={loadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Loading progress"
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {loadProgress}% complete
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
              <AlertCircle className="w-16 h-16 text-destructive" />
              <h3 className="text-xl font-semibold text-destructive">
                Unable to Load Flipbook
              </h3>
              <p className="text-muted-foreground">{loadError}</p>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {pdfPath && (
                  <Button
                    variant="kiosk"
                    size="touch"
                    onClick={handleOpenPDF}
                    className="flex-1"
                  >
                    View PDF Instead
                  </Button>
                )}
                <Button
                  variant={pdfPath ? "outline" : "kiosk"}
                  size="touch"
                  onClick={onClose}
                  className="flex-1"
                >
                  Return to Publications
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Iframe Embedding */}
        <iframe
          ref={iframeRef}
          src={flipbookUrl}
          title={title}
          className="flipbook-viewer__iframe w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          aria-label={`Interactive flipbook: ${title}`}
        />
      </div>
    </div>
  );
}
