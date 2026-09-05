import { adaptOffsetPage } from "./pagination";

describe("adaptOffsetPage", () => {
  test("maps results to items and sets nextCursor when more remain", () => {
    const page = adaptOffsetPage({
      total: 60,
      limit: 20,
      offset: 0,
      results: [{ id: 1 }, { id: 2 }],
    });
    expect(page.items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(page.nextCursor).toBe(2);
    expect(page.previousCursor).toBeNull();
  });

  test("nextCursor is null on last page; previousCursor points to prior page", () => {
    const page = adaptOffsetPage({
      total: 22,
      limit: 20,
      offset: 20,
      results: [{ id: 21 }, { id: 22 }],
    });
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
    expect(page.previousCursor).toBe(0);
  });

  test("empty results yields empty items and null cursors", () => {
    const page = adaptOffsetPage({
      total: 0,
      limit: 20,
      offset: 0,
      results: [],
    });
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
    expect(page.previousCursor).toBeNull();
  });

  test("nextCursor and previousCursor for a mid-collection page", () => {
    const page = adaptOffsetPage({
      total: 60,
      limit: 20,
      offset: 20,
      results: Array.from({ length: 20 }, (_, i) => ({ id: 21 + i })),
    });
    expect(page.nextCursor).toBe(40);
    expect(page.previousCursor).toBe(0);
  });

  test("previousCursor clamps when offset is smaller than limit", () => {
    const page = adaptOffsetPage({
      total: 25,
      limit: 20,
      offset: 5,
      results: Array.from({ length: 20 }, (_, i) => ({ id: 6 + i })),
    });
    expect(page.previousCursor).toBe(0);
    expect(page.nextCursor).toBeNull();
  });
});
