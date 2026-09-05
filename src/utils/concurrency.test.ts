import { createConcurrencyLimiter } from "./concurrency";

describe("createConcurrencyLimiter", () => {
  test("rejects max < 1", () => {
    expect(() => createConcurrencyLimiter(0)).toThrow(/max must be >= 1/);
  });

  test("never runs more than max tasks concurrently", async () => {
    const limiter = createConcurrencyLimiter(2);
    let maxSeen = 0;
    let inFlight = 0;

    const tasks = Array.from({ length: 6 }, (_, i) =>
      limiter.run(async () => {
        inFlight += 1;
        maxSeen = Math.max(maxSeen, inFlight);
        await new Promise((r) => setTimeout(r, 20));
        inFlight -= 1;
        return i;
      })
    );

    const results = await Promise.all(tasks);
    expect(results).toEqual([0, 1, 2, 3, 4, 5]);
    expect(maxSeen).toBeLessThanOrEqual(2);
    expect(limiter.activeCount).toBe(0);
    expect(limiter.pendingCount).toBe(0);
  });

  test("propagates errors without stalling the queue", async () => {
    const limiter = createConcurrencyLimiter(1);
    const failed = limiter.run(() => Promise.reject(new Error("boom")));
    await expect(failed).rejects.toThrow("boom");

    const ok = await limiter.run(() => Promise.resolve("ok"));
    expect(ok).toBe("ok");
  });
});
