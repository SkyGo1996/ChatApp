import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { queryKeys } from "@/lib/query-keys";
import type { ApiError } from "@/services/api/client";
import { createConcurrencyLimiter } from "@/utils/concurrency";

import { fetchLatestPreview } from "@/features/conversations/api/fetchLatestPreview";
import type { Conversation } from "@/features/conversations/types";

/** Cap concurrent enrichment requests (ticket 05: 3–5). */
const PREVIEW_CONCURRENCY = 4;
const previewLimiter = createConcurrencyLimiter(PREVIEW_CONCURRENCY);

export function conversationPreviewOptions(contactId: string | number) {
  return queryOptions({
    queryKey: [...queryKeys.messages(contactId), { limit: 1 }] as const,
    queryFn: () => previewLimiter.run(() => fetchLatestPreview(contactId)),
  });
}

type PreviewQueryOpts = {
  /** Skip network when the Conversation already has a patched lastMessage. */
  enabled?: boolean;
};

/**
 * Enrich a Conversation row with latest-post preview.
 * Failures (429/timeout/5xx) surface as isError — UI falls soft to placeholder.
 */
export function useConversationPreview(
  contactId: string | number,
  opts?: PreviewQueryOpts
) {
  const query = useQuery({
    ...conversationPreviewOptions(contactId),
    enabled: opts?.enabled ?? true,
  });

  return {
    ...query,
    preview: query.data ?? null,
    error: query.error as ApiError | null,
  };
}

/**
 * Warm preview cache for loaded Conversations (page-level, not cell-bind).
 * Skips items that already have a patched lastMessage.
 * Reuses the same capped queryFn via prefetchQuery.
 */
export function usePrefetchConversationPreviews(items: Conversation[]): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    for (const item of items) {
      if (item.lastMessage != null) continue;
      void queryClient.prefetchQuery(conversationPreviewOptions(item.id));
    }
  }, [items, queryClient]);
}
