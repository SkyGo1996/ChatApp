import { format, isValid } from "date-fns";

import { space } from "@/theme/tokens";
import { formatDateSeparator } from "@/utils/datetime";

import type { Message } from "@/features/chat/types";

export type MessageGroupPosition = "single" | "start" | "middle" | "end";

export type ChatListMessageItem = {
  type: "message";
  key: string;
  message: Message;
  group: MessageGroupPosition;
  /** Top margin: space(1) within a group, space(3) between groups / after separator. */
  marginTop: number;
};

export type ChatListSeparatorItem = {
  type: "separator";
  key: string;
  label: string;
};

export type ChatListItem = ChatListMessageItem | ChatListSeparatorItem;

const WITHIN_GROUP = space(1);
const BETWEEN_GROUP = space(3);

function dayKey(value: string): string | null {
  const date = new Date(value);
  if (!isValid(date)) return null;
  return format(date, "yyyy-MM-dd");
}

function groupPosition(
  prev: Message | undefined,
  current: Message,
  next: Message | undefined
): MessageGroupPosition {
  const samePrev = prev !== undefined && prev.sender === current.sender;
  const sameNext = next !== undefined && next.sender === current.sender;
  if (samePrev && sameNext) return "middle";
  if (samePrev) return "end";
  if (sameNext) return "start";
  return "single";
}

/**
 * Build FlashList rows from chronological Messages (oldest → newest).
 * Inserts date separators on day change and tags same-sender group spacing.
 * Does not reverse the array.
 */
export function buildChatListItems(messages: Message[]): ChatListItem[] {
  const items: ChatListItem[] = [];
  let lastDay: string | null = null;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]!;
    const prev = i > 0 ? messages[i - 1] : undefined;
    const next = i < messages.length - 1 ? messages[i + 1] : undefined;

    const day = dayKey(message.createdAt);
    if (day !== null && day !== lastDay) {
      const label = formatDateSeparator(message.createdAt);
      if (label) {
        items.push({
          type: "separator",
          key: `sep-${day}`,
          label,
        });
      }
      lastDay = day;
    }

    const afterSeparator =
      items.length > 0 && items[items.length - 1]?.type === "separator";
    const sameGroupAsPrev =
      prev !== undefined &&
      prev.sender === message.sender &&
      dayKey(prev.createdAt) === day;
    // Separator already has its own top margin; keep a small gap below it.
    const marginTop =
      items.length === 0
        ? BETWEEN_GROUP
        : afterSeparator
          ? space(2)
          : !sameGroupAsPrev
            ? BETWEEN_GROUP
            : WITHIN_GROUP;

    items.push({
      type: "message",
      key: `msg-${String(message.id)}`,
      message,
      group: groupPosition(prev, message, next),
      marginTop,
    });
  }

  return items;
}
