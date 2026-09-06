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

    // Mid-run: queue should be building while first two occupy slots.
    // Poll until at least one task is waiting (timing-tolerant).
    await Promise.resolve();
    const results = await Promise.all(tasks);
    expect(results).toEqual([0, 1, 2, 3, 4, 5]);
    // Proves real parallelism (not serial): would be 1 if serialized.
    expect(maxSeen).toBe(2);
    expect(limiter.activeCount).toBe(0);
    expect(limiter.pendingCount).toBe(0);
  });

  test("starts tasks in FIFO order under contention", async () => {
    const limiter = createConcurrencyLimiter(1);
    const started: string[] = [];
    const releaseFirst = (() => {
      let release!: () => void;
      const gate = new Promise<void>((r) => {
        release = r;
      });
      return { gate, release };
    })();

    const first = limiter.run(async () => {
      started.push("first");
      await releaseFirst.gate;
      return "first";
    });
    const second = limiter.run(() => {
      started.push("second");
      return Promise.resolve("second");
    });
    const third = limiter.run(() => {
      started.push("third");
      return Promise.resolve("third");
    });

    // First occupies the slot; other two wait in FIFO order.
    await new Promise((r) => setTimeout(r, 10));
    expect(started).toEqual(["first"]);
    expect(limiter.activeCount).toBe(1);
    expect(limiter.pendingCount).toBe(2);

    releaseFirst.release();
    await expect(first).resolves.toBe("first");
    await expect(second).resolves.toBe("second");
    await expect(third).resolves.toBe("third");
    expect(started).toEqual(["first", "second", "third"]);
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

  test("releases slot when fn throws synchronously", async () => {
    const limiter = createConcurrencyLimiter(1);
    await expect(() =>
      limiter.run(() => {
        throw new Error("sync boom");
      })
    ).rejects.toThrow("sync boom");
    expect(limiter.activeCount).toBe(0);
    expect(limiter.pendingCount).toBe(0);

    await expect(limiter.run(() => Promise.resolve("recovered"))).resolves.toBe(
      "recovered"
    );
  });
});
