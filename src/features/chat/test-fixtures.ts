/**
 * Test-only MSW post fixtures for chat feature tests.
 * Do not import from production code.
 */

export function makePost(
  id: number,
  overrides?: Partial<{
    userId: number;
    title: string;
    body: string;
    createdAt: string;
  }>
) {
  return {
    id,
    userId: overrides?.userId ?? 5,
    title: overrides?.title ?? `Title ${id}`,
    body: overrides?.body ?? `Body ${id}`,
    tags: [] as string[],
    category: "General",
    createdAt: overrides?.createdAt ?? "2025-07-01T10:12:00Z",
  };
}
