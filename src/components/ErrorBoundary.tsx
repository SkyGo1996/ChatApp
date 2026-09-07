import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { ErrorRetry } from "./ErrorRetry";

type Props = {
  children: React.ReactNode;
  onReset?: () => void;
  retryLabel?: string;
  retryAccessibilityLabel?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

const FALLBACK_MESSAGE = "Something went wrong.";

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
      // Own SafeAreaProvider: root catch replaces the app tree (outside the
      // layout provider). Nested screen catches already have one; nesting is OK.
      return (
        <SafeAreaProvider>
          <SafeAreaView
            style={styles.safe}
            edges={["top", "right", "bottom", "left"]}>
            <ErrorRetry
              message={FALLBACK_MESSAGE}
              onRetry={this.handleReset}
              retryLabel={this.props.retryLabel ?? "Retry"}
              {...(this.props.retryAccessibilityLabel != null
                ? {
                    retryAccessibilityLabel: this.props.retryAccessibilityLabel,
                  }
                : {})}
              hapticOnRetry={false}
            />
          </SafeAreaView>
        </SafeAreaProvider>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
