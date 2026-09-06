import type { InfiniteData } from "@tanstack/react-query";

import {
  MESSAGES_PAGE_SIZE,
  type MessagesPage,
} from "@/features/chat/api/fetchMessagesPage";
import type { Message } from "@/features/chat/types";
import type { ConversationsInfiniteData } from "@/features/conversations/hooks/useConversations";

/** Mirrors useMessages page params — kept local to avoid a hook↔helper cycle. */
type MessagesPageParam = "tail" | { offset: number; limit: number };

type MessagesInfiniteData = InfiniteData<MessagesPage, MessagesPageParam>;

/**
 * Append an outgoing Message to the newest (last) messages page.
 * Seeds a `'tail'` page when the cache is empty so send works before GET.
 */
export function appendOutgoing(
  data: MessagesInfiniteData | undefined,
  message: Message
): MessagesInfiniteData {
  if (!data || data.pages.length === 0) {
    return {
      pages: [
        {
          items: [message],
          nextCursor: null,
          previousCursor: null,
          total: 0,
          offset: 0,
          limit: MESSAGES_PAGE_SIZE,
        },
      ],
      pageParams: ["tail"],
    };
  }

  const lastIndex = data.pages.length - 1;
  const pages = data.pages.map((page, index) => {
    if (index !== lastIndex) return page;
    return { ...page, items: [...page.items, message] };
  });
  return { ...data, pages };
}

/**
 * Find one Message by id across all cached pages.
 */
export function findOutgoing(
  data: MessagesInfiniteData | undefined,
  localId: string | number
): Message | undefined {
  const idKey = String(localId);
  for (const page of data?.pages ?? []) {
    const found = page.items.find((message) => String(message.id) === idKey);
    if (found) return found;
  }
  return undefined;
}

/**
 * Patch one outgoing Message by local id across all cached pages.
 */
export function updateOutgoing(
  data: MessagesInfiniteData | undefined,
  localId: string | number,
  patch: Partial<Message>
): MessagesInfiniteData | undefined {
  if (!data) return data;
  const idKey = String(localId);
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((message) =>
        String(message.id) === idKey ? { ...message, ...patch } : message
      ),
    })),
  };
}

/**
 * Replace one outgoing Message by local id with the server Message (201).
 */
export function replaceOutgoing(
  data: MessagesInfiniteData | undefined,
  localId: string | number,
  next: Message
): MessagesInfiniteData | undefined {
  if (!data) return data;
  const idKey = String(localId);
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((message) =>
        String(message.id) === idKey ? next : message
      ),
    })),
  };
}

/**
 * Locally patch Conversations preview fields after a successful send.
 * No-op when the conversations list was never loaded.
 */
export function patchConversationPreview(
  data: ConversationsInfiniteData | undefined,
  contactId: string | number,
  lastMessage: string,
  lastMessageAt: string
): ConversationsInfiniteData | undefined {
  if (!data) return data;
  const id = Number(contactId);
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((conversation) =>
        conversation.id === id
          ? { ...conversation, lastMessage, lastMessageAt }
          : conversation
      ),
    })),
  };
}

/**
 * Re-attach outgoing `me` Messages after a tail GET (mock POST is not persisted).
 * Covers in-flight `local-*` rows and server-shaped rows (e.g. id 101) omitted by GET.
 */
export function preserveOutgoingOnTail(
  previous: MessagesInfiniteData | undefined,
  nextTailPage: MessagesPage
): MessagesPage {
  if (!previous) return nextTailPage;

  const outgoing = previous.pages
    .flatMap((page) => page.items)
    .filter((message) => message.sender === "me");
  if (outgoing.length === 0) return nextTailPage;

  const existingIds = new Set(
    nextTailPage.items.map((message) => String(message.id))
  );
  const toAppend = outgoing.filter(
    (message) => !existingIds.has(String(message.id))
  );
  if (toAppend.length === 0) return nextTailPage;

  return {
    ...nextTailPage,
    items: [...nextTailPage.items, ...toAppend],
  };
}
