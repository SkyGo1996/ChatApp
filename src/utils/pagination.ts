/**
 * Adapt API offset pagination `{ total, limit, offset, results }` to
 * client shape `{ items, nextCursor, previousCursor }` for TanStack
 * infinite queries (forward and older-on-scroll-up).
 */
export type OffsetPage<T> = {
  total: number;
  limit: number;
  offset: number;
  results: T[];
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: number | null;
  /** Offset for the previous (older) page; null at the start of the collection. */
  previousCursor: number | null;
};

export function adaptOffsetPage<T>(page: OffsetPage<T>): CursorPage<T> {
  const { total, limit, offset, results } = page;
  const nextOffset = offset + results.length;
  const nextCursor = nextOffset < total ? nextOffset : null;
  const previousCursor = offset > 0 ? Math.max(0, offset - limit) : null;
  return {
    items: results,
    nextCursor,
    previousCursor,
  };
}
