import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { useMemo, useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { pressInScale, pressOutScale } from "@/components/pressScale";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useReduceTransparency } from "@/hooks/useReduceTransparency";
import { chromeComposer, glassColorScheme } from "@/theme/recipes";
import { motionExpressive } from "@/theme/tokens";
import { MESSAGE_MAX_LENGTH, sanitizeMessageInput } from "@/utils/sanitize";

import {
  CHAT_INPUT_NATIVE_ID,
  composerInputLineMetrics,
} from "./composerLayout";

type Props = {
  onSend: (text: string) => void;
  /** Seam for ticket 11 Block guard — disables input + Send. */
  disabled?: boolean;
  /** Full composer chrome height (incl. safe-area pad) for list bottom inset. */
  onHeightChange?: (height: number) => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Module-scope so React Compiler does not treat SharedValue writes as immutable. */
function sendPressInAndroid(scale: SharedValue<number>): void {
  scale.value = withSpring(0.97, {
    damping: motionExpressive.fabSpring.damping,
    stiffness: motionExpressive.fabSpring.stiffness,
  });
}

function sendPressOutAndroid(scale: SharedValue<number>): void {
  scale.value = withSpring(1, {
    damping: motionExpressive.fabSpring.damping,
    stiffness: motionExpressive.fabSpring.stiffness,
  });
}

function ComposerChrome({
  children,
  style,
  disabled,
}: {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const { theme } = useUnistyles();
  const reduceTransparency = useReduceTransparency();
  const chrome = chromeComposer(theme);

  if (disabled) {
    // Solid disabled fill — never translucent, respects none of reduceTransparency
    return (
      <View testID="composer-chrome" style={[style, styles.chromeDisabled]}>
        {children}
      </View>
    );
  }

  if (Platform.OS === "android") {
    return (
      <View testID="composer-chrome" style={[style, styles.chromeAndroid]}>
        {children}
      </View>
    );
  }

  const canGlass =
    !reduceTransparency &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  // Host fill covers the native empty-UIVisualEffect dark frame before glass
  // installs. Do not put opaque backgroundColor on GlassView itself — that
  // hides the material. BlurView keeps fill+clip on the effect view.
  if (canGlass) {
    return (
      <View style={[styles.glassHost, theme.shadow, styles.hostFill]}>
        <GlassView
          testID="composer-chrome"
          style={[style, styles.iosBorder]}
          tintColor={theme.colors.glassTint}
          colorScheme={glassColorScheme(theme)}
          glassEffectStyle="regular">
          {children}
        </GlassView>
      </View>
    );
  }

  if (!reduceTransparency && chrome.useGlass) {
    return (
      <View style={[styles.glassHost, theme.shadow, styles.hostFill]}>
        <BlurView
          testID="composer-chrome"
          intensity={chrome.blurRadius ?? theme.blur.full}
          tint="default"
          style={[style, styles.blurFill]}>
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View testID="composer-chrome" style={[style, styles.chromeSolid]}>
      {children}
    </View>
  );
}

/**
 * Floating pill Message composer — pinned by KeyboardStickyView on Chat detail.
 * Sanitizes on send; Send disabled when empty after sanitization.
 */
export function Composer({ onSend, disabled = false, onHeightChange }: Props) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { fontScale } = useWindowDimensions();
  const [draft, setDraft] = useState("");
  const scale = useSharedValue(1);

  const sanitized = useMemo(() => sanitizeMessageInput(draft), [draft]);
  const canSend = !disabled && sanitized !== null;

  const sendSize = Platform.OS === "android" ? 48 : 44;
  const { lineHeight: scaledLineHeight, maxHeight: maxInputHeight } =
    composerInputLineMetrics(theme.type.body.lineHeight, fontScale);

  const animatedSendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onWrapLayout = (e: LayoutChangeEvent) => {
    onHeightChange?.(e.nativeEvent.layout.height);
  };

  const handlePressIn = () => {
    if (!canSend || reduceMotion) return;
    if (Platform.OS === "android") {
      sendPressInAndroid(scale);
      return;
    }
    pressInScale(scale);
  };

  const handlePressOut = () => {
    if (reduceMotion) return;
    if (Platform.OS === "android") {
      sendPressOutAndroid(scale);
      return;
    }
    pressOutScale(scale);
  };

  const handleSend = () => {
    const text = sanitizeMessageInput(draft);
    if (text === null || disabled) return;
    onSend(text);
    setDraft("");
  };

  // Always keep home-indicator inset. KeyboardStickyView offset.opened tucks
  // this padding into the keyboard so the pill does not jump on hide.
  const bottomPad = Math.max(insets.bottom, theme.space(2));

  return (
    <View
      testID="composer"
      onLayout={onWrapLayout}
      style={styles.wrap(bottomPad)}>
      <ComposerChrome style={styles.pill} disabled={disabled}>
        <View
          testID="composer-input-wrap"
          style={[
            styles.inputWrap(sendSize),
            disabled ? styles.inputWrapDisabled : null,
          ]}>
          <TextInput
            // Remount on unblock so Android EditText remeasures after
            // editable/layout flips (avoids half caret + clipped glyphs).
            key={disabled ? "composer-blocked" : "composer-open"}
            testID="composer-input"
            nativeID={CHAT_INPUT_NATIVE_ID}
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a Message..."
            placeholderTextColor={theme.colors.textSecondary}
            allowFontScaling
            multiline
            editable={!disabled}
            maxLength={MESSAGE_MAX_LENGTH}
            style={styles.input(scaledLineHeight, maxInputHeight)}
            accessibilityLabel="Message input"
            accessibilityState={{ disabled }}
          />
        </View>
        <AnimatedPressable
          testID="composer-send"
          onPress={handleSend}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send"
          accessibilityState={{ disabled: !canSend }}
          style={[styles.send(sendSize, canSend), animatedSendStyle]}>
          <Text style={styles.sendLabel} allowFontScaling={false}>
            Send
          </Text>
        </AnimatedPressable>
      </ComposerChrome>
    </View>
  );
}

const styles = StyleSheet.create((theme) => {
  const chrome = chromeComposer(theme);
  return {
    wrap: (paddingBottom: number) => ({
      paddingBottom,
      paddingHorizontal: theme.space(3),
      paddingTop: theme.space(2),
    }),
    glassHost: {
      borderRadius: theme.radius.sheet,
    },
    hostFill: {
      backgroundColor: chrome.backgroundColor,
    },
    iosBorder: {
      borderColor: chrome.borderColor,
      borderWidth: chrome.borderWidth,
    },
    blurFill: {
      backgroundColor: chrome.backgroundColor,
      borderColor: chrome.borderColor,
      borderWidth: chrome.borderWidth,
      overflow: "hidden" as const,
    },
    chromeDisabled: {
      backgroundColor: theme.colors.disabled,
      borderColor: theme.colors.border,
      borderWidth: 1,
      elevation: 0,
    },
    chromeAndroid: {
      backgroundColor: chrome.backgroundColor,
      borderColor: chrome.borderColor,
      borderWidth: chrome.borderWidth,
      elevation: chrome.elevation,
    },
    chromeSolid: {
      backgroundColor: chrome.backgroundColor,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    pill: {
      alignItems: "flex-end",
      borderRadius: theme.radius.sheet,
      flexDirection: "row",
      gap: theme.space(2),
      minHeight: 48,
      paddingHorizontal: theme.space(3),
      paddingVertical: theme.space(2),
    },
    inputWrap: (minHeight: number) => ({
      flex: 1,
      justifyContent: "center",
      minHeight,
      minWidth: 0,
    }),
    inputWrapDisabled: {
      backgroundColor: theme.colors.disabled,
    },
    input: (minHeight: number, maxHeight: number) => ({
      color: theme.colors.text,
      fontSize: theme.type.body.size,
      fontWeight: theme.type.body.weight,
      // Android caret is taller than the glyph; false + zero padding clips it
      // after block/unblock style updates. iOS ignores includeFontPadding.
      includeFontPadding: Platform.OS === "android",
      letterSpacing: theme.type.body.letterSpacing,
      margin: 0,
      maxHeight,
      minHeight,
      paddingHorizontal: 0,
      paddingTop: Platform.OS === "android" ? 2 : 0,
      paddingBottom: Platform.OS === "android" ? 2 : 0,
      // multiline + center is unstable on Android after remasure; top is safer.
      textAlignVertical: Platform.OS === "android" ? "top" : "center",
      // Android: lineHeight on TextInput maps to setLineSpacing and
      // clips the caret after editable toggles; keep it iOS-only.
      ...(Platform.OS === "ios" ? { lineHeight: minHeight } : null),
    }),
    send: (size: number, canSend: boolean) => ({
      alignItems: "center",
      borderRadius: theme.radius.full,
      height: size,
      justifyContent: "center",
      opacity: canSend ? 1 : 0.4,
      width: size,
    }),
    sendLabel: {
      color: theme.colors.primary,
      fontSize: theme.type.headline.size,
      fontWeight: theme.type.headline.weight,
      letterSpacing: theme.type.headline.letterSpacing,
      lineHeight: theme.type.headline.lineHeight,
    },
  };
});
