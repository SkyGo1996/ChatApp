import { tokens } from "./tokens";

export const lightTheme = {
  colors: {
    bg: "#F8F8FA",
    surface: "#FFFFFF",
    surface2: "#F3F4F6",
    surface3: "#E5E7EB",
    overlay: "rgba(0,0,0,0.4)",
    text: "#1A1A1A",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    primary: "#2563EB",
    destructive: "#DC2626",
    bubbleMe: "#2563EB",
    bubbleThem: "#F1F3F5",
    inputBg: "#F3F4F6",
    disabled: "#D1D5DB",
    glassBg: "rgba(255,255,255,0.72)",
    glassBorder: "rgba(255,255,255,0.45)",
    glassTint: "rgba(255,255,255,0.18)",
  },
  radius: tokens.radius,
  spacing: tokens.spacing,
  gap: tokens.spacing,
} as const;

export const darkTheme = {
  colors: {
    ...tokens.colors,
  },
  radius: tokens.radius,
  spacing: tokens.spacing,
  gap: tokens.spacing,
} as const;

export type AppTheme = typeof lightTheme;
export type AppThemes = { light: AppTheme; dark: AppTheme };
