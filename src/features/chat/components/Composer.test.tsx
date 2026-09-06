import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import { MESSAGE_MAX_LENGTH } from "@/utils/sanitize";

import { Composer } from "./Composer";

jest.mock("@/hooks/useReduceMotion", () => ({
  useReduceMotion: () => false,
}));

jest.mock("@/hooks/useReduceTransparency", () => ({
  useReduceTransparency: () => true,
}));

describe("Composer", () => {
  test("Send is disabled when input is empty", async () => {
    const onSend = jest.fn();
    await render(<Composer onSend={onSend} />);

    expect(await screen.findByLabelText("Send")).toBeDisabled();
    await fireEvent.press(screen.getByLabelText("Send"));
    expect(onSend).not.toHaveBeenCalled();
  });

  test("Send is disabled for whitespace-only and controls-only input", async () => {
    const onSend = jest.fn();
    await render(<Composer onSend={onSend} />);

    const input = await screen.findByTestId("composer-input");
    await fireEvent.changeText(input, "   \n\t  ");
    expect(screen.getByLabelText("Send")).toBeDisabled();

    await fireEvent.changeText(input, "\u0000\u0007");
    expect(screen.getByLabelText("Send")).toBeDisabled();
    expect(onSend).not.toHaveBeenCalled();
  });

  test("Send is enabled for real text and onSend receives sanitized value", async () => {
    const onSend = jest.fn();
    await render(<Composer onSend={onSend} />);

    await fireEvent.changeText(
      await screen.findByTestId("composer-input"),
      "  hello   world\u0000  "
    );
    expect(screen.getByLabelText("Send")).not.toBeDisabled();

    await fireEvent.press(screen.getByLabelText("Send"));
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("hello world");
  });

  test("clears draft after successful send without haptic", async () => {
    const onSend = jest.fn();
    await render(<Composer onSend={onSend} />);

    const input = await screen.findByTestId("composer-input");
    await fireEvent.changeText(input, "ping");
    await fireEvent.press(screen.getByLabelText("Send"));

    expect(input.props.value).toBe("");
    expect(screen.getByLabelText("Send")).toBeDisabled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  test("caps input at MESSAGE_MAX_LENGTH and passes capped text on send", async () => {
    const onSend = jest.fn();
    await render(<Composer onSend={onSend} />);

    const long = "a".repeat(MESSAGE_MAX_LENGTH + 10);
    await fireEvent.changeText(
      await screen.findByTestId("composer-input"),
      long
    );
    // TextInput maxLength may clamp; sanitize also slices.
    await fireEvent.press(screen.getByLabelText("Send"));
    expect(onSend).toHaveBeenCalledWith("a".repeat(MESSAGE_MAX_LENGTH));
  });

  test("input allows font scaling and uses Message placeholder", async () => {
    await render(<Composer onSend={jest.fn()} />);

    const input = await screen.findByTestId("composer-input");
    expect(input.props.allowFontScaling).toBe(true);
    expect(input.props.placeholder).toBe("Type a Message...");
    expect(input.props.multiline).toBe(true);
  });

  test("disabled prop blocks editing and send", async () => {
    const onSend = jest.fn();
    await render(<Composer onSend={onSend} disabled />);

    const input = await screen.findByTestId("composer-input");
    expect(input.props.editable).toBe(false);
    await fireEvent.changeText(input, "hello");
    expect(screen.getByLabelText("Send")).toBeDisabled();
    await fireEvent.press(screen.getByLabelText("Send"));
    expect(onSend).not.toHaveBeenCalled();
  });
});
