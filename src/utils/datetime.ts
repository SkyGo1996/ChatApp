import { format, isToday, isValid, isYesterday } from "date-fns";

function toDate(value: Date | string | number): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? date : null;
}

/**
 * FR2 conversation-row timestamp:
 * today → `hh:mm a`, yesterday → `Yesterday`, older → `dd/MM/yy`.
 * Returns null for invalid input so the row can hide the timestamp.
 */
export function formatConversationTimestamp(
  value: Date | string | number
): string | null {
  const date = toDate(value);
  if (!date) return null;
  if (isToday(date)) return format(date, "hh:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd/MM/yy");
}

/**
 * FR3 per-Message timestamp below bubble: always `hh:mm a`.
 */
export function formatMessageTimestamp(
  value: Date | string | number
): string | null {
  const date = toDate(value);
  if (!date) return null;
  return format(date, "hh:mm a");
}

/**
 * FR3 centered date separator: `Today` / `Yesterday` / `dd/MM/yy`.
 */
export function formatDateSeparator(
  value: Date | string | number
): string | null {
  const date = toDate(value);
  if (!date) return null;
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd/MM/yy");
}
