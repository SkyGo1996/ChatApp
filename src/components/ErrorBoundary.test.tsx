import { fireEvent, render } from "@testing-library/react-native";
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
    let shouldThrow = true;
    function Flaky() {
      if (shouldThrow) throw new Error("root boom");
      return <Text>recovered ok</Text>;
    }
    const { findByLabelText, queryByText, findByText } = await render(
      <ErrorBoundary onReset={onReset}>
        <Flaky />
      </ErrorBoundary>
    );
    const btn = await findByLabelText("Retry app");
    expect(btn).toBeTruthy();
    // root message surfaces
    expect(queryByText("root boom")).toBeTruthy();

    shouldThrow = false;
    await fireEvent.press(btn);
    expect(await findByText("recovered ok")).toBeTruthy();
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(queryByText("root boom")).toBeNull();
  });

  test("per-screen boundary shows Retry screen and does not bubble to root", async () => {
    const { findByLabelText, queryByLabelText, findByText } = await render(
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
    // Sibling outside the inner boundary survives (isolation proof).
    expect(await findByText("outside screen")).toBeTruthy();
  });

  test("per-screen Retry resets only inner boundary", async () => {
    // Inner crash is recoverable via flag; outer onReset must not fire.
    const outerReset = jest.fn();
    const innerReset = jest.fn();
    let innerShouldThrow = true;
    function InnerCrash() {
      if (innerShouldThrow) throw new Error("inner");
      return <Text>inner ok</Text>;
    }
    const { findByLabelText, findByText, queryByLabelText } = await render(
      <ErrorBoundary onReset={outerReset} retryAccessibilityLabel="Retry app">
        <ErrorBoundary
          onReset={innerReset}
          retryAccessibilityLabel="Retry screen">
          <InnerCrash />
        </ErrorBoundary>
      </ErrorBoundary>
    );
    const retry = await findByLabelText("Retry screen");
    expect(retry).toBeTruthy();
    expect(outerReset).not.toHaveBeenCalled();

    innerShouldThrow = false;
    await fireEvent.press(retry);
    expect(await findByText("inner ok")).toBeTruthy();
    expect(innerReset).toHaveBeenCalledTimes(1);
    expect(outerReset).not.toHaveBeenCalled();
    expect(queryByLabelText("Retry app")).toBeNull();
  });
});
