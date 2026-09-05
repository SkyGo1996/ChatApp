import { Platform } from "react-native";

import {
  chromeBar,
  chromeComposer,
  chromeFab,
  chromeHeader,
  chromeSheet,
} from "./recipes";
import {
  REQUIRED_COLOR_KEYS,
  REQUIRED_RADIUS_KEYS,
  REQUIRED_TYPE_KEYS,
  darkTheme,
  lightTheme,
} from "./themes";

describe("theme tokens", () => {
  test("light and dark expose required color keys", () => {
    for (const key of REQUIRED_COLOR_KEYS) {
      expect(lightTheme.colors).toHaveProperty(key);
      expect(darkTheme.colors).toHaveProperty(key);
      expect(typeof lightTheme.colors[key]).toBe("string");
      expect(typeof darkTheme.colors[key]).toBe("string");
    }
  });

  test("bubbleMe is unified #2563EB in both modes", () => {
    expect(lightTheme.colors.bubbleMe).toBe("#2563EB");
    expect(darkTheme.colors.bubbleMe).toBe("#2563EB");
  });

  test("space(n) = n * 4 on 8pt grid", () => {
    expect(lightTheme.space(1)).toBe(4);
    expect(lightTheme.space(2)).toBe(8);
    expect(darkTheme.space(4)).toBe(16);
  });

  test("radius keys match design mnemonic values", () => {
    for (const key of REQUIRED_RADIUS_KEYS) {
      expect(lightTheme.radius).toHaveProperty(key);
    }
    expect(lightTheme.radius).toEqual({
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      sheet: 20,
      xl: 28,
      full: 9999,
    });
  });

  test("HIG type scale keys exist with System font", () => {
    for (const key of REQUIRED_TYPE_KEYS) {
      expect(lightTheme.type).toHaveProperty(key);
      expect(lightTheme.type[key].fontFamily).toBe("System");
      expect(typeof lightTheme.type[key].size).toBe("number");
      expect(typeof lightTheme.type[key].lineHeight).toBe("number");
    }
  });

  test("motion + blur + elevation extras present", () => {
    expect(lightTheme.motion.fadeUp.duration).toBe(220);
    expect(lightTheme.motion.pressScale.to).toBe(0.97);
    expect(lightTheme.motionExpressive.sheetSpring.damping).toBe(18);
    expect(lightTheme.blur.full).toBe(40);
    expect(lightTheme.blur.degraded).toBe(24);
    expect(lightTheme.elevation.elevation).toBe(2);
    expect(darkTheme.elevation.elevation).toBe(0);
  });
});

describe("chrome recipes — platform mapping", () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { value: originalOS });
  });

  test("iOS recipes use glassBg/glassBorder and useGlass", () => {
    Object.defineProperty(Platform, "OS", { value: "ios" });
    const bar = chromeBar(lightTheme);
    expect(bar.backgroundColor).toBe(lightTheme.colors.glassBg);
    expect(bar.borderColor).toBe(lightTheme.colors.glassBorder);
    expect(bar.borderWidth).toBe(0.5);
    expect(bar.useGlass).toBe(true);
    expect(bar.elevation).toBe(0);
    expect(bar.blurRadius).toBe(40);

    expect(chromeHeader(lightTheme).useGlass).toBe(true);
    expect(chromeComposer(darkTheme).borderColor).toBe(
      darkTheme.colors.glassBorder
    );
    expect(chromeSheet(lightTheme).useGlass).toBe(true);
    expect(chromeFab(lightTheme).useGlass).toBe(true);
  });

  test("Android recipes never emit glassBorder or useGlass", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });
    const bar = chromeBar(lightTheme);
    expect(bar.backgroundColor).toBe(lightTheme.colors.surface2);
    expect(bar.borderColor).toBe(lightTheme.colors.border);
    expect(bar.borderWidth).toBe(1);
    expect(bar.useGlass).toBe(false);
    expect(bar.blurRadius).toBeUndefined();
    expect(bar.elevation).toBe(2);

    const sheet = chromeSheet(darkTheme);
    expect(sheet.backgroundColor).toBe(darkTheme.colors.surface3);
    expect(sheet.borderColor).toBe(darkTheme.colors.border);
    expect(sheet.useGlass).toBe(false);
    expect(sheet.elevation).toBe(3);

    const fab = chromeFab(lightTheme);
    expect(fab.useGlass).toBe(false);
    expect(fab.borderColor).not.toBe(lightTheme.colors.glassBorder);
  });
});
