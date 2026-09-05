import { fireEvent, render } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import { ErrorRetry } from "./ErrorRetry";

describe("ErrorRetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("calls onRetry and fires light haptic by default", async () => {
    const onRetry = jest.fn();
    const { findByLabelText } = await render(
      <ErrorRetry message="Failed" onRetry={onRetry} />
    );
    await fireEvent.press(await findByLabelText("Retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Light
    );
  });

  test("does not call onRetry when retryDisabled", async () => {
    const onRetry = jest.fn();
    const { findByLabelText } = await render(
      <ErrorRetry message="Rate limited" onRetry={onRetry} retryDisabled />
    );
    await fireEvent.press(await findByLabelText("Retry"));
    expect(onRetry).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  test("skips haptic when hapticOnRetry is false", async () => {
    const onRetry = jest.fn();
    const { findByLabelText } = await render(
      <ErrorRetry
        message="Crash"
        onRetry={onRetry}
        hapticOnRetry={false}
        retryAccessibilityLabel="Retry app"
      />
    );
    await fireEvent.press(await findByLabelText("Retry app"));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  test("inline variant still calls onRetry", async () => {
    const onRetry = jest.fn();
    const { findByLabelText, getByText } = await render(
      <ErrorRetry
        variant="inline"
        message="Refresh failed"
        onRetry={onRetry}
        retryAccessibilityLabel="Retry conversations"
      />
    );
    expect(getByText("Refresh failed")).toBeTruthy();
    await fireEvent.press(await findByLabelText("Retry conversations"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
