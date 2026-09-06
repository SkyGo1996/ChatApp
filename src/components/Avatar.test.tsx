import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { Avatar } from "./Avatar";

describe("Avatar", () => {
  test("shows initials when uri is missing", async () => {
    await render(<Avatar name="Jane Doe" testID="avatar" />);
    expect(screen.getByText("JD")).toBeTruthy();
    expect(screen.getByLabelText("Jane Doe avatar")).toBeTruthy();
  });

  test("renders expo-image (not fallback) when uri is provided", async () => {
    await render(
      <Avatar
        name="Jane Doe"
        uri="https://i.pravatar.cc/150?img=1"
        testID="avatar"
      />
    );
    expect(screen.getByTestId("expo-image")).toBeTruthy();
    expect(screen.getByLabelText("Jane Doe avatar")).toBeTruthy();
    expect(screen.queryByText("JD")).toBeNull();
  });

  test("applies size to container dimensions", async () => {
    await render(<Avatar name="Jane Doe" size={64} testID="avatar" />);
    const container = screen.getByTestId("avatar");
    const flat = StyleSheet.flatten(container.props.style) as {
      width?: number;
      height?: number;
      borderRadius?: number;
    };
    expect(flat.width).toBe(64);
    expect(flat.height).toBe(64);
    expect(flat.borderRadius).toBe(32);
  });

  test("shows single-name initials", async () => {
    await render(<Avatar name="Alice" />);
    expect(screen.getByText("AL")).toBeTruthy();
  });

  test("shows ? for empty name", async () => {
    await render(<Avatar name="   " />);
    expect(screen.getByText("?")).toBeTruthy();
  });

  test("resets initials when recyclingKey / name changes without remount key", async () => {
    const { rerender } = await render(
      <Avatar name="Jane Doe" recyclingKey="1" testID="avatar" />
    );
    expect(screen.getByText("JD")).toBeTruthy();
    const container = screen.getByTestId("avatar");

    await rerender(
      <Avatar name="Ada Lovelace" recyclingKey="2" testID="avatar" />
    );
    expect(screen.getByText("AL")).toBeTruthy();
    expect(screen.queryByText("JD")).toBeNull();
    expect(screen.getByLabelText("Ada Lovelace avatar")).toBeTruthy();
    // Same host instance — recycle resets state without React key remount.
    expect(screen.getByTestId("avatar")).toBe(container);
  });

  test("updates initials on name-only change (identity ignores name)", async () => {
    const { rerender } = await render(
      <Avatar name="Jane Doe" recyclingKey="1" testID="avatar" />
    );
    expect(screen.getByText("JD")).toBeTruthy();

    await rerender(
      <Avatar name="Ada Lovelace" recyclingKey="1" testID="avatar" />
    );
    expect(screen.getByText("AL")).toBeTruthy();
    expect(screen.queryByText("JD")).toBeNull();
  });
});
