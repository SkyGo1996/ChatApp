import { Platform } from "react-native";

import { navigationTheme, themedStackOptions } from "./navigation";
import { darkTheme, lightTheme } from "./themes";

describe("navigationTheme", () => {
  test("light maps Unistyles bg/surface into Navigation theme", () => {
    const nav = navigationTheme(lightTheme, false);
    expect(nav.dark).toBe(false);
    expect(nav.colors.background).toBe(lightTheme.colors.bg);
    expect(nav.colors.card).toBe(lightTheme.colors.surface);
    expect(nav.colors.primary).toBe(lightTheme.colors.primary);
    expect(nav.colors.text).toBe(lightTheme.colors.text);
    expect(nav.colors.border).toBe(lightTheme.colors.border);
    expect(nav.colors.notification).toBe(lightTheme.colors.destructive);
  });

  test("dark maps Unistyles bg/surface into Navigation theme", () => {
    const nav = navigationTheme(darkTheme, true);
    expect(nav.dark).toBe(true);
    expect(nav.colors.background).toBe(darkTheme.colors.bg);
    expect(nav.colors.card).toBe(darkTheme.colors.surface);
  });
});

describe("themedStackOptions", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { value: originalOS });
  });

  test("opaque light iOS: surface bg, text tint, no blur, content bg", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const opts = themedStackOptions(lightTheme);
    expect(opts.headerTransparent).toBe(false);
    expect(opts.headerStyle).toEqual({
      backgroundColor: lightTheme.colors.surface,
    });
    expect(opts.headerTintColor).toBe(lightTheme.colors.text);
    expect(opts.headerTitleStyle).toEqual({ color: lightTheme.colors.text });
    expect(opts.headerBlurEffect).toBeUndefined();
    expect(opts.contentStyle).toEqual({
      backgroundColor: lightTheme.colors.bg,
    });
    expect(opts.headerShadowVisible).toBe(false); // chromeHeader elevation 0 on iOS
    expect(opts.unstable_nativeProps).toEqual({
      headerConfig: { experimental_userInterfaceStyle: "light" },
    });
  });

  test("opaque dark iOS: no blur, surface bg, text tint", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const opts = themedStackOptions(darkTheme);
    expect(opts.headerStyle).toEqual({
      backgroundColor: darkTheme.colors.surface,
    });
    expect(opts.headerTintColor).toBe(darkTheme.colors.text);
    expect(opts.headerBlurEffect).toBeUndefined();
    expect(opts.contentStyle).toEqual({ backgroundColor: darkTheme.colors.bg });
    expect(opts.unstable_nativeProps).toEqual({
      headerConfig: { experimental_userInterfaceStyle: "dark" },
    });
  });

  test("transparent light iOS: transparent bg, no blur, tint text", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const opts = themedStackOptions(lightTheme, { transparent: true });
    expect(opts.headerTransparent).toBe(true);
    expect(opts.headerStyle).toEqual({ backgroundColor: "transparent" });
    expect(opts.headerTintColor).toBe(lightTheme.colors.text);
    expect(opts.headerBlurEffect).toBeUndefined();
    expect(opts.headerShadowVisible).toBe(false);
    expect(opts.contentStyle).toEqual({
      backgroundColor: lightTheme.colors.bg,
    });
    expect(opts.unstable_nativeProps).toEqual({
      headerConfig: { experimental_userInterfaceStyle: "light" },
    });
  });

  test("transparent dark iOS: no blur", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const opts = themedStackOptions(darkTheme, { transparent: true });
    expect(opts.headerTransparent).toBe(true);
    expect(opts.headerBlurEffect).toBeUndefined();
    expect(opts.headerTintColor).toBe(darkTheme.colors.text);
    expect(opts.unstable_nativeProps).toEqual({
      headerConfig: { experimental_userInterfaceStyle: "dark" },
    });
  });

  test("opaque Android: no blur, surface bg, tint text, shadow from elevation", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });
    const opts = themedStackOptions(lightTheme);
    expect(opts.headerTransparent).toBe(false);
    expect(opts.headerStyle).toEqual({
      backgroundColor: lightTheme.colors.surface,
    });
    expect(opts.headerBlurEffect).toBeUndefined();
    expect(opts.headerTintColor).toBe(lightTheme.colors.text);
    expect(opts.contentStyle).toEqual({
      backgroundColor: lightTheme.colors.bg,
    });
    // light elevation 2 on Android -> shadow visible
    expect(opts.headerShadowVisible).toBe(true);
    expect(opts.unstable_nativeProps).toBeUndefined();
  });

  test("Android transparent flag is ignored (never transparent)", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });
    const opts = themedStackOptions(lightTheme, { transparent: true });
    expect(opts.headerTransparent).toBe(false);
    expect(opts.headerBlurEffect).toBeUndefined();
  });

  test("back button label is hidden globally (minimal) on all variants", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    expect(themedStackOptions(lightTheme).headerBackButtonDisplayMode).toBe(
      "minimal"
    );
    expect(
      themedStackOptions(lightTheme, { transparent: true })
        .headerBackButtonDisplayMode
    ).toBe("minimal");
    Object.defineProperty(Platform, "OS", { value: "android" });
    expect(themedStackOptions(darkTheme).headerBackButtonDisplayMode).toBe(
      "minimal"
    );
  });
});
