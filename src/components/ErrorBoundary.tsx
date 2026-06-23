import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in boundary:", error, errorInfo);
  }

  public render() {
    const self = this as any;
    if (this.state.hasError) {
      return self.props.fallback || (
        <div className="rounded-[28px] border border-red-100 bg-red-50/50 p-8 text-center max-w-md mx-auto my-12 shadow-sm animate-fade-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-650 mx-auto mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-md font-extrabold text-slate-800">Something went wrong</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            The Attendance page is currently unavailable or encountered an error. Please try reloading the page or contact the technical administrator.
          </p>
          {this.state.error && (
            <pre className="mt-4 p-3 bg-red-100/50 rounded-xl text-[10px] text-red-700 font-mono text-left overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => self.setState({ hasError: false, error: null })}
            className="mt-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 transition"
          >
            Try Again
          </button>
        </div>
      );
    }

    return self.props.children;
  }
}
