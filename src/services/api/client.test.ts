import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { toast } from "sonner-native";

import { mswProfileDetailUrl, useNodeHttpAdapterForMsw } from "@/test-msw";

import { client, getRetryAfterMs, isRetryableStatus } from "./client";
import { endpoints } from "./endpoints";

const server = setupServer();

beforeAll(() => {
  useNodeHttpAdapterForMsw();
  server.listen({ onUnhandledRequest: "error" });
});
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

describe("client error interceptor", () => {
  describe("when the response is 429", () => {
    it("should reject with ApiError without toasting", async () => {
      // Arrange
      const contactId = 3;
      server.use(
        http.get(mswProfileDetailUrl(contactId), () =>
          HttpResponse.json(
            { error: "Too many requests" },
            {
              status: 429,
              headers: {
                "retry-after": "2",
                "x-ratelimit-remaining": "0",
              },
            }
          )
        )
      );

      // Act
      const rejection = client.get(endpoints.profile.detail(contactId));

      // Assert
      await expect(rejection).rejects.toMatchObject({
        status: 429,
        message: "Too many requests",
        retryAfter: "2",
      });
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.warning).not.toHaveBeenCalled();
    });
  });
});

describe("isRetryableStatus", () => {
  test("network/timeout (undefined) is retryable", () => {
    expect(isRetryableStatus(undefined)).toBe(true);
  });

  test("429 and 5xx are retryable", () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
  });

  test("4xx (non-429) are not retryable", () => {
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
  });
});

describe("getRetryAfterMs", () => {
  test("prefers explicit retryAfter over headers", () => {
    expect(getRetryAfterMs("2", { "retry-after": "9" })).toBe(2000);
  });

  test("reads retry-after from headers case-insensitively", () => {
    expect(getRetryAfterMs(undefined, { "Retry-After": "3" })).toBe(3000);
  });

  test("parses HTTP-date when not a number of seconds", () => {
    const future = new Date(Date.now() + 5000).toUTCString();
    const ms = getRetryAfterMs(future);
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(5000);
  });

  test("returns undefined for missing/invalid values", () => {
    expect(getRetryAfterMs(undefined, undefined)).toBeUndefined();
    expect(getRetryAfterMs("not-a-date", {})).toBeUndefined();
    expect(getRetryAfterMs("-5")).toBeUndefined();
  });

  test("returns 0ms for 0 seconds (caller enforces min 1s)", () => {
    expect(getRetryAfterMs("0")).toBe(0);
  });

  test("caps HTTP-date diff at 1h (returns undefined beyond)", () => {
    const farFuture = new Date(Date.now() + 2 * 60 * 60 * 1000).toUTCString();
    expect(getRetryAfterMs(farFuture)).toBeUndefined();
  });

  test("returns undefined for past HTTP-date", () => {
    const past = new Date(Date.now() - 5000).toUTCString();
    expect(getRetryAfterMs(past)).toBeUndefined();
  });
});
