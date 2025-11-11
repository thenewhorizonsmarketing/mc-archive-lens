import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Kiosk Error Boundary
 * Catches React errors and shows fallback UI
 */
export class KioskErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[KioskErrorBoundary] Caught error:', error);
    console.error('[KioskErrorBoundary] Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Reload the page to reset state
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-8">
          <div className="max-w-2xl text-center">
            <h1 className="text-4xl font-bold mb-4">System Error</h1>
            <p className="text-xl mb-8">
              The kiosk encountered an unexpected error.
            </p>
            
            {this.state.error && (
              <div className="bg-gray-800 p-4 rounded-lg mb-8 text-left">
                <p className="font-mono text-sm text-red-400">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            
            <button
              onClick={this.handleReset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Restart Kiosk
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
