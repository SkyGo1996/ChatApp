import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { MessageShimmer } from "./MessageShimmer";

type FlatStyle = {
  maxWidth?: number | string;
  width?: number | string;
};

function flattenStyle(style: unknown): FlatStyle {
  return StyleSheet.flatten(style) as FlatStyle;
}

/**
 * Non-blocking style contract — shimmer row geometry must match MessageBubble.
 * Excluded from `pnpm test:blocking`; run via `pnpm test:style`.
 */
describe("MessageShimmer style contract", () => {
  test("page rows use explicit 75% width so bubble % widths resolve", async () => {
    await render(<MessageShimmer variant="page" />);

    expect(screen.getByLabelText("Loading messages")).toBeTruthy();

    const rows = screen.getAllByTestId("message-shimmer-row");
    expect(rows).toHaveLength(6);

    for (const row of rows) {
      const flat = flattenStyle(row.props.style);
      expect(flat.width).toBe("75%");
      expect(flat.maxWidth).toBe("75%");
    }
  });

  test("header variant reuses bubble rows (not left-only bars)", async () => {
    await render(<MessageShimmer variant="header" />);

    const rows = screen.getAllByTestId("message-shimmer-row");
    expect(rows).toHaveLength(2);

    for (const row of rows) {
      const flat = flattenStyle(row.props.style);
      expect(flat.width).toBe("75%");
      expect(flat.maxWidth).toBe("75%");
    }
  });
});
