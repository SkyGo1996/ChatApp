/**
 * Shared token primitives
 *
 * Radius mnemonic xs4/sm8/md12/lg16/sheet20/xl28/full maps to keys below.
 * space(n) = n * 4 on an 8pt grid.
 */

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  sheet: 20,
  xl: 28,
  full: 9999,
} as const;

export function space(n: number): number {
  return n * 4;
}

export const type = {
  largeTitle: {
    fontFamily: "System",
    size: 34,
    weight: "700" as const,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  title1: {
    fontFamily: "System",
    size: 28,
    weight: "700" as const,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  title2: {
    fontFamily: "System",
    size: 22,
    weight: "600" as const,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  title3: {
    fontFamily: "System",
    size: 20,
    weight: "600" as const,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  headline: {
    fontFamily: "System",
    size: 17,
    weight: "600" as const,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  body: {
    fontFamily: "System",
    size: 17,
    weight: "400" as const,
    lineHeight: 22,
    letterSpacing: -0.4,
  },
  callout: {
    fontFamily: "System",
    size: 16,
    weight: "400" as const,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  subhead: {
    fontFamily: "System",
    size: 15,
    weight: "400" as const,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  footnote: {
    fontFamily: "System",
    size: 13,
    weight: "400" as const,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  caption1: {
    fontFamily: "System",
    size: 12,
    weight: "400" as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption2: {
    fontFamily: "System",
    size: 11,
    weight: "400" as const,
    lineHeight: 13,
    letterSpacing: 0.06,
  },
} as const;

export const motion = {
  fadeUp: {
    duration: 220,
    easing: "ease-out" as const,
    from: { opacity: 0, translateY: 8 },
  },
  pressScale: { duration: 80, to: 0.97 },
  shimmer: { duration: 1200, easing: "linear" as const },
  sheetOpen: {
    duration: 280,
    easing: "spring" as const,
    damping: 18,
    stiffness: 350,
  },
  scrollFab: { duration: 200, easing: "ease-out" as const },
} as const;

export const motionExpressive = {
  sheetSpring: { type: "spring" as const, damping: 18, stiffness: 350 },
  fabSpring: { type: "spring" as const, damping: 16, stiffness: 380 },
  containedEmphasis: { duration: 320, easing: "spring" as const },
} as const;

/** iOS blur radii — full vs degraded (older / low-power). */
export const blur = {
  full: 40,
  degraded: 24,
} as const;

export const shadowIOS = {
  light: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dark: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
} as const;

export const elevationAndroid = {
  light: { elevation: 2 },
  dark: { elevation: 0 },
} as const;

export const lightColors = {
  bg: "#F8F8FA",
  surface: "#FFFFFF",
  surface2: "#F3F4F6",
  surface3: "#E5E7EB",
  overlay: "rgba(0,0,0,0.4)",
  text: "#1A1A1A",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  glassBg: "rgba(255,255,255,0.72)",
  glassBorder: "rgba(255,255,255,0.45)",
  glassTint: "rgba(255,255,255,0.18)",
  primary: "#2563EB",
  destructive: "#DC2626",
  bubbleMe: "#2563EB",
  bubbleThem: "#F1F3F5",
  inputBg: "#F3F4F6",
  disabled: "#D1D5DB",
} as const;

export const darkColors = {
  bg: "#111114",
  surface: "#1C1C1F",
  surface2: "#27272A",
  surface3: "#3F3F46",
  overlay: "rgba(0,0,0,0.6)",
  text: "#E5E5EA",
  textSecondary: "#9CA3AF",
  border: "#2A2A2D",
  glassBg: "rgba(28,28,31,0.72)",
  glassBorder: "rgba(255,255,255,0.12)",
  glassTint: "rgba(255,255,255,0.06)",
  primary: "#60A5FA",
  destructive: "#F87171",
  bubbleMe: "#2563EB",
  bubbleThem: "#27272A",
  inputBg: "#1F2937",
  disabled: "#4B5563",
} as const;

/** @deprecated Prefer named exports; kept for barrel compatibility. */
export const tokens = {
  colors: darkColors,
  radius,
  space,
} as const;
