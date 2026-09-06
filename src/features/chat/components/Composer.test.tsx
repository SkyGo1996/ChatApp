import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { Dimensions, StyleSheet } from "react-native";

import { type } from "@/theme/tokens";
import { MESSAGE_MAX_LENGTH } from "@/utils/sanitize";

import { Composer } from "./Composer";
import { composerInputLineMetrics } from "./composerLayout";

jest.mock("@/hooks/useReduceMotion", () => ({
  useReduceMotion: () => false,
}));

jest.mock("@/hooks/useReduceTransparency", () => ({
  useReduceTransparency: () => true,
}));

type FlatStyle = {
  backgroundColor?: string;
  flex?: number;
  lineHeight?: number;
  maxHeight?: number;
  minWidth?: number;
};

function flattenStyle(style: unknown): FlatStyle {
  return StyleSheet.flatten(style) as FlatStyle;
}
describe("composerInputLineMetrics", () => {
  test("scales 4-line maxHeight with fontScale", () => {
    expect(composerInputLineMetrics(type.body.lineHeight, 1)).toEqual({
      lineHeight: type.body.lineHeight,
      maxHeight: type.body.lineHeight * 4,
    });
    expect(composerInputLineMetrics(type.body.lineHeight, 2)).toEqual({
      lineHeight: type.body.lineHeight * 2,
      maxHeight: type.body.lineHeight * 4 * 2,
    });
  });
});

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

  test("applies fontScale-aware 4-line maxHeight from window dimensions", async () => {
    await render(<Composer onSend={jest.fn()} />);
    const input = await screen.findByTestId("composer-input");
    const flat = flattenStyle(input.props.style);
    const expected = composerInputLineMetrics(
      type.body.lineHeight,
      Dimensions.get("window").fontScale
    );
    expect(flat.lineHeight).toBe(expected.lineHeight);
    expect(flat.maxHeight).toBe(expected.maxHeight);
  });

  test("input wrap keeps flex row reflow invariants for narrow widths", async () => {
    await render(<Composer onSend={jest.fn()} />);
    const input = await screen.findByTestId("composer-input");
    const wrap = input.parent;
    expect(wrap).toBeTruthy();
    const wrapFlat = flattenStyle(
      (wrap as unknown as { props: { style: unknown } }).props.style
    );
    expect(wrapFlat.flex).toBe(1);
    expect(wrapFlat.minWidth).toBe(0);
  });

  test("disabled prop blocks editing and send without disabled fill", async () => {
    const onSend = jest.fn();
    await render(<Composer onSend={onSend} disabled />);

    const input = await screen.findByTestId("composer-input");
    expect(input.props.editable).toBe(false);
    const flat = flattenStyle(input.props.style);
    expect(flat.backgroundColor).toBeUndefined();
    await fireEvent.changeText(input, "hello");
    expect(screen.getByLabelText("Send")).toBeDisabled();
    await fireEvent.press(screen.getByLabelText("Send"));
    expect(onSend).not.toHaveBeenCalled();
  });
});
