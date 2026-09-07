import { useEffect, useState } from "react";

import { getRetryAfterMs, type ApiError } from "@/services/api/client";

/**
 * Disables Retry while a 429 `retry-after` window is active.
 * Uses identity tracking so a new error object resets the lockout.
 */
export function useRetryDisabledUntil(error: ApiError | null): boolean {
  const [trackedError, setTrackedError] = useState(error);
  const [disabled, setDisabled] = useState(() => error?.status === 429);

  if (error !== trackedError) {
    setTrackedError(error);
    setDisabled(error?.status === 429);
  }

  useEffect(() => {
    if (error?.status !== 429) return;
    const ms = getRetryAfterMs(error.retryAfter, error.headers);
    const wait = Math.max(1000, ms ?? 1000);
    const id = setTimeout(() => {
      setDisabled(false);
    }, wait);
    return () => clearTimeout(id);
  }, [error]);

  return disabled;
}
