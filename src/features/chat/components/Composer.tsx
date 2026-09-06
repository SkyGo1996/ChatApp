import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { useMemo, useState, type ReactNode } from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
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
import { chromeComposer } from "@/theme/recipes";
import { motionExpressive } from "@/theme/tokens";
import { MESSAGE_MAX_LENGTH, sanitizeMessageInput } from "@/utils/sanitize";

import {
  CHAT_INPUT_NATIVE_ID,
  COMPOSER_MARGIN,
} from "@/features/chat/composerIds";

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
}: {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
}) {
  const { theme } = useUnistyles();
  const reduceTransparency = useReduceTransparency();
  const chrome = chromeComposer(theme);

  if (Platform.OS === "android") {
    return (
      <View
        style={[
          style,
          {
            backgroundColor: chrome.backgroundColor,
            borderColor: chrome.borderColor,
            borderWidth: chrome.borderWidth,
            elevation: chrome.elevation,
          },
        ]}>
        {children}
      </View>
    );
  }

  const canGlass =
    !reduceTransparency &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  const iosFill = {
    backgroundColor: chrome.backgroundColor,
    borderColor: chrome.borderColor,
    borderWidth: chrome.borderWidth,
    overflow: "hidden" as const,
  };

  if (canGlass) {
    return (
      <View style={[styles.glassHost, theme.shadow]}>
        <GlassView
          style={[style, iosFill]}
          tintColor={theme.colors.glassTint}
          glassEffectStyle="regular">
          {children}
        </GlassView>
      </View>
    );
  }

  if (!reduceTransparency && chrome.useGlass) {
    return (
      <View style={[styles.glassHost, theme.shadow]}>
        <BlurView
          intensity={chrome.blurRadius ?? theme.blur.full}
          tint="default"
          style={[style, iosFill]}>
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View
      style={[
        style,
        {
          backgroundColor: chrome.backgroundColor,
          borderColor: theme.colors.border,
          borderWidth: 1,
        },
      ]}>
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
  const [draft, setDraft] = useState("");
  const scale = useSharedValue(1);

  const sanitized = useMemo(() => sanitizeMessageInput(draft), [draft]);
  const canSend = !disabled && sanitized !== null;

  const sendSize = Platform.OS === "android" ? 48 : 44;
  const maxInputHeight = theme.type.body.lineHeight * 4;

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
    if (!reduceMotion) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend(text);
    setDraft("");
  };

  // Always keep home-indicator inset. KeyboardStickyView offset.opened tucks
  // this padding into the keyboard so the pill does not jump on hide.
  const bottomPad = Math.max(insets.bottom, COMPOSER_MARGIN);

  return (
    <View
      testID="composer"
      onLayout={onWrapLayout}
      style={[styles.wrap, { paddingBottom: bottomPad }]}>
      <ComposerChrome style={styles.pill}>
        <View style={[styles.inputWrap, { minHeight: sendSize }]}>
          <TextInput
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
            style={[
              styles.input,
              {
                color: theme.colors.text,
                maxHeight: maxInputHeight,
                backgroundColor: disabled
                  ? theme.colors.disabled
                  : "transparent",
              },
            ]}
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
          style={[
            styles.send,
            {
              width: sendSize,
              height: sendSize,
              opacity: canSend ? 1 : 0.4,
            },
            animatedSendStyle,
          ]}>
          <Text
            style={[styles.sendLabel, { color: theme.colors.primary }]}
            allowFontScaling={false}>
            Send
          </Text>
        </AnimatedPressable>
      </ComposerChrome>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    paddingHorizontal: theme.space(3),
    paddingTop: theme.space(2),
  },
  glassHost: {
    borderRadius: theme.radius.sheet,
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
  inputWrap: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  input: {
    fontSize: theme.type.body.size,
    fontWeight: theme.type.body.weight,
    includeFontPadding: false,
    letterSpacing: theme.type.body.letterSpacing,
    lineHeight: theme.type.body.lineHeight,
    margin: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    textAlignVertical: "center",
  },
  send: {
    alignItems: "center",
    borderRadius: theme.radius.full,
    justifyContent: "center",
  },
  sendLabel: {
    fontSize: theme.type.subhead.size,
    fontWeight: theme.type.headline.weight,
  },
}));
