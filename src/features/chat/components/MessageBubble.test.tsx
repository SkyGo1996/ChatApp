import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { formatMessageTimestamp } from "@/utils/datetime";

import { MessageBubble } from "./MessageBubble";

const createdAt = "2024-01-15T14:30:00.000Z";
const timestamp = formatMessageTimestamp(createdAt)!;

const base = {
  text: "Hello there",
  createdAt,
};

type FlatStyle = {
  backgroundColor?: string;
  minHeight?: number;
  minWidth?: number;
  opacity?: number;
};

function flattenStyle(style: unknown): FlatStyle {
  return StyleSheet.flatten(style) as FlatStyle;
}

describe("MessageBubble", () => {
  test("renders them bubble with body text and timestamp", async () => {
    await render(
      <MessageBubble
        message={{ ...base, id: 1, sender: "them", status: "sent" }}
        marginTop={12}
      />
    );

    expect(screen.getByText("Hello there")).toBeTruthy();
    expect(screen.getByText(timestamp)).toBeTruthy();
    expect(
      screen.getByLabelText(`Contact: Hello there. ${timestamp}`)
    ).toBeTruthy();
  });

  test("renders me bubble with You accessibility label", async () => {
    await render(
      <MessageBubble
        message={{ ...base, id: 1, sender: "me", status: "sent" }}
        marginTop={12}
      />
    );

    expect(screen.getByText("Hello there")).toBeTruthy();
    expect(
      screen.getByLabelText(`You: Hello there. ${timestamp}`)
    ).toBeTruthy();
    expect(screen.queryByLabelText("Retry send")).toBeNull();
  });

  test("dims sending bubble without spinner or retry", async () => {
    await render(
      <MessageBubble
        message={{
          ...base,
          id: "local-1",
          sender: "me",
          status: "sending",
        }}
        marginTop={12}
      />
    );

    expect(screen.queryByTestId("message-sending-spinner")).toBeNull();
    expect(screen.queryByLabelText("Retry send")).toBeNull();
    const row = screen.getByLabelText(`You: Hello there. ${timestamp}`);
    expect(flattenStyle(row.props.style).opacity).toBe(0.7);
  });

  test("failed bubble is red with same-row Retry send and memory-only hint", async () => {
    const onRetrySend = jest.fn();
    await render(
      <MessageBubble
        message={{
          ...base,
          id: "local-failed",
          sender: "me",
          status: "failed",
        }}
        marginTop={12}
        onRetrySend={onRetrySend}
      />
    );

    expect(screen.getByText("Unsent if you leave the app")).toBeTruthy();
    const retry = screen.getByLabelText("Retry send");
    expect(retry).toBeTruthy();
    const flat = flattenStyle(retry.props.style);
    expect(flat.minHeight).toBe(44);
    expect(flat.minWidth).toBe(44);

    expect(
      flattenStyle(screen.getByTestId("message-bubble-failed").props.style)
        .backgroundColor
    ).toBe("#DC2626");

    await fireEvent.press(retry);
    expect(onRetrySend).toHaveBeenCalledWith("local-failed");
  });
});
