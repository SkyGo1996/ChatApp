import { ChevronDown } from "lucide-react-native";
import { useEffect } from "react";
import { Platform, Pressable } from "react-native";
import Animated, {
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
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ANDROID_PRESS_SCALE = 0.92;

/**
 * Floating scroll-to-bottom control.
 * Appear/hide: 200ms opacity fade on both platforms.
 * Android tap: fabSpring scale (not opacity). Reduce Motion → instant.
 */
export function ScrollToBottomFAB({ visible, onPress }: Props) {
  const { theme } = useUnistyles();
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(visible ? 1 : 0);
  const scale = useSharedValue(1);
  const chrome = chromeFab(theme);
  const androidPress = Platform.OS === "android" && !reduceMotion;

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
    scale.value = withSpring(ANDROID_PRESS_SCALE, {
      damping: motionExpressive.fabSpring.damping,
      stiffness: motionExpressive.fabSpring.stiffness,
    });
  };

  const handlePressOut = () => {
    if (!androidPress) return;
    scale.value = withSpring(1, {
      damping: motionExpressive.fabSpring.damping,
      stiffness: motionExpressive.fabSpring.stiffness,
    });
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
      style={[
        styles.fab,
        {
          backgroundColor: chrome.backgroundColor,
          borderColor: chrome.borderColor,
          borderWidth: chrome.borderWidth,
          elevation: chrome.elevation,
        },
        animatedStyle,
      ]}>
      <ChevronDown size={24} color={theme.colors.text} strokeWidth={2} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  fab: {
    alignItems: "center",
    borderRadius: theme.radius.full,
    bottom: theme.space(6),
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: theme.space(4),
    width: 48,
    zIndex: 2,
  },
}));
