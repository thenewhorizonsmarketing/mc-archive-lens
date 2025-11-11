// Kiosk Search Error Boundary Component
// Optimized for fullscreen kiosk mode with touch-friendly recovery options
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  onReturnHome?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRecovering: boolean;
}

/**
 * KioskSearchErrorBoundary Component
 * 
 * Error boundary specifically designed for kiosk search interface with:
 * - Touch-optimized recovery buttons (60x60px minimum)
 * - Auto-recovery for transient errors
 * - User-friendly error messages
 * - Logging for debugging
 * - Return to home functionality
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.6
 */
export class KioskSearchErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private autoRecoveryTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[KioskSearchErrorBoundary] Error caught:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error for debugging
    this.logError(error, errorInfo);

    // Attempt auto-recovery for transient errors
    if (this.isTransientError(error)) {
      this.attemptAutoRecovery();
    }
  }

  componentWillUnmount() {
    if (this.autoRecoveryTimer) {
      clearTimeout(this.autoRecoveryTimer);
    }
  }

  /**
   * Log error to localStorage for admin review
   * Requirements: 8.1
   */
  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
      context: 'kiosk-search'
    };

    console.error('[KioskSearchErrorBoundary] Error Report:', errorReport);
    
    try {
      const existingErrors = JSON.parse(localStorage.getItem('kioskSearchErrors') || '[]');
      existingErrors.push(errorReport);
      // Keep only the last 20 errors
      const recentErrors = existingErrors.slice(-20);
      localStorage.setItem('kioskSearchErrors', JSON.stringify(recentErrors));
    } catch (storageError) {
      console.error('[KioskSearchErrorBoundary] Failed to store error report:', storageError);
    }
  };

  /**
   * Determine if error is transient and can be auto-recovered
   */
  private isTransientError = (error: Error): boolean => {
    const transientPatterns = [
      /network/i,
      /timeout/i,
      /temporary/i,
      /unavailable/i,
      /connection/i
    ];

    return transientPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  };

  /**
   * Attempt automatic recovery for transient errors
   * Requirements: 8.5
   */
  private attemptAutoRecovery = () => {
    if (this.state.retryCount >= this.maxRetries) {
      console.log('[KioskSearchErrorBoundary] Max retries reached, manual recovery required');
      return;
    }

    this.setState({ isRecovering: true });

    // Wait 3 seconds before attempting recovery
    this.autoRecoveryTimer = setTimeout(() => {
      console.log('[KioskSearchErrorBoundary] Attempting auto-recovery...');
      this.handleRetry();
    }, 3000);
  };

  /**
   * Handle manual retry
   * Requirements: 8.3
   */
  private handleRetry = () => {
    if (this.autoRecoveryTimer) {
      clearTimeout(this.autoRecoveryTimer);
      this.autoRecoveryTimer = null;
    }

    if (this.state.retryCount < this.maxRetries) {
      console.log(`[KioskSearchErrorBoundary] Retry attempt ${this.state.retryCount + 1}/${this.maxRetries}`);
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRecovering: false
      }));
    }
  };

  /**
   * Reset error boundary to initial state
   */
  private handleReset = () => {
    if (this.autoRecoveryTimer) {
      clearTimeout(this.autoRecoveryTimer);
      this.autoRecoveryTimer = null;
    }

    console.log('[KioskSearchErrorBoundary] Resetting error boundary');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    });

    this.props.onReset?.();
  };

  /**
   * Return to home page
   * Requirements: 8.6
   */
  private handleReturnHome = () => {
    console.log('[KioskSearchErrorBoundary] Returning to home');
    
    if (this.props.onReturnHome) {
      this.props.onReturnHome();
    } else {
      window.location.href = '/';
    }
  };

  /**
   * Get user-friendly error message
   * Requirements: 8.2
   */
  private getUserFriendlyMessage = (): string => {
    const error = this.state.error;
    if (!error) return 'An unexpected error occurred';

    // Check for specific error types
    if (error.message.includes('database') || error.message.includes('FTS5')) {
      return 'Search temporarily unavailable. Please try again.';
    }
    
    if (error.message.includes('network') || error.message.includes('connection')) {
      return 'Connection issue detected. Retrying...';
    }
    
    if (error.message.includes('timeout')) {
      return 'Search is taking longer than expected. Please try again.';
    }

    return 'Search system encountered an error. Please try again.';
  };

  render() {
    if (this.state.hasError) {
      const canRetry = this.state.retryCount < this.maxRetries;
      const message = this.getUserFriendlyMessage();

      return (
        <div 
          className="kiosk-search-error-boundary flex items-center justify-center h-full bg-background p-8"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-2xl w-full space-y-6">
            {/* Error Icon and Message */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-destructive" aria-hidden="true" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-foreground">
                Search Unavailable
              </h1>
              
              <p className="text-xl text-muted-foreground">
                {message}
              </p>

              {/* Auto-recovery indicator */}
              {this.state.isRecovering && (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />
                  <span className="text-lg">Attempting to recover...</span>
                </div>
              )}

              {/* Retry count indicator */}
              {this.state.retryCount > 0 && !this.state.isRecovering && (
                <p className="text-sm text-muted-foreground">
                  Retry attempts: {this.state.retryCount} / {this.maxRetries}
                </p>
              )}
            </div>

            {/* Recovery Actions - Touch-optimized buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Try Again Button */}
              {canRetry && !this.state.isRecovering && (
                <button
                  onClick={this.handleRetry}
                  className="h-16 px-6 flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium touch-manipulation"
                  aria-label={`Try again (${this.maxRetries - this.state.retryCount} attempts remaining)`}
                >
                  <RefreshCw className="w-6 h-6" aria-hidden="true" />
                  <span>Try Again ({this.maxRetries - this.state.retryCount} left)</span>
                </button>
              )}

              {/* Reset Button */}
              <button
                onClick={this.handleReset}
                className="h-16 px-6 flex items-center justify-center gap-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors text-lg font-medium touch-manipulation"
                aria-label="Reset search"
                disabled={this.state.isRecovering}
              >
                <X className="w-6 h-6" aria-hidden="true" />
                <span>Reset Search</span>
              </button>

              {/* Return Home Button */}
              <button
                onClick={this.handleReturnHome}
                className="h-16 px-6 flex items-center justify-center gap-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-lg font-medium touch-manipulation md:col-span-2"
                aria-label="Return to home page"
                disabled={this.state.isRecovering}
              >
                <Home className="w-6 h-6" aria-hidden="true" />
                <span>Return to Home</span>
              </button>
            </div>

            {/* Helpful Tips */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                What you can try:
              </h2>
              <ul className="space-y-2 text-base text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Wait a moment and try your search again</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Use simpler search terms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Browse content directly from the home page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Contact staff if the problem continues</span>
                </li>
              </ul>
            </div>

            {/* Error details for debugging (hidden from users) */}
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <details className="bg-muted rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  Technical Details (Development Only)
                </summary>
                <div className="mt-3 text-xs font-mono bg-background p-3 rounded border overflow-x-auto">
                  <p className="text-destructive font-semibold mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="text-muted-foreground whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default KioskSearchErrorBoundary;
