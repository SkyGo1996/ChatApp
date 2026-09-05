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

function toPreview(post: ApiPost): ConversationPreview | null {
  const text = collapseWhitespace(post.body);
  if (!text) return null;
  return {
    text,
    createdAt: post.createdAt,
  };
}

/**
 * Fetch the latest post for a Contact (`limit 1`) as conversation preview.
 * Posts are oldest-first; when total > 1, probe total then fetch
 * `offset = total - 1`. Returns null when the Contact has no posts.
 *
 * Query string is built by `endpoints.chat.messages` — do not pass axios params.
 */
export async function fetchLatestPreview(
  contactId: string | number
): Promise<ConversationPreview | null> {
  const { data: firstPage } = await client.get<ApiOffsetPage>(
    endpoints.chat.messages(contactId, { limit: 1, offset: 0 })
  );

  if (firstPage.total === 0 || firstPage.results.length === 0) {
    return null;
  }

  if (firstPage.total === 1) {
    return toPreview(firstPage.results[0]!);
  }

  const { data: latestPage } = await client.get<ApiOffsetPage>(
    endpoints.chat.messages(contactId, {
      limit: 1,
      offset: firstPage.total - 1,
    })
  );

  const adapted = adaptOffsetPage(latestPage);
  const post = adapted.items[0];
  if (!post) return null;
  return toPreview(post);
}
