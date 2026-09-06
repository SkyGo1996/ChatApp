import { render, screen } from "@testing-library/react-native";
import { Dimensions, Platform, StyleSheet } from "react-native";

import { type } from "@/theme/tokens";

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
  minHeight?: number;
  minWidth?: number;
};

function flattenStyle(style: unknown): FlatStyle {
  return StyleSheet.flatten(style) as FlatStyle;
}

/**
 * Non-blocking style contract — layout math invariants.
 * Excluded from `pnpm test:blocking`; run via `pnpm test:style`.
 */
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

describe("Composer style contract", () => {
  test("applies fontScale-aware 4-line maxHeight from window dimensions", async () => {
    await render(<Composer onSend={jest.fn()} />);
    const input = await screen.findByTestId("composer-input");
    const flat = flattenStyle(input.props.style);
    const expected = composerInputLineMetrics(
      type.body.lineHeight,
      Dimensions.get("window").fontScale
    );
    // Android omits lineHeight on TextInput (setLineSpacing clips caret);
    // iOS keeps it. Both platforms floor height with minHeight.
    if (Platform.OS === "ios") {
      expect(flat.lineHeight).toBe(expected.lineHeight);
    } else {
      expect(flat.lineHeight).toBeUndefined();
    }
    expect(flat.minHeight).toBe(expected.lineHeight);
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

  test("disabled chrome and wrap have solid disabled fill", async () => {
    await render(<Composer onSend={jest.fn()} disabled />);

    // Ticket 11: solid disabled fill on chrome/wrap, never translucent.
    // Fill stays off TextInput so Android avoids a style pass that re-applies
    // line metrics after unblock.
    const chrome = await screen.findByTestId("composer-chrome");
    const chromeFlat = flattenStyle(chrome.props.style);
    expect(chromeFlat.backgroundColor).toBeDefined();
    expect(String(chromeFlat.backgroundColor)).not.toMatch(/rgba/);

    const wrap = await screen.findByTestId("composer-input-wrap");
    const wrapFlat = flattenStyle(wrap.props.style);
    expect(wrapFlat.backgroundColor).toBeDefined();
    expect(String(wrapFlat.backgroundColor)).not.toMatch(/rgba/);
  });

  test("remounts TextInput when disabled flips so Android remeasures", async () => {
    const { rerender } = await render(<Composer onSend={jest.fn()} disabled />);
    const blocked = await screen.findByTestId("composer-input");
    expect(blocked.props.editable).toBe(false);

    await rerender(<Composer onSend={jest.fn()} />);
    const open = await screen.findByTestId("composer-input");
    expect(open.props.editable).toBe(true);
    // Distinct keys force a fresh native EditText after unblock.
    expect(blocked.props.editable).not.toBe(open.props.editable);
  });
});
