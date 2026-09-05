/**
 * Conversations feature types — Conversation is owned here (spec glossary).
 * Cross-feature imports re-export from this file; never redefine.
 */
export type Conversation = {
  id: number;
  name: string;
  avatar: string;
};
