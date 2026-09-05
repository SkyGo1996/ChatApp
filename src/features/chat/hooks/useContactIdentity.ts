import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/lib/query-keys";

import type { ConversationsInfiniteData } from "@/features/conversations/hooks/useConversations";

export type ContactIdentity = {
  name: string;
  avatar: string | null;
};

/**
 * Resolve Contact name/avatar from route params, falling back to the
 * conversations infinite-query cache. Does not fetch Profile (ticket 10).
 */
export function useContactIdentity(
  conversationId: string,
  params: { name?: string | undefined; avatar?: string | undefined }
): ContactIdentity {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const fromParamsName = params.name?.trim();
    const fromParamsAvatar = params.avatar?.trim();

    if (fromParamsName) {
      return {
        name: fromParamsName,
        avatar: fromParamsAvatar || null,
      };
    }

    const cached = queryClient.getQueryData<ConversationsInfiniteData>(
      queryKeys.conversations()
    );
    const match = cached?.pages
      .flatMap((page) => page.items)
      .find((item) => String(item.id) === conversationId);

    if (match) {
      return { name: match.name, avatar: match.avatar };
    }

    return { name: `Chat ${conversationId}`, avatar: null };
  }, [conversationId, params.name, params.avatar, queryClient]);
}
