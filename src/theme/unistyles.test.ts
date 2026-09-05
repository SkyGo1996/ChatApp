import { UnistylesRuntime } from "react-native-unistyles";

import { darkTheme, lightTheme } from "./themes";
import { applyThemeMode } from "./unistyles";

describe("applyThemeMode", () => {
  let setAdaptiveThemes: jest.SpyInstance;
  let setTheme: jest.SpyInstance;
  let setRootViewBackgroundColor: jest.SpyInstance;
  let colorSchemeDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    setAdaptiveThemes = jest.spyOn(UnistylesRuntime, "setAdaptiveThemes");
    setTheme = jest.spyOn(UnistylesRuntime, "setTheme");
    setRootViewBackgroundColor = jest.spyOn(
      UnistylesRuntime,
      "setRootViewBackgroundColor"
    );
    colorSchemeDescriptor = Object.getOwnPropertyDescriptor(
      UnistylesRuntime,
      "colorScheme"
    );
  });

  afterEach(() => {
    setAdaptiveThemes.mockRestore();
    setTheme.mockRestore();
    setRootViewBackgroundColor.mockRestore();
    if (colorSchemeDescriptor) {
      Object.defineProperty(
        UnistylesRuntime,
        "colorScheme",
        colorSchemeDescriptor
      );
    }
  });

  function mockColorScheme(scheme: "light" | "dark" | "unspecified") {
    Object.defineProperty(UnistylesRuntime, "colorScheme", {
      configurable: true,
      get: () => scheme,
    });
  }

  test("system enables adaptive themes and sets root bg from OS scheme", () => {
    mockColorScheme("light");
    applyThemeMode("system");
    expect(setAdaptiveThemes).toHaveBeenCalledWith(true);
    expect(setTheme).not.toHaveBeenCalled();
    expect(setRootViewBackgroundColor).toHaveBeenCalledWith(
      lightTheme.colors.bg
    );
  });

  test("system uses dark bg when OS is dark", () => {
    mockColorScheme("dark");
    applyThemeMode("system");
    expect(setAdaptiveThemes).toHaveBeenCalledWith(true);
    expect(setRootViewBackgroundColor).toHaveBeenCalledWith(
      darkTheme.colors.bg
    );
  });

  test("light disables adaptive then setTheme('light')", () => {
    applyThemeMode("light");
    expect(setAdaptiveThemes).toHaveBeenCalledWith(false);
    expect(setTheme).toHaveBeenCalledWith("light");
    const adaptiveOrder = setAdaptiveThemes.mock.invocationCallOrder[0] ?? 0;
    const themeOrder = setTheme.mock.invocationCallOrder[0] ?? 0;
    expect(adaptiveOrder).toBeLessThan(themeOrder);
    expect(setRootViewBackgroundColor).toHaveBeenCalledWith(
      lightTheme.colors.bg
    );
  });

  test("dark disables adaptive then setTheme('dark')", () => {
    applyThemeMode("dark");
    expect(setAdaptiveThemes).toHaveBeenCalledWith(false);
    expect(setTheme).toHaveBeenCalledWith("dark");
    expect(setRootViewBackgroundColor).toHaveBeenCalledWith(
      darkTheme.colors.bg
    );
  });
});
