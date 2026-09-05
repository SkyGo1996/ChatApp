import { space } from "@/theme/tokens";

import type { Message } from "@/features/chat/types";

import { buildChatListItems } from "./buildChatListItems";

function msg(
  id: number,
  overrides: Partial<Message> & { createdAt: string }
): Message {
  return {
    id,
    text: `Text ${id}`,
    sender: "them",
    status: "sent",
    ...overrides,
  };
}

describe("buildChatListItems", () => {
  test("inserts date separators on day change and keeps chronological order", () => {
    const items = buildChatListItems([
      msg(1, { createdAt: "2024-01-15T10:00:00Z" }),
      msg(2, { createdAt: "2024-01-15T11:00:00Z" }),
      msg(3, { createdAt: "2024-01-16T09:00:00Z" }),
    ]);

    expect(items.map((i) => i.type)).toEqual([
      "separator",
      "message",
      "message",
      "separator",
      "message",
    ]);
    expect(items[0]).toMatchObject({ type: "separator", label: "01/15/24" });
    expect(items[3]).toMatchObject({ type: "separator", label: "01/16/24" });
    const messages = items.filter((i) => i.type === "message");
    expect(
      messages.map((m) => (m.type === "message" ? m.message.id : null))
    ).toEqual([1, 2, 3]);
  });

  test("groups consecutive same-sender Messages with tighter spacing", () => {
    const items = buildChatListItems([
      msg(1, { sender: "them", createdAt: "2024-01-15T10:00:00Z" }),
      msg(2, { sender: "them", createdAt: "2024-01-15T10:01:00Z" }),
      msg(3, { sender: "me", createdAt: "2024-01-15T10:02:00Z" }),
    ]);

    const messages = items.filter((i) => i.type === "message");
    expect(messages).toHaveLength(3);
    if (
      messages[0]?.type !== "message" ||
      messages[1]?.type !== "message" ||
      messages[2]?.type !== "message"
    ) {
      throw new Error("expected message items");
    }
    expect(messages[1].marginTop).toBe(space(1));
    expect(messages[2].marginTop).toBe(space(3));
  });

  test("does not reverse the input array", () => {
    const input = [
      msg(1, { createdAt: "2024-01-15T10:00:00Z" }),
      msg(2, { createdAt: "2024-01-15T11:00:00Z" }),
    ];
    const before = input.map((m) => m.id);
    buildChatListItems(input);
    expect(input.map((m) => m.id)).toEqual(before);
  });
});
