'use client';

import React from 'react';

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in the child component tree
 * 
 * Purpose: Provides graceful error handling for React components by catching
 * errors during rendering, in lifecycle methods, and in constructors of the
 * whole tree below them.
 * 
 * Contract:
 * - Preconditions: Wraps components that might throw errors
 * - Postconditions: Displays fallback UI when errors occur
 * - Side Effects: Logs errors to console for debugging
 * - Error Handling: Catches and displays errors instead of crashing the app
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console for debugging
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-600 text-center mb-4">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Default fallback component for ErrorBoundary
 * 
 * Purpose: Provides a user-friendly error display when components fail to render.
 * 
 * Contract:
 * - Preconditions: ErrorBoundary has caught an error
 * - Postconditions: Displays error message and reset button
 * - Side Effects: None (pure component)
 * - Error Handling: Provides reset functionality
 */
export function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
      <div className="text-red-600 text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h2>
      <p className="text-red-600 text-center mb-4">
        We encountered an unexpected error. Please try refreshing the page.
      </p>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mb-4 p-4 bg-red-100 rounded text-sm text-red-800 max-w-md">
          <summary className="cursor-pointer font-semibold">Error Details</summary>
          <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
        </details>
      )}
      <button
        onClick={resetError}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
