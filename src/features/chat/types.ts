/**
 * Chat feature types — Message is owned here (spec glossary).
 * Cross-feature imports re-export from this file; never redefine.
 *
 * Current User (`me`) is hard-coded id 999 (outside mock Contacts 1–60).
 * Fetched posts map to `them`; locally sent Messages (ticket 08) map to `me`.
 */

export const CURRENT_USER_ID = 999;

export type MessageSender = "me" | "them";

export type MessageStatus = "sending" | "sent" | "failed";

export type Message = {
  id: number | string;
  text: string;
  sender: MessageSender;
  createdAt: string;
  status: MessageStatus;
};
