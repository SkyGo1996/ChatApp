import { Platform } from "react-native";

import { themedStackOptions } from "./navigation";
import { darkTheme, lightTheme } from "./themes";

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
  });

  test("transparent dark iOS: no blur", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const opts = themedStackOptions(darkTheme, { transparent: true });
    expect(opts.headerTransparent).toBe(true);
    expect(opts.headerBlurEffect).toBeUndefined();
    expect(opts.headerTintColor).toBe(darkTheme.colors.text);
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
  });

  test("Android transparent flag is ignored (never transparent)", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });
    const opts = themedStackOptions(lightTheme, { transparent: true });
    expect(opts.headerTransparent).toBe(false);
    expect(opts.headerBlurEffect).toBeUndefined();
  });
});
