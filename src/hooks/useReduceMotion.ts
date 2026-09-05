import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Reduce Motion preference.
 * Defaults to `true` until the async AccessibilityInfo read resolves so
 * first-paint press/entrance/shimmer never run while Reduce Motion is on.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}
