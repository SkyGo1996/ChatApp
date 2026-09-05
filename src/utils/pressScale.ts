import type { SharedValue } from "react-native-reanimated";
import { withTiming } from "react-native-reanimated";

import { motion } from "@/theme/tokens";

/** Apply press-in scale on a Reanimated SharedValue (0.97 / 80ms). */
export function pressInScale(scale: SharedValue<number>): void {
  scale.value = withTiming(motion.pressScale.to, {
    duration: motion.pressScale.duration,
  });
}

/** Restore press scale to 1. */
export function pressOutScale(scale: SharedValue<number>): void {
  scale.value = withTiming(1, { duration: motion.pressScale.duration });
}
