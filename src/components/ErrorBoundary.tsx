import React from "react";

import { ErrorRetry } from "./ErrorRetry";

type Props = {
  children: React.ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (__DEV__) {
      console.error("[ErrorBoundary] caught:", error, info.componentStack);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorRetry
          message={this.state.error?.message ?? "Something went wrong."}
          onRetry={this.handleReset}
          retryLabel="Retry"
          retryAccessibilityLabel="Retry app"
        />
      );
    }
    return this.props.children;
  }
}
