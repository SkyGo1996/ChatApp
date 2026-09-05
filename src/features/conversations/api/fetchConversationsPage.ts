import { client } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { adaptOffsetPage, type CursorPage } from "@/utils/pagination";

import type { Conversation } from "@/features/conversations/types";

export const CONVERSATIONS_PAGE_SIZE = 20;

/** Raw user fields we read from GET /users — never log PII beyond id/name/avatar. */
type ApiUser = {
  id: number;
  name: string;
  avatar: string;
};

type ApiOffsetPage = {
  total: number;
  limit: number;
  offset: number;
  results: ApiUser[];
};

function toConversation(user: ApiUser): Conversation {
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
  };
}

export async function fetchConversationsPage(params?: {
  limit?: number;
  offset?: number;
}): Promise<CursorPage<Conversation>> {
  const limit = params?.limit ?? CONVERSATIONS_PAGE_SIZE;
  const offset = params?.offset ?? 0;

  const { data } = await client.get<ApiOffsetPage>(
    endpoints.conversations.list,
    { params: { limit, offset } }
  );

  const adapted = adaptOffsetPage(data);
  return {
    items: adapted.items.map(toConversation),
    nextCursor: adapted.nextCursor,
  };
}
