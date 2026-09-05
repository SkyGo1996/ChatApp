import { useEffect } from "react";
import { AccessibilityInfo, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import { motion } from "@/theme/tokens";

type Props = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

/**
 * Pulsing skeleton block. Opacity pulse uses theme.motion.shimmer (1200ms).
 * Static when Reduce Motion is enabled.
 */
export function Shimmer({
  width = "100%",
  height = 14,
  borderRadius,
  style,
}: Props) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        opacity.value = 0.55;
        return;
      }
      opacity.value = withRepeat(
        withTiming(1, { duration: motion.shimmer.duration }),
        -1,
        true
      );
    });
    return () => {
      cancelled = true;
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius: borderRadius ?? styles.block.borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  block: {
    backgroundColor: theme.colors.surface3,
    borderRadius: theme.radius.sm,
  },
}));
