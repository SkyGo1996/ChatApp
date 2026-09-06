import { ChevronDown } from "lucide-react-native";
import { useEffect } from "react";
import { Platform, Pressable } from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { useReduceMotion } from "@/hooks/useReduceMotion";
import { chromeFab } from "@/theme/recipes";
import { motion, motionExpressive } from "@/theme/tokens";

type Props = {
  visible: boolean;
  onPress: () => void;
  /** Distance from screen bottom so FAB sits above the composer. */
  bottomOffset?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FAB_PRESS_SCALE = 0.92;

/** Module-scope so React Compiler does not treat SharedValue writes as immutable. */
function fabPressInSpring(scale: SharedValue<number>): void {
  scale.value = withSpring(FAB_PRESS_SCALE, {
    damping: motionExpressive.fabSpring.damping,
    stiffness: motionExpressive.fabSpring.stiffness,
  });
}

function fabPressOutSpring(scale: SharedValue<number>): void {
  scale.value = withSpring(1, {
    damping: motionExpressive.fabSpring.damping,
    stiffness: motionExpressive.fabSpring.stiffness,
  });
}

/**
 * Floating scroll-to-bottom control.
 * Appear/hide: 200ms opacity fade on both platforms.
 * Android tap: fabSpring scale (not opacity). Reduce Motion → instant.
 */
export function ScrollToBottomFAB({ visible, onPress, bottomOffset }: Props) {
  const { theme } = useUnistyles();
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(visible ? 1 : 0);
  const scale = useSharedValue(1);
  const androidPress = Platform.OS === "android" && !reduceMotion;
  const bottom = bottomOffset ?? theme.space(6);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = visible ? 1 : 0;
      return;
    }
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: motion.scrollFab.duration,
    });
  }, [visible, reduceMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!androidPress || !visible) return;
    fabPressInSpring(scale);
  };

  const handlePressOut = () => {
    if (!androidPress) return;
    fabPressOutSpring(scale);
  };

  const handlePress = () => {
    if (!visible) return;
    onPress();
  };

  return (
    <AnimatedPressable
      testID="scroll-to-bottom-fab"
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!visible}
      pointerEvents={visible ? "auto" : "none"}
      accessibilityRole="button"
      accessibilityLabel="Scroll to bottom"
      accessibilityState={{ disabled: !visible }}
      style={[styles.fab(bottom), animatedStyle]}>
      <ChevronDown size={24} color={theme.colors.text} strokeWidth={2} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create((theme) => {
  const chrome = chromeFab(theme);
  return {
    fab: (bottom: number) => ({
      alignItems: "center",
      backgroundColor: chrome.backgroundColor,
      borderColor: chrome.borderColor,
      borderRadius: theme.radius.full,
      borderWidth: chrome.borderWidth,
      bottom,
      elevation: chrome.elevation,
      height: 48,
      justifyContent: "center",
      position: "absolute",
      right: theme.space(4),
      width: 48,
      zIndex: 2,
    }),
  };
});
