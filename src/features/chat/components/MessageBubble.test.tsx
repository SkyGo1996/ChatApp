import { render, screen } from "@testing-library/react-native";

import { formatMessageTimestamp } from "@/utils/datetime";

import type { Message } from "@/features/chat/types";

import { MessageBubble } from "./MessageBubble";

const createdAt = "2024-01-15T14:30:00.000Z";
const timestamp = formatMessageTimestamp(createdAt)!;

const base: Omit<Message, "sender"> = {
  id: 1,
  text: "Hello there",
  createdAt,
  status: "sent",
};

describe("MessageBubble", () => {
  test("renders them bubble with body text and timestamp", async () => {
    await render(
      <MessageBubble message={{ ...base, sender: "them" }} marginTop={12} />
    );

    expect(screen.getByText("Hello there")).toBeTruthy();
    expect(screen.getByText(timestamp)).toBeTruthy();
    expect(
      screen.getByLabelText(`Contact: Hello there. ${timestamp}`)
    ).toBeTruthy();
  });

  test("renders me bubble with You accessibility label", async () => {
    await render(
      <MessageBubble message={{ ...base, sender: "me" }} marginTop={12} />
    );

    expect(screen.getByText("Hello there")).toBeTruthy();
    expect(
      screen.getByLabelText(`You: Hello there. ${timestamp}`)
    ).toBeTruthy();
  });
});
