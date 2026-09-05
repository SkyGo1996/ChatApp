import { QueryClient } from "@tanstack/react-query";

function isRetryableStatus(status?: number): boolean {
  if (status === undefined || status === null) return true; // network error
  if (status === 429) return true;
  return status >= 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5m = max-age 300
        gcTime: 30 * 60 * 1000, // 30m
        retry: (failureCount, error: unknown) => {
          if (failureCount >= 1) return false;
          const status = (error as { status?: number })?.status;
          return isRetryableStatus(status);
        },
        retryDelay: (attemptIndex, error: unknown) => {
          const raw =
            (error as { retryAfter?: string; headers?: Record<string, string> })
              ?.retryAfter ??
            (error as { headers?: Record<string, string> })?.headers?.[
              "retry-after"
            ];
          if (raw) {
            const seconds = Number(raw);
            if (!Number.isNaN(seconds) && seconds > 0) return seconds * 1000;
            // HTTP-date fallback: try parse
            const dateMs = Date.parse(raw);
            if (!Number.isNaN(dateMs)) {
              const diff = dateMs - Date.now();
              if (diff > 0 && diff < 60 * 60 * 1000) return diff;
            }
          }
          return Math.min(1000 * 2 ** attemptIndex, 30000);
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
