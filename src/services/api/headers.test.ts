import { getRetryAfterMs } from "./client";
import { getHeader, normalizeHeaders } from "./headers";

describe("getHeader", () => {
  test("returns undefined for missing headers", () => {
    expect(getHeader(undefined, "retry-after")).toBeUndefined();
    expect(getHeader({}, "retry-after")).toBeUndefined();
  });

  test("matches case-insensitively", () => {
    expect(getHeader({ "Retry-After": "5" }, "retry-after")).toBe("5");
    expect(
      getHeader({ "X-RateLimit-Remaining": "9" }, "x-ratelimit-remaining")
    ).toBe("9");
  });
});

describe("normalizeHeaders", () => {
  test("returns undefined for non-objects", () => {
    expect(normalizeHeaders(null)).toBeUndefined();
    expect(normalizeHeaders("x")).toBeUndefined();
  });

  test("coerces string / number / first array string", () => {
    expect(
      normalizeHeaders({
        a: "1",
        b: 2,
        c: ["3", "4"],
        d: { nested: true },
      })
    ).toEqual({ a: "1", b: "2", c: "3" });
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
});
