/**
 * AlgeriaTrade.dz - React Error Boundary with Sentry Integration
 * 
 * Features:
 * - Automatic error capture to Sentry
 * - Graceful fallback UI
 * - Error recovery mechanism
 * - Component stack tracing
 * - Production/development mode handling
 * - Customizable fallback UI
 */

'use client';

import React from 'react';
import { captureException, addBreadcrumb } from './sentry';

// ===========================================
// Types & Interfaces
// ===========================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  componentName?: string;
  showErrorDetails?: boolean;
  maxRetries?: number;
}

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  retryCount: number;
  componentStack: string | null;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
  retryCount: number;
  eventId: string | null;
}

// ===========================================
// Default Fallback Component
// ===========================================

function DefaultFallback({ 
  error, 
  resetErrorBoundary, 
  retryCount,
  componentStack 
}: FallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4" role="alert">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-red-200 dark:border-red-800 overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-red-600 dark:text-red-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Something went wrong
              </h2>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                An unexpected error occurred while rendering this component.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Error Message Preview */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded px-4 py-3 mb-4 font-mono text-sm text-gray-700 dark:text-gray-300 overflow-auto max-h-20">
            {error.message || 'Unknown error'}
          </div>

          {/* Toggle Details */}
          {componentStack && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
            >
              {showDetails ? 'Hide' : 'Show'} technical details
            </button>
          )}

          {/* Detailed Error Info (Collapsible) */}
          {showDetails && componentStack && (
            <pre className="bg-gray-900 text-green-400 rounded px-4 py-3 text-xs overflow-auto max-h-60 mb-4 whitespace-pre-wrap break-all">
              {componentStack}
            </pre>
          )}

          {/* Retry Count Warning */}
          {retryCount > 0 && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
              Retry attempt #{retryCount}. If this persists, please contact support.
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={resetErrorBoundary}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Reload Page
            </button>
          </div>

          {/* Support Link */}
          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            Need help?{' '}
            <a 
              href="/support" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Contact Support
            </a>{' '}
            or{' '}
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`Error: ${error.message}\n\nStack:\n${componentStack}`);
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Copy Error Details
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// Main Error Boundary Component
// ===========================================

export class SentryErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      componentStack: null,
      retryCount: 0,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Update state with component stack
    this.setState({
      componentStack: errorInfo.componentStack,
    });

    // Add breadcrumb before capturing
    addBreadcrumb({
      category: 'errorboundary',
      message: `Error caught in ${this.props.componentName || 'unknown'}: ${error.message}`,
      level: 'error',
      data: {
        componentName: this.props.componentName,
        errorName: error.name,
      },
    });

    // Capture to Sentry
    const eventId = captureException(error, {
      tags: {
        component: this.props.componentName || 'UnknownComponent',
        isErrorBoundary: 'true',
      },
      extra: {
        componentStack: errorInfo.componentStack,
        reactVersion: React.version,
        retryCount: this.state.retryCount,
      },
      context: 'react',
      level: 'error',
    });

    // Update event ID for user feedback
    this.setState({ eventId: eventId || null });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = (): void => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      // Max retries exceeded, don't allow more retries
      return;
    }

    this.setState((prevState) => ({
      hasError: false,
      error: null,
      componentStack: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Call onReset if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const { fallback: Fallback = DefaultFallback } = this.props;
      
      return (
        <Fallback
          error={this.state.error!}
          resetErrorBoundary={this.resetErrorBoundary}
          retryCount={this.state.retryCount}
          componentStack={this.state.componentStack}
        />
      );
    }

    return this.props.children;
  }
}

// ===========================================
// Higher-Order Component Version
// ===========================================

export function withSentryErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    componentName?: string;
    fallback?: React.ComponentType<FallbackProps>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }
): React.FC<P> {
  const displayName = options?.componentName || 
                     WrappedComponent.displayName || 
                     WrappedComponent.name || 
                     'Component';

  const WithErrorBoundaryWrapper: React.FC<P> = (props) => (
    <SentryErrorBoundary
      componentName={displayName}
      fallback={options?.fallback}
      onError={options?.onError}
    >
      <WrappedComponent {...props} />
    </SentryErrorBoundary>
  );

  WithErrorBoundaryWrapper.displayName = `withSentryErrorBoundary(${displayName})`;

  return WithErrorBoundaryWrapper;
}

// ===========================================
// Hook for Imperative Error Handling
// ===========================================

export function useErrorHandler(): (error: unknown) => void {
  return React.useCallback((error: unknown) => {
    // Capture to Sentry
    captureException(error instanceof error ? error : new Error(String(error)), {
      tags: {
        source: 'useErrorHandler',
      },
      level: 'error',
    });
  }, []);
}

// ===========================================
// Exports
// ===========================================

export default SentryErrorBoundary;
export { DefaultFallback };
