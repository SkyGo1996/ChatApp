import axios from "axios";

import { handleRateLimit } from "./rate-limit";

export const API_BASE_URL = "https://responserift.dev/api";

export type ApiError = {
  /** Absent on network/timeout; may be set to `undefined` explicitly when normalizing. */
  status?: number | undefined;
  message: string;
  retryAfter?: string | undefined;
  headers?: Record<string, string> | undefined;
  raw: unknown;
};

function normalizeHeaders(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
    else if (typeof v === "number") out[k] = String(v);
    else if (Array.isArray(v) && typeof v[0] === "string") out[k] = v[0];
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function toApiError(error: unknown): ApiError {
  // axios error shape
  const ax = error as {
    response?: {
      status?: number;
      data?: { error?: string } & Record<string, unknown>;
      headers?: unknown;
    };
    message?: string;
    code?: string;
  };

  const status = ax?.response?.status;
  const headers = normalizeHeaders(ax?.response?.headers);
  const retryAfter =
    headers?.["retry-after"] ??
    (headers
      ? headers[
          Object.keys(headers).find((k) => k.toLowerCase() === "retry-after") ??
            ""
        ]
      : undefined);

  // Prefer header lookup case-insensitive for retry-after
  let resolvedRetryAfter: string | undefined;
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === "retry-after") {
        resolvedRetryAfter = v;
        break;
      }
    }
  } else if (retryAfter) {
    resolvedRetryAfter = retryAfter;
  }

  const message =
    (ax?.response?.data as { error?: string } | undefined)?.error ??
    ax?.message ??
    (typeof error === "string" ? error : "Unknown error");

  return {
    status,
    message,
    retryAfter: resolvedRetryAfter,
    headers,
    raw: error,
  };
}

export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  // Ensure JSON header stays set; no PII logging.
  config.headers.set("Content-Type", "application/json");
  return config;
});

client.interceptors.response.use(
  (response) => {
    // Forward rate-limit headers even on success for QA warning (<10)
    const headers = normalizeHeaders(
      (response as { headers?: unknown }).headers
    );
    if (headers) {
      const remaining =
        headers["x-ratelimit-remaining"] ??
        (() => {
          for (const [k, v] of Object.entries(headers)) {
            if (k.toLowerCase() === "x-ratelimit-remaining") return v;
          }
          return undefined;
        })();
      if (remaining !== undefined) {
        // Trigger QA warning without breaking request
        handleRateLimit({ headers });
      }
    }
    return response;
  },
  (error: unknown) => {
    const apiError = toApiError(error);
    // Surface toast / warn for 429 and low remaining
    // Do not swallow error — always reject with normalized shape
    handleRateLimit({
      status: apiError.status,
      retryAfter: apiError.retryAfter,
      headers: apiError.headers,
    });
    // Normalized ApiError is the app's error contract — not a raw Error subclass.
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(apiError);
  }
);

// Helpers shared with query-client for retry logic
export function isRetryableStatus(status?: number): boolean {
  if (status === undefined || status === null) return true; // network/timeout (ECONNABORTED)
  if (status === 429) return true;
  return status >= 500;
}

export function getRetryAfterMs(
  retryAfter?: string,
  headers?: Record<string, string>
): number | undefined {
  const raw =
    retryAfter ??
    (() => {
      if (!headers) return undefined;
      for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === "retry-after") return v;
      }
      return undefined;
    })();
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (!Number.isNaN(seconds) && seconds >= 0) {
    // spec: min 1s enforced by caller via Math.max(1000, ...)
    return seconds * 1000;
  }
  const dateMs = Date.parse(raw);
  if (!Number.isNaN(dateMs)) {
    const diff = dateMs - Date.now();
    if (diff > 0 && diff < 60 * 60 * 1000) return diff;
  }
  return undefined;
}
