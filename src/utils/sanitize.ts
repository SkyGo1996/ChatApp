/**
 * Message input sanitization — single owner for send-time rules.
 * Callers must not reimplement trim/collapse/maxLength/control-char strip.
 */

export const MESSAGE_MAX_LENGTH = 2000;

/**
 * C0 controls except newline (0x0A) and tab (0x09).
 * Built via char codes to avoid `no-control-regex`.
 */
const CONTROL_CHARS_EXCEPT_NT = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}-${String.fromCharCode(13)}${String.fromCharCode(14)}-${String.fromCharCode(31)}]`,
  "g"
);

/** Horizontal whitespace runs (spaces + tabs) — newlines are preserved. */
const HORIZONTAL_WHITESPACE = /[ \t]+/g;

/**
 * Sanitize Message body before send.
 * Pipeline: strip C0 (keep `\n`/`\t`) → collapse horizontal whitespace →
 * trim → max 2000 → null if empty.
 */
export function sanitizeMessageInput(raw: string): string | null {
  const stripped = raw.replace(CONTROL_CHARS_EXCEPT_NT, "");
  const collapsed = stripped.replace(HORIZONTAL_WHITESPACE, " ");
  const trimmed = collapsed.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, MESSAGE_MAX_LENGTH);
}
