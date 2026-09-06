import { Platform } from "react-native";

import {
  chromeBar,
  chromeComposer,
  chromeFab,
  chromeHeader,
  chromeSheet,
} from "./recipes";
import {
  REQUIRED_RADIUS_KEYS,
  REQUIRED_TYPE_KEYS,
  darkTheme,
  lightTheme,
} from "./themes";

// Literal contract (not imported from file under test): deleting a color +
// its key must fail. Mirrors REQUIRED_COLOR_KEYS in themes.ts.
const EXPECTED_COLOR_KEYS = [
  "bg",
  "surface",
  "surface2",
  "surface3",
  "overlay",
  "text",
  "textSecondary",
  "border",
  "primary",
  "destructive",
  "bubbleMe",
  "bubbleThem",
  "inputBg",
  "disabled",
  "glassBg",
  "glassBorder",
  "glassTint",
] as const;

describe("theme tokens", () => {
  test("light and dark expose required color keys", () => {
    for (const key of EXPECTED_COLOR_KEYS) {
      expect(lightTheme.colors).toHaveProperty(key);
      expect(darkTheme.colors).toHaveProperty(key);
      expect(typeof lightTheme.colors[key]).toBe("string");
      expect(typeof darkTheme.colors[key]).toBe("string");
    }
  });

  test("bubbleMe is unified across modes (exact hex in themes.style.test.ts)", () => {
    expect(lightTheme.colors.bubbleMe).toBe(darkTheme.colors.bubbleMe);
    expect(lightTheme.colors.bubbleMe).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test("space(n) scales on 8pt grid", () => {
    expect(lightTheme.space(1)).toBe(4);
    expect(lightTheme.space(2)).toBe(8);
    expect(darkTheme.space(4)).toBe(16);
    expect(lightTheme.space(0)).toBe(0);
  });

  test("radius keys exist with numeric values (exact map in style suite)", () => {
    for (const key of REQUIRED_RADIUS_KEYS) {
      expect(lightTheme.radius).toHaveProperty(key);
      expect(typeof lightTheme.radius[key]).toBe("number");
    }
    expect(lightTheme.radius.full).toBeGreaterThan(lightTheme.radius.xl);
  });

  test("HIG type scale keys exist with System font", () => {
    for (const key of REQUIRED_TYPE_KEYS) {
      expect(lightTheme.type).toHaveProperty(key);
      expect(lightTheme.type[key].fontFamily).toBe("System");
      expect(typeof lightTheme.type[key].size).toBe("number");
      expect(typeof lightTheme.type[key].lineHeight).toBe("number");
    }
  });

  test("motion + blur + elevation extras present with sane shapes", () => {
    expect(lightTheme.motion.fadeUp.duration).toBeGreaterThan(0);
    expect(lightTheme.motion.pressScale.to).toBeGreaterThan(0);
    expect(lightTheme.motion.pressScale.to).toBeLessThan(1);
    expect(lightTheme.motionExpressive.sheetSpring.damping).toBeGreaterThan(0);
    expect(lightTheme.blur.full).toBeGreaterThan(lightTheme.blur.degraded);
    expect(typeof lightTheme.elevation.elevation).toBe("number");
    expect(typeof darkTheme.elevation.elevation).toBe("number");
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
    expect(chromeComposer(lightTheme).backgroundColor).toBe(
      lightTheme.colors.inputBg
    );
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
