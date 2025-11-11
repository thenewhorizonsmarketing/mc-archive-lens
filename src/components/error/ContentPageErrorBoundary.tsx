// Content Page Error Boundary Component
// Provides error handling for content pages (Alumni, Publications, Photos, Faculty)
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
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
 * ContentPageErrorBoundary Component
 * 
 * Error boundary for content pages with:
 * - Automatic retry for transient errors (up to 3 attempts)
 * - User-friendly error messages
 * - Recovery options (retry, reset, return home)
 * - Error logging for debugging
 * 
 * Requirements: 9.1, 9.2, 9.4
 */
export class ContentPageErrorBoundary extends Component<Props, State> {
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
    console.error('[ContentPageErrorBoundary] Error caught:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error for debugging
    this.logError(error, errorInfo);

    // Attempt auto-recovery for transient errors
    if (this.isTransientError(error) && this.state.retryCount < this.maxRetries) {
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
   * Requirements: 9.4
   */
  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      contentType: this.props.contentType,
      retryCount: this.state.retryCount,
      context: 'content-page'
    };

    console.error('[ContentPageErrorBoundary] Error Report:', errorReport);
    
    try {
      const existingErrors = JSON.parse(localStorage.getItem('contentPageErrors') || '[]');
      existingErrors.push(errorReport);
      // Keep only the last 20 errors
      const recentErrors = existingErrors.slice(-20);
      localStorage.setItem('contentPageErrors', JSON.stringify(recentErrors));
    } catch (storageError) {
      console.error('[ContentPageErrorBoundary] Failed to store error report:', storageError);
    }
  };

  /**
   * Determine if error is transient and can be auto-recovered
   * Requirements: 9.2
   */
  private isTransientError = (error: Error): boolean => {
    const transientPatterns = [
      /network/i,
      /timeout/i,
      /temporary/i,
      /unavailable/i,
      /connection/i,
      /fetch/i
    ];

    return transientPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  };

  /**
   * Attempt automatic recovery for transient errors
   * Requirements: 9.2
   */
  private attemptAutoRecovery = () => {
    if (this.state.retryCount >= this.maxRetries) {
      console.log('[ContentPageErrorBoundary] Max retries reached, manual recovery required');
      return;
    }

    this.setState({ isRecovering: true });

    // Wait 2 seconds before attempting recovery
    this.autoRecoveryTimer = setTimeout(() => {
      console.log('[ContentPageErrorBoundary] Attempting auto-recovery...');
      this.handleRetry();
    }, 2000);
  };

  /**
   * Handle manual retry
   * Requirements: 9.1
   */
  private handleRetry = () => {
    if (this.autoRecoveryTimer) {
      clearTimeout(this.autoRecoveryTimer);
      this.autoRecoveryTimer = null;
    }

    if (this.state.retryCount < this.maxRetries) {
      console.log(`[ContentPageErrorBoundary] Retry attempt ${this.state.retryCount + 1}/${this.maxRetries}`);
      
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
   * Requirements: 9.1
   */
  private handleReset = () => {
    if (this.autoRecoveryTimer) {
      clearTimeout(this.autoRecoveryTimer);
      this.autoRecoveryTimer = null;
    }

    console.log('[ContentPageErrorBoundary] Resetting error boundary');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    });
  };

  /**
   * Return to home page
   * Requirements: 9.1
   */
  private handleReturnHome = () => {
    console.log('[ContentPageErrorBoundary] Returning to home');
    
    if (this.props.onReturnHome) {
      this.props.onReturnHome();
    } else {
      window.location.href = '/';
    }
  };

  /**
   * Get user-friendly error message based on content type
   * Requirements: 9.1
   */
  private getUserFriendlyMessage = (): string => {
    const error = this.state.error;
    const { contentType } = this.props;
    
    if (!error) return 'An unexpected error occurred';

    // Check for specific error types
    if (error.message.includes('database') || error.message.includes('FTS5')) {
      return `Unable to load ${contentType} data. The database may be temporarily unavailable.`;
    }
    
    if (error.message.includes('network') || error.message.includes('connection')) {
      return `Connection issue detected while loading ${contentType} data.`;
    }
    
    if (error.message.includes('timeout')) {
      return `Loading ${contentType} data is taking longer than expected.`;
    }

    return `An error occurred while loading ${contentType} data.`;
  };

  /**
   * Get content type display name
   */
  private getContentTypeDisplayName = (): string => {
    const { contentType } = this.props;
    const displayNames = {
      alumni: 'Alumni',
      publication: 'Publications',
      photo: 'Photos',
      faculty: 'Faculty'
    };
    return displayNames[contentType] || contentType;
  };

  render() {
    if (this.state.hasError) {
      const canRetry = this.state.retryCount < this.maxRetries;
      const message = this.getUserFriendlyMessage();
      const displayName = this.getContentTypeDisplayName();

      return (
        <div 
          className="content-page-error-boundary min-h-screen flex items-center justify-center bg-background p-8"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-2xl w-full space-y-6">
            {/* Error Icon and Message */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-destructive" aria-hidden="true" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-foreground">
                {displayName} Unavailable
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

            {/* Recovery Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Try Again Button */}
              {canRetry && !this.state.isRecovering && (
                <Button
                  onClick={this.handleRetry}
                  size="lg"
                  className="h-14 text-lg"
                  aria-label={`Try again (${this.maxRetries - this.state.retryCount} attempts remaining)`}
                >
                  <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" />
                  Try Again ({this.maxRetries - this.state.retryCount} left)
                </Button>
              )}

              {/* Reset Button */}
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="lg"
                className="h-14 text-lg"
                aria-label="Reset page"
                disabled={this.state.isRecovering}
              >
                <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" />
                Reset Page
              </Button>

              {/* Return Home Button */}
              <Button
                onClick={this.handleReturnHome}
                variant="secondary"
                size="lg"
                className="h-14 text-lg md:col-span-2"
                aria-label="Return to home page"
                disabled={this.state.isRecovering}
              >
                <Home className="w-5 h-5 mr-2" aria-hidden="true" />
                Return to Home
              </Button>
            </div>

            {/* Helpful Tips */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                What you can try:
              </h2>
              <ul className="space-y-2 text-base text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Wait a moment and try again</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Return to the home page and try a different section</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Use the search feature to find specific content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Contact staff if the problem continues</span>
                </li>
              </ul>
            </div>

            {/* Error details for debugging (development only) */}
            {this.state.error && process.env.NODE_ENV === 'development' && (
              <details className="bg-muted rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Bug className="w-4 h-4" />
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
                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-3">
                      <p className="font-semibold mb-1">Component Stack:</p>
                      <pre className="text-muted-foreground whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
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

export default ContentPageErrorBoundary;
