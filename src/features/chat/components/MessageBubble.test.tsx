import { fireEvent, render, screen } from "@testing-library/react-native";

import { MessageBubble } from "./MessageBubble";

const createdAt = new Date(2024, 0, 15, 14, 30).toISOString();
// Hardcoded local time (not derived via formatMessageTimestamp) to avoid tautology.
const timestamp = "02:30 PM";

const base = {
  text: "Hello there",
  createdAt,
};

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
    // Dimmed state asserted via style contract (opacity 0.7 in style suite);
    // blocking test asserts behavior only: sending label still present.
    expect(
      screen.getByLabelText(`You: Hello there. ${timestamp}`)
    ).toBeTruthy();
  });

  test("failed bubble shows same-row Retry send and memory-only hint", async () => {
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
    expect(screen.getByTestId("message-bubble-failed")).toBeTruthy();

    await fireEvent.press(retry);
    expect(onRetrySend).toHaveBeenCalledWith("local-failed");
  });
});
