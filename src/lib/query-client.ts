import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/services/api/client";
import { getRetryAfterMs, isRetryableStatus } from "@/services/api/client";
import { handleRateLimit } from "@/services/api/rate-limit";

/** Toast 429 only after TanStack retries are exhausted (not mid-flight). */
function notifySettledRateLimit(error: unknown): void {
  const e = error as ApiError;
  if (e.status !== 429) return;
  handleRateLimit({
    status: e.status,
    retryAfter: e.retryAfter,
    headers: e.headers,
  });
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        notifySettledRateLimit(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        notifySettledRateLimit(error);
      },
    }),
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
