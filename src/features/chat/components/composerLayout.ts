/** Shared nativeID linking KeyboardGestureArea ↔ composer TextInput. */
export const CHAT_INPUT_NATIVE_ID = "chat-input";

/** 4-line input metrics scaled for Dynamic Type (`fontScale`). */
export function composerInputLineMetrics(
  bodyLineHeight: number,
  fontScale: number
): { lineHeight: number; maxHeight: number } {
  const lineHeight = bodyLineHeight * fontScale;
  return { lineHeight, maxHeight: lineHeight * 4 };
}
