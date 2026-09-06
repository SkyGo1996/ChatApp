import { client, type ApiError } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { sanitizeMessageInput } from "@/utils/sanitize";

import type { Message } from "@/features/chat/types";

/** Max length for the required Post `title` field (not shown in bubbles). */
const TITLE_MAX_LENGTH = 80;

type ApiPost = {
  id: number;
  userId: number;
  title: string;
  body: string;
  createdAt: string;
};

export type SendMessageInput = {
  conversationId: string | number;
  text: string;
};

/**
 * Derive a non-empty Post title from sanitized body (first line, truncated).
 * Title is never rendered in bubbles — body is the Message text.
 */
export function derivePostTitle(body: string): string {
  const firstLine = body.split("\n")[0]?.trim() || body;
  if (firstLine.length <= TITLE_MAX_LENGTH) return firstLine;
  return firstLine.slice(0, TITLE_MAX_LENGTH);
}

/**
 * Map a successful POST /posts response to a locally-sent Message (`me` / `sent`).
 * Distinct from mapPostToMessage, which always attributes fetched posts to `them`.
 */
export function mapSentPostToMessage(post: {
  id: number;
  body: string;
  createdAt: string;
}): Message {
  return {
    id: post.id,
    text: post.body,
    sender: "me",
    createdAt: post.createdAt,
    status: "sent",
  };
}

/**
 * POST a Message via endpoints.chat.send.
 * Sanitizes body (shared util), uses Contact id as userId (valid mock author),
 * and maps the 201 Post to a `me` Message. Mock id is always 101 and not persisted.
 */
export async function sendMessage(input: SendMessageInput): Promise<Message> {
  const body = sanitizeMessageInput(input.text);
  if (body === null) {
    throw Object.assign(new Error("Message body is empty after sanitization"), {
      status: 400,
      message: "Message body is empty after sanitization",
      raw: null,
    } satisfies ApiError);
  }

  const { data } = await client.post<ApiPost>(endpoints.chat.send, {
    userId: Number(input.conversationId),
    title: derivePostTitle(body),
    body,
  });

  return mapSentPostToMessage(data);
}
