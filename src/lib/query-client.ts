import { QueryClient } from "@tanstack/react-query";

import { getRetryAfterMs, isRetryableStatus } from "@/services/api/client";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5m = max-age 300
        gcTime: 30 * 60 * 1000, // 30m
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: (failureCount, error: unknown) => {
          if (failureCount >= 1) return false;
          const status = (error as { status?: number })?.status;
          return isRetryableStatus(status);
        },
        retryDelay: (attemptIndex, error: unknown) => {
          const e = error as {
            retryAfter?: string;
            headers?: Record<string, string>;
          };
          const ms = getRetryAfterMs(e?.retryAfter, e?.headers);
          if (ms !== undefined) return Math.max(1000, ms);
          return Math.min(500 * 2 ** attemptIndex, 2000);
        },
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

// Singleton for app lifetime; re-created on ErrorBoundary Retry via key remount.
export const queryClient = createQueryClient();
