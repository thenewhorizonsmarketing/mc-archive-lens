// Error Boundary for Search Components
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class SearchErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SearchErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error to monitoring service (if available)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to your error monitoring service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('Error Report:', errorReport);
    
    // Store in localStorage for admin review
    try {
      const existingErrors = JSON.parse(localStorage.getItem('searchErrors') || '[]');
      existingErrors.push(errorReport);
      // Keep only the last 10 errors
      const recentErrors = existingErrors.slice(-10);
      localStorage.setItem('searchErrors', JSON.stringify(recentErrors));
    } catch (storageError) {
      console.error('Failed to store error report:', storageError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const isSearchError = this.state.error?.message.includes('search') || 
                           this.state.error?.message.includes('FTS5') ||
                           this.state.error?.message.includes('database');

      return (
        <Card className="error-boundary max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Search System Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isSearchError 
                  ? 'The search system encountered an error. This might be due to database connectivity issues or corrupted search indexes.'
                  : 'An unexpected error occurred in the search interface.'
                }
              </AlertDescription>
            </Alert>

            {/* Error Details (if enabled) */}
            {this.props.showDetails && this.state.error && (
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Bug className="h-4 w-4" />
                    <span>Error Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-mono bg-white p-3 rounded border">
                    <p className="text-red-600 font-semibold mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                      </pre>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recovery Actions */}
            <div className="space-y-3">
              <h4 className="font-medium">Recovery Options:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Retry ({this.maxRetries - this.state.retryCount} left)</span>
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  onClick={this.handleReset}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset Component</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleReload}
                  className="flex items-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Reload Page</span>
                </Button>
                
                <Button 
                  variant="secondary"
                  onClick={() => window.location.href = '/'}
                  className="flex items-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Go Home</span>
                </Button>
              </div>
            </div>

            {/* Fallback Instructions */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <h4 className="font-medium text-blue-800 mb-2">Alternative Options:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use the browse functionality in each room</li>
                  <li>• Try searching with simpler terms</li>
                  <li>• Contact system administrator if the problem persists</li>
                  <li>• Press Ctrl+Shift+A to access admin panel (if authorized)</li>
                </ul>
              </CardContent>
            </Card>

            {/* Retry Information */}
            {this.state.retryCount > 0 && (
              <div className="text-sm text-gray-600">
                <p>Retry attempts: {this.state.retryCount} / {this.maxRetries}</p>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default SearchErrorBoundary;