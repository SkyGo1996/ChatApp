import {
  blur,
  darkColors,
  elevationAndroid,
  lightColors,
  motion,
  motionExpressive,
  radius,
  shadowIOS,
  space,
  type,
} from "./tokens";

const shared = {
  radius,
  space,
  type,
  motion,
  motionExpressive,
  blur,
} as const;

export const lightTheme = {
  colors: lightColors,
  ...shared,
  shadow: shadowIOS.light,
  elevation: elevationAndroid.light,
} as const;

export const darkTheme = {
  colors: darkColors,
  ...shared,
  shadow: shadowIOS.dark,
  elevation: elevationAndroid.dark,
} as const;

/**
 * Structural theme shape shared by light/dark — used by recipes and StyleSheet.
 * Color values are `string` so either palette is assignable.
 */
export type AppTheme = {
  colors: {
    bg: string;
    surface: string;
    surface2: string;
    surface3: string;
    overlay: string;
    text: string;
    textSecondary: string;
    border: string;
    glassBg: string;
    glassBorder: string;
    glassTint: string;
    primary: string;
    destructive: string;
    bubbleMe: string;
    bubbleThem: string;
    inputBg: string;
    disabled: string;
  };
  radius: typeof radius;
  space: typeof space;
  type: typeof type;
  motion: typeof motion;
  motionExpressive: typeof motionExpressive;
  blur: typeof blur;
  shadow: (typeof shadowIOS)["light"] | (typeof shadowIOS)["dark"];
  elevation: { elevation: number };
};

export type AppThemes = { light: AppTheme; dark: AppTheme };

export const REQUIRED_COLOR_KEYS = [
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

export const REQUIRED_RADIUS_KEYS = [
  "xs",
  "sm",
  "md",
  "lg",
  "sheet",
  "xl",
  "full",
] as const;

export const REQUIRED_TYPE_KEYS = [
  "largeTitle",
  "title1",
  "title2",
  "title3",
  "headline",
  "body",
  "callout",
  "subhead",
  "footnote",
  "caption1",
  "caption2",
] as const;
