import { fireEvent, render, screen } from "@testing-library/react-native";
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
    // Arrange
    const onReset = jest.fn();
    let shouldThrow = true;
    function Flaky() {
      if (shouldThrow) throw new Error("root boom");
      return <Text>recovered ok</Text>;
    }

    // Act
    await render(
      <ErrorBoundary onReset={onReset} retryAccessibilityLabel="Retry app">
        <Flaky />
      </ErrorBoundary>
    );

    // Assert
    const btn = await screen.findByLabelText("Retry app");
    expect(btn).toBeTruthy();
    expect(screen.getByText("Something went wrong.")).toBeTruthy();
    expect(screen.queryByText("root boom")).toBeNull();
    expect(screen.getByRole("alert")).toBeTruthy();

    // Act
    shouldThrow = false;
    await fireEvent.press(btn);

    // Assert
    expect(await screen.findByText("recovered ok")).toBeTruthy();
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Something went wrong.")).toBeNull();
  });

  test("defaults retry accessibility label to Retry when not provided", async () => {
    // Arrange / Act
    await render(
      <ErrorBoundary>
        <ThrowAfterMount message="secret internals" />
      </ErrorBoundary>
    );

    // Assert
    expect(await screen.findByLabelText("Retry")).toBeTruthy();
    expect(screen.queryByLabelText("Retry app")).toBeNull();
    expect(screen.getByText("Something went wrong.")).toBeTruthy();
    expect(screen.queryByText("secret internals")).toBeNull();
  });

  test("shows generic message when error.message is empty", async () => {
    // Arrange / Act
    await render(
      <ErrorBoundary>
        <ThrowAfterMount message="" />
      </ErrorBoundary>
    );

    // Assert
    expect(await screen.findByText("Something went wrong.")).toBeTruthy();
  });

  test("per-screen boundary shows Retry screen and does not bubble to root", async () => {
    // Arrange / Act
    await render(
      <ErrorBoundary retryAccessibilityLabel="Retry app">
        <ErrorBoundary retryAccessibilityLabel="Retry screen">
          <ThrowAfterMount message="screen boom" />
        </ErrorBoundary>
        <Text>outside screen</Text>
      </ErrorBoundary>
    );

    // Assert
    expect(await screen.findByLabelText("Retry screen")).toBeTruthy();
    expect(screen.queryByLabelText("Retry app")).toBeNull();
    expect(screen.getByText("Something went wrong.")).toBeTruthy();
    expect(screen.queryByText("screen boom")).toBeNull();
    // Sibling outside the inner boundary survives (isolation proof).
    expect(await screen.findByText("outside screen")).toBeTruthy();
  });

  test("per-screen Retry resets only inner boundary", async () => {
    // Arrange
    const outerReset = jest.fn();
    const innerReset = jest.fn();
    let innerShouldThrow = true;
    function InnerCrash() {
      if (innerShouldThrow) throw new Error("inner");
      return <Text>inner ok</Text>;
    }
    await render(
      <ErrorBoundary onReset={outerReset} retryAccessibilityLabel="Retry app">
        <ErrorBoundary
          onReset={innerReset}
          retryAccessibilityLabel="Retry screen">
          <InnerCrash />
        </ErrorBoundary>
      </ErrorBoundary>
    );
    const retry = await screen.findByLabelText("Retry screen");
    expect(outerReset).not.toHaveBeenCalled();

    // Act
    innerShouldThrow = false;
    await fireEvent.press(retry);

    // Assert
    expect(await screen.findByText("inner ok")).toBeTruthy();
    expect(innerReset).toHaveBeenCalledTimes(1);
    expect(outerReset).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Retry app")).toBeNull();
  });
});
