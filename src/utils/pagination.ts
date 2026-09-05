/**
 * Adapt API offset pagination `{ total, limit, offset, results }` to
 * client shape `{ items, nextCursor }` for TanStack infinite queries.
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
};

export function adaptOffsetPage<T>(page: OffsetPage<T>): CursorPage<T> {
  const { total, offset, results } = page;
  const nextOffset = offset + results.length;
  const nextCursor = nextOffset < total ? nextOffset : null;
  return {
    items: results,
    nextCursor,
  };
}
