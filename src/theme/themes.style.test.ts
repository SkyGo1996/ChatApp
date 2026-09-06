import { darkTheme, lightTheme } from "./themes";

/**
 * Non-blocking style contract — exact token values.
 * Excluded from `pnpm test:blocking`; run via `pnpm test:style`.
 * Intentional design tweaks should update these values explicitly.
 */
describe("theme tokens style contract", () => {
  test("bubbleMe is unified #2563EB in both modes", () => {
    expect(lightTheme.colors.bubbleMe).toBe("#2563EB");
    expect(darkTheme.colors.bubbleMe).toBe("#2563EB");
  });

  test("radius matches design mnemonic values", () => {
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

  test("motion + blur + elevation exact values", () => {
    expect(lightTheme.motion.fadeUp.duration).toBe(220);
    expect(lightTheme.motion.pressScale.to).toBe(0.97);
    expect(lightTheme.motionExpressive.sheetSpring.damping).toBe(18);
    expect(lightTheme.blur.full).toBe(40);
    expect(lightTheme.blur.degraded).toBe(24);
    expect(lightTheme.elevation.elevation).toBe(2);
    expect(darkTheme.elevation.elevation).toBe(0);
  });
});
