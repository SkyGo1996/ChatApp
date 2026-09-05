import {
  infiniteQueryOptions,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/lib/query-keys";
import type { ApiError } from "@/services/api/client";
import type { CursorPage } from "@/utils/pagination";

import {
  CONVERSATIONS_PAGE_SIZE,
  fetchConversationsPage,
} from "@/features/conversations/api/fetchConversationsPage";
import type { Conversation } from "@/features/conversations/types";

export const conversationsInfiniteOptions = infiniteQueryOptions({
  queryKey: queryKeys.conversations(),
  queryFn: ({ pageParam }) =>
    fetchConversationsPage({
      limit: CONVERSATIONS_PAGE_SIZE,
      offset: pageParam,
    }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: CursorPage<Conversation>) =>
    lastPage.nextCursor ?? undefined,
});

export function useConversations() {
  const query = useInfiniteQuery(conversationsInfiniteOptions);

  const items = useMemo(() => {
    const pages = query.data?.pages;
    if (!pages) return [] as Conversation[];
    return pages.flatMap((page) => page.items);
  }, [query.data?.pages]);

  return {
    ...query,
    items,
    error: query.error as ApiError | null,
  };
}

export type ConversationsInfiniteData = InfiniteData<
  CursorPage<Conversation>,
  number
>;
