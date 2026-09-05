import { queryOptions, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ApiError } from "@/services/api/client";
import { createConcurrencyLimiter } from "@/utils/concurrency";

import { fetchLatestPreview } from "@/features/conversations/api/fetchLatestPreview";

/** Cap concurrent enrichment requests (ticket 05: 3–5). */
const PREVIEW_CONCURRENCY = 4;
const previewLimiter = createConcurrencyLimiter(PREVIEW_CONCURRENCY);

export function conversationPreviewOptions(contactId: string | number) {
  return queryOptions({
    queryKey: [...queryKeys.messages(contactId), { limit: 1 }] as const,
    queryFn: () => previewLimiter.run(() => fetchLatestPreview(contactId)),
  });
}

/**
 * Enrich a Conversation row with latest-post preview.
 * Failures (429/timeout/5xx) surface as isError — UI falls soft to placeholder.
 */
export function useConversationPreview(contactId: string | number) {
  const query = useQuery(conversationPreviewOptions(contactId));

  return {
    ...query,
    preview: query.data ?? null,
    error: query.error as ApiError | null,
  };
}
