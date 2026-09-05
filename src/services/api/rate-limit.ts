import { toast } from "sonner-native";

import { getHeader } from "./headers";

export type RateLimitInfo = {
  status?: number | undefined;
  retryAfter?: string | undefined;
  headers?: Record<string, string> | undefined;
};

export function handleRateLimit(info: RateLimitInfo): void {
  const headers = info.headers;
  const status = info.status;

  // 429 → toast + obey retry-after (toast always shown)
  if (status === 429) {
    const retryAfter = info.retryAfter ?? getHeader(headers, "retry-after");
    const detail = retryAfter ? `Retry after ${retryAfter}s` : undefined;
    toast.error(
      "Too many requests — try again",
      detail !== undefined ? { description: detail } : undefined
    );
    return;
  }

  // x-ratelimit-remaining < 10 → warn for QA without breaking request
  const remainingRaw = getHeader(headers, "x-ratelimit-remaining");
  if (remainingRaw !== undefined) {
    const remaining = Number(remainingRaw);
    if (!Number.isNaN(remaining) && remaining < 10) {
      const msg = `Rate limit low: ${remaining} remaining`;
      if (__DEV__) {
        console.warn(`[rate-limit] ${msg}`, headers);
      }
      toast.warning(msg);
    }
  }
}
