/**
 * Conversations feature types — Conversation is owned here (spec glossary).
 * Cross-feature imports re-export from this file; never redefine.
 *
 * `lastMessage` / `lastMessageAt` are optional local patches (ticket 08
 * optimistic send) — not returned by fetchConversationsPage.
 */
export type Conversation = {
  id: number;
  name: string;
  avatar: string;
  lastMessage?: string;
  lastMessageAt?: string;
};

/** Slim preview DTO from GET /posts?userId=&limit=1 enrichment. */
export type ConversationPreview = {
  text: string;
  createdAt: string;
};
