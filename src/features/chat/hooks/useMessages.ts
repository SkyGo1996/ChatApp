import {
  infiniteQueryOptions,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/lib/query-keys";
import type { ApiError } from "@/services/api/client";

import {
  MESSAGES_PAGE_SIZE,
  fetchMessagesPage,
  fetchNewestMessagesPage,
  type MessagesPage,
} from "@/features/chat/api/fetchMessagesPage";
import type { Message } from "@/features/chat/types";

/** `'tail'` loads the newest page; numeric offsets load older pages via previousCursor. */
export type MessagesPageParam = "tail" | number;

export function messagesInfiniteOptions(conversationId: string | number) {
  return infiniteQueryOptions<
    MessagesPage,
    Error,
    InfiniteData<MessagesPage, MessagesPageParam>,
    ReturnType<typeof queryKeys.messages>,
    MessagesPageParam
  >({
    queryKey: queryKeys.messages(conversationId),
    queryFn: ({ pageParam }) => {
      if (pageParam === "tail") {
        return fetchNewestMessagesPage(conversationId);
      }
      return fetchMessagesPage(conversationId, {
        limit: MESSAGES_PAGE_SIZE,
        offset: pageParam,
      });
    },
    initialPageParam: "tail",
    getPreviousPageParam: (firstPage) => firstPage.previousCursor ?? undefined,
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
