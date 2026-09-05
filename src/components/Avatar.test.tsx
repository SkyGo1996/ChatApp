import { render, screen } from "@testing-library/react-native";

import { Avatar } from "./Avatar";

describe("Avatar", () => {
  test("shows initials when uri is missing", async () => {
    await render(<Avatar name="Jane Doe" testID="avatar" />);
    expect(screen.getByText("JD")).toBeTruthy();
    expect(screen.getByLabelText("Jane Doe avatar")).toBeTruthy();
  });

  test("shows single-name initials", async () => {
    await render(<Avatar name="Alice" />);
    expect(screen.getByText("AL")).toBeTruthy();
  });

  test("shows ? for empty name", async () => {
    await render(<Avatar name="   " />);
    expect(screen.getByText("?")).toBeTruthy();
  });

  test("resets initials when recyclingKey / name changes", async () => {
    const { rerender } = await render(
      <Avatar name="Jane Doe" recyclingKey="1" testID="avatar" />
    );
    expect(screen.getByText("JD")).toBeTruthy();

    await rerender(
      <Avatar name="Ada Lovelace" recyclingKey="2" testID="avatar" />
    );
    expect(screen.getByText("AL")).toBeTruthy();
    expect(screen.queryByText("JD")).toBeNull();
    expect(screen.getByLabelText("Ada Lovelace avatar")).toBeTruthy();
  });
});
