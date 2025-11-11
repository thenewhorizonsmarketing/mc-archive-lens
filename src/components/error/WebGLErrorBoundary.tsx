import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
  onWebGLError?: () => void;
}

interface State {
  hasWebGLError: boolean;
  error: Error | null;
}

/**
 * WebGL Error Boundary
 * Catches WebGL-specific errors and activates 2D fallback
 */
export class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasWebGLError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if error is WebGL-related
    const isWebGLError = 
      error.message.includes('WebGL') ||
      error.message.includes('THREE') ||
      error.message.includes('context lost') ||
      error.message.includes('shader');
    
    if (isWebGLError) {
      return { hasWebGLError: true, error };
    }
    
    // Re-throw non-WebGL errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[WebGLErrorBoundary] Caught WebGL error:', error);
    console.error('[WebGLErrorBoundary] Error info:', errorInfo);
    
    this.setState({ error });
    
    // Notify parent component
    if (this.props.onWebGLError) {
      this.props.onWebGLError();
    }
  }

  render(): ReactNode {
    if (this.state.hasWebGLError) {
      console.warn('[WebGLErrorBoundary] Activating 2D fallback due to WebGL error');
      return this.props.fallback;
    }

    return this.props.children;
  }
}
