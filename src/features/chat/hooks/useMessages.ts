import {
  infiniteQueryOptions,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/lib/query-keys";
import type { ApiError } from "@/services/api/client";

import {
  fetchMessagesPage,
  fetchNewestMessagesPage,
  type MessagesPage,
} from "@/features/chat/api/fetchMessagesPage";
import type { Message } from "@/features/chat/types";

import { preserveOutgoingOnTail } from "./outgoingCache";

/** `'tail'` loads the newest page; offset+limit load older non-overlapping windows. */
export type MessagesPageParam = "tail" | { offset: number; limit: number };

/**
 * Older page window that does not overlap the current page when
 * `total % pageSize !== 0` (e.g. total 45 → 25/20, then 5/20, then 0/5).
 */
export function getOlderMessagesPageParam(
  page: Pick<MessagesPage, "offset" | "limit">
): { offset: number; limit: number } | undefined {
  if (page.offset <= 0) return undefined;
  return {
    offset: Math.max(0, page.offset - page.limit),
    limit: Math.min(page.limit, page.offset),
  };
}

export function messagesInfiniteOptions(conversationId: string | number) {
  return infiniteQueryOptions<
    MessagesPage,
    Error,
    InfiniteData<MessagesPage, MessagesPageParam>,
    ReturnType<typeof queryKeys.messages>,
    MessagesPageParam
  >({
    queryKey: queryKeys.messages(conversationId),
    queryFn: async ({ pageParam, client, queryKey }) => {
      if (pageParam === "tail") {
        // Mock POST is not in subsequent GETs — re-attach outgoing `me` rows
        // (in-flight local-* and server-shaped id 101) on refetch.
        // Read cache AFTER the await so send during skeleton is not wiped.
        const page = await fetchNewestMessagesPage(conversationId);
        const previous = client.getQueryData<MessagesInfiniteData>(queryKey);
        return preserveOutgoingOnTail(previous, page);
      }
      return fetchMessagesPage(conversationId, {
        limit: pageParam.limit,
        offset: pageParam.offset,
      });
    },
    initialPageParam: "tail",
    getPreviousPageParam: (firstPage) => getOlderMessagesPageParam(firstPage),
    // No newer API pages — ticket 08 appends local sends into cache.
    getNextPageParam: () => undefined,
  });
}

/**
 * Paginated Message history for a Contact.
 * Pages stay oldest→newest (API order). Never reverse — FlashList v2
 * `startRenderingFromBottom` handles initial scroll position.
 */
export function useMessages(conversationId: string | number) {
  const query = useInfiniteQuery(messagesInfiniteOptions(conversationId));

  const items = useMemo(() => {
    const pages = query.data?.pages;
    if (!pages) return [] as Message[];
    return pages.flatMap((page) => page.items);
  }, [query.data?.pages]);

  return {
    ...query,
    items,
    error: query.error as ApiError | null,
  };
}

export type MessagesInfiniteData = InfiniteData<
  MessagesPage,
  MessagesPageParam
>;
