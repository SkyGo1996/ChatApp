import { fireEvent } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import { createTestStore, renderWithProviders } from "@/test-utils";

import SettingsScreen from "./SettingsScreen";

jest.mock("@/hooks/useReduceMotion", () => ({
  useReduceMotion: () => false,
}));
jest.mock("@/hooks/useReduceTransparency", () => ({
  useReduceTransparency: () => false,
}));

describe("SettingsScreen static", () => {
  test("shows hard-coded me identity, version, and segmented control", async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <SettingsScreen />
    );
    expect(getByTestId("me-card")).toBeTruthy();
    expect(getByTestId("me-avatar")).toBeTruthy();
    expect(getByText("You")).toBeTruthy();
    expect(getByTestId("me-phone")).toBeTruthy();
    expect(getByText("+1-202-555-0199")).toBeTruthy();
    expect(getByTestId("settings-version").props.children).toEqual(
      expect.arrayContaining([expect.stringContaining("1.0.0")])
    );
    // segmented control values
    expect(getByTestId("theme-segmented-control")).toBeTruthy();
    expect(getByTestId("segment-System")).toBeTruthy();
    expect(getByTestId("segment-Light")).toBeTruthy();
    expect(getByTestId("segment-Dark")).toBeTruthy();
    // no fetch/shimmer/error
    expect(() => getByText("Loading profile")).toThrow();
  });

  test("selecting theme triggers haptic and persists via store", async () => {
    const store = createTestStore({ theme: { mode: "system" } });
    const { getByTestId } = await renderWithProviders(<SettingsScreen />, {
      store,
    });
    const spy = jest.spyOn(Haptics, "impactAsync");
    void fireEvent.press(getByTestId("segment-Dark"));
    expect(spy).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    expect(store.getState().theme.mode).toBe("dark");
  });
});
