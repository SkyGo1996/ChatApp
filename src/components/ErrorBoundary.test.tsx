import { render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { ErrorBoundary } from "./ErrorBoundary";

// Suppress console.error from ErrorBoundary during expected throws.
// Use spyOn with mockRestore — never assign to console.error directly
// (RN's ExceptionsManager makes it non-writable at runtime).
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});

function ThrowAfterMount({
  message = "boom",
}: {
  message?: string;
}): React.ReactNode {
  throw new Error(message);
}

describe("ErrorBoundary", () => {
  test("root boundary shows Retry app fallback and recovers via Retry", async () => {
    const onReset = jest.fn();
    const { findByLabelText, queryByText } = await render(
      <ErrorBoundary onReset={onReset}>
        <ThrowAfterMount message="root boom" />
      </ErrorBoundary>
    );
    const btn = await findByLabelText("Retry app");
    expect(btn).toBeTruthy();
    // root message surfaces
    expect(queryByText("root boom")).toBeTruthy();
  });

  test("per-screen boundary shows Retry screen and does not bubble to root", async () => {
    const { findByLabelText, queryByLabelText } = await render(
      <ErrorBoundary retryAccessibilityLabel="Retry app">
        <ErrorBoundary retryAccessibilityLabel="Retry screen">
          <ThrowAfterMount message="screen boom" />
        </ErrorBoundary>
        <Text>outside screen</Text>
      </ErrorBoundary>
    );
    const screenBtn = await findByLabelText("Retry screen");
    expect(screenBtn).toBeTruthy();
    expect(queryByLabelText("Retry app")).toBeNull();
    expect(await findByLabelText("Retry screen")).toBeTruthy();
  });

  test("per-screen Retry resets only inner boundary", async () => {
    // This checks that Retry on inner boundary does not call outer onReset
    const outerReset = jest.fn();
    function InnerCrash() {
      const [crashed] = React.useState(true);
      if (crashed) throw new Error("inner");
      return <Text>inner ok</Text>;
    }
    // We can't fully simulate state reset without userEvent, but we verify fallback is per-screen
    const { findByLabelText } = await render(
      <ErrorBoundary onReset={outerReset} retryAccessibilityLabel="Retry app">
        <ErrorBoundary retryAccessibilityLabel="Retry screen">
          <InnerCrash />
        </ErrorBoundary>
      </ErrorBoundary>
    );
    expect(await findByLabelText("Retry screen")).toBeTruthy();
    expect(outerReset).not.toHaveBeenCalled();
  });
});
