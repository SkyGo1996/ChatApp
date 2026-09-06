import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/**
 * Reduce Transparency preference (iOS-only meaning).
 * Defaults to `true` until the async read resolves so first paint never
 * shows glass while Reduce Transparency is on. Android always returns true
 * (composer/chrome stay solid tonal — no glass to reduce).
 */
export function useReduceTransparency(): boolean {
  const [reduceTransparency, setReduceTransparency] = useState(true);

  useEffect(() => {
    if (Platform.OS !== "ios") {
      return;
    }

    let cancelled = false;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((enabled) => {
      if (!cancelled) setReduceTransparency(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduceTransparency
    );
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return reduceTransparency;
}
