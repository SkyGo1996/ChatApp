import { client } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { adaptOffsetPage } from "@/utils/pagination";

import type { ConversationPreview } from "@/features/conversations/types";

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

function collapseWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/**
 * Fetch the latest post for a Contact (`limit 1`) as conversation preview.
 * Returns null when the Contact has no posts.
 *
 * Note: `endpoints.chat.messages` already embeds `?userId=`. Append `&limit=1`
 * instead of axios `params` — the Jest fetch adapter double-appends `?` when
 * the URL already has a query string.
 */
export async function fetchLatestPreview(
  contactId: string | number
): Promise<ConversationPreview | null> {
  const { data } = await client.get<ApiOffsetPage>(
    `${endpoints.chat.messages(contactId)}&limit=1`
  );

  const adapted = adaptOffsetPage(data);
  const post = adapted.items[0];
  if (!post) return null;

  const text = collapseWhitespace(post.body);
  if (!text) return null;

  return {
    text,
    createdAt: post.createdAt,
  };
}
