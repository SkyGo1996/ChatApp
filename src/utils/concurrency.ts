/**
 * Simple promise-based concurrency limiter.
 * At most `max` tasks run at once; the rest wait in FIFO order.
 */
export function createConcurrencyLimiter(max: number) {
  if (max < 1) {
    throw new Error("createConcurrencyLimiter: max must be >= 1");
  }

  let active = 0;
  const queue: (() => void)[] = [];

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= max) {
      await new Promise<void>((resolve) => {
        queue.push(resolve);
      });
    }
    active += 1;
    try {
      return await fn();
    } finally {
      active -= 1;
      const next = queue.shift();
      if (next) next();
    }
  }

  return {
    run,
    /** Current in-flight count (for tests). */
    get activeCount() {
      return active;
    },
    /** Waiting tasks count (for tests). */
    get pendingCount() {
      return queue.length;
    },
  };
}
