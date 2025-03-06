import { ChevronLeft, Home } from "lucide-react";
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state to display fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging or reporting
    console.error("Error caught in Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen max-h-screen fixed left-0 w-screen top-0 from-[#00bbff]  to-black bg-gradient-to-b">
          <h1 className="text-3xl font-bold text-white">
            Something went wrong!
          </h1>
          {this.state.error?.message && (
            <p className="mt-2 text-lg text-gray-400">
              {this.state.error.message}
            </p>
          )}
          <div className="flex items-center gap-4 pt-5">
            <button
              className="bg-black text-white px-3 p-2 rounded-lg flex gap-2 hover:bg-[#00000086] transition-background"
              onClick={() => (window.location.href = "/")}
            >
              <Home width={20} />
              <span>Home</span>
            </button>
            <button
              className=" bg-white text-black px-3 p-2 rounded-lg flex gap-2 font-medium hover:bg-[#ffffff86] transition-background"
              onClick={() => window.history.back()}
            >
              <ChevronLeft width={20} /> Back
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
