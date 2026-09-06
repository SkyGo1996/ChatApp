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

  test("coerces string / number / first array string, drops nested objects", () => {
    expect(
      normalizeHeaders({
        a: "1",
        b: 2,
        c: ["3", "4"],
        d: { nested: true },
      })
    ).toEqual({ a: "1", b: "2", c: "3" });
  });

  test("returns undefined when nothing coercible remains", () => {
    expect(normalizeHeaders({})).toBeUndefined();
    expect(normalizeHeaders({ d: { nested: true } })).toBeUndefined();
    expect(normalizeHeaders({ e: [0] })).toBeUndefined();
  });
});
