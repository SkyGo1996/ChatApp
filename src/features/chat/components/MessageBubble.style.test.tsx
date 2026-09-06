import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { MessageBubble } from "./MessageBubble";

const createdAt = new Date(2024, 0, 15, 14, 30).toISOString();
const timestamp = "02:30 PM";

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

/**
 * Non-blocking style contract — exact visual tokens.
 * Excluded from `pnpm test:blocking`; run via `pnpm test:style`.
 */
describe("MessageBubble style contract", () => {
  test("sending bubble dims via opacity 0.7", async () => {
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

    const row = screen.getByLabelText(`You: Hello there. ${timestamp}`);
    expect(flattenStyle(row.props.style).opacity).toBe(0.7);
  });

  test("failed bubble uses destructive bg with 44pt retry target", async () => {
    await render(
      <MessageBubble
        message={{
          ...base,
          id: "local-failed",
          sender: "me",
          status: "failed",
        }}
        marginTop={12}
        onRetrySend={jest.fn()}
      />
    );

    const retry = screen.getByLabelText("Retry send");
    const flat = flattenStyle(retry.props.style);
    expect(flat.minHeight).toBe(44);
    expect(flat.minWidth).toBe(44);

    expect(
      flattenStyle(screen.getByTestId("message-bubble-failed").props.style)
        .backgroundColor
    ).toBe("#DC2626");
  });
});
