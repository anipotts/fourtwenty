"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors in child component tree
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Here you could also log the error to an error reporting service like Sentry
    // Example: logErrorToService(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise, use the default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
          <div className="max-w-md w-full bg-white rounded-lg border border-[#e9ecef] p-6 shadow-md text-center">
            <div className="w-16 h-16 bg-red-50 flex items-center justify-center rounded-full mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#212529] mb-3">
              Something went wrong
            </h2>
            <p className="text-[#495057] mb-4 font-sans">
              We're having trouble loading this page. You can try refreshing the
              browser or come back later.
            </p>
            <div className="mb-4 p-3 bg-gray-50 rounded-md text-left overflow-auto max-h-32">
              <pre className="text-xs text-red-600 whitespace-pre-wrap">
                {this.state.error?.toString()}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#4dd783] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#3bb871] transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
