import { client } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { adaptOffsetPage, type CursorPage } from "@/utils/pagination";

import type { Message } from "@/features/chat/types";

export const MESSAGES_PAGE_SIZE = 20;

/** Raw post fields we read from GET /posts — bubble text is `body` only. */
type ApiPost = {
  id: number;
  userId: number;
  title: string;
  body: string;
  createdAt: string;
};

type ApiOffsetPage = {
  total: number;
  limit: number;
  offset: number;
  results: ApiPost[];
};

export type MessagesPage = CursorPage<Message> & {
  total: number;
  offset: number;
};

/**
 * Map a post to a Message. Fetched posts are always Contact (`them`);
 * locally sent Messages (ticket 08) use `me` instead.
 */
export function mapPostToMessage(post: {
  id: number;
  body: string;
  createdAt: string;
}): Message {
  return {
    id: post.id,
    text: post.body,
    sender: "them",
    createdAt: post.createdAt,
    status: "sent",
  };
}

/**
 * Fetch one chronological page of Messages for a Contact (oldest-first API order).
 * Does not reverse the array — callers keep chronological order for FlashList v2.
 */
export async function fetchMessagesPage(
  conversationId: string | number,
  params?: { limit?: number; offset?: number }
): Promise<MessagesPage> {
  const limit = params?.limit ?? MESSAGES_PAGE_SIZE;
  const offset = params?.offset ?? 0;

  const { data } = await client.get<ApiOffsetPage>(
    endpoints.chat.messages(conversationId, { limit, offset })
  );

  const adapted = adaptOffsetPage(data);
  return {
    items: adapted.items.map(mapPostToMessage),
    nextCursor: adapted.nextCursor,
    previousCursor: adapted.previousCursor,
    total: data.total,
    offset: data.offset,
  };
}

/**
 * Open chat on the newest Messages without reversing.
 * Probes offset 0 for `total`; when total > page size, refetches at
 * `offset = total - limit` so the first page is the chronological tail.
 */
export async function fetchNewestMessagesPage(
  conversationId: string | number
): Promise<MessagesPage> {
  const first = await fetchMessagesPage(conversationId, {
    limit: MESSAGES_PAGE_SIZE,
    offset: 0,
  });

  if (first.total <= MESSAGES_PAGE_SIZE) {
    return first;
  }

  return fetchMessagesPage(conversationId, {
    limit: MESSAGES_PAGE_SIZE,
    offset: first.total - MESSAGES_PAGE_SIZE,
  });
}
