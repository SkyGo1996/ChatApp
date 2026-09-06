import { Text } from "react-native";

import { blockContact, unblockContact } from "@/store/slices/blockedSlice";
import {
  act,
  createTestStore,
  fireEvent,
  renderWithProviders,
} from "@/test-utils";

import { useBlock } from "./useBlock";

function Probe({ contactId }: { contactId: string | number }) {
  const { isBlocked, block, unblock } = useBlock(contactId);
  return (
    <Text
      testID="probe"
      onPress={isBlocked ? unblock : block}
      accessibilityState={{ checked: isBlocked }}>
      {isBlocked ? "blocked" : "unblocked"}
    </Text>
  );
}

describe("useBlock", () => {
  test("defaults to unblocked and can block / unblock via dispatch", async () => {
    const store = createTestStore();
    const screen = await renderWithProviders(<Probe contactId="5" />, {
      store,
    });

    expect(screen.getByTestId("probe")).toHaveTextContent("unblocked");

    await act(() => {
      store.dispatch(blockContact("5"));
    });
    expect(await screen.findByText("blocked")).toBeTruthy();

    await act(() => {
      store.dispatch(unblockContact(5));
    });
    expect(await screen.findByText("unblocked")).toBeTruthy();
  });

  test("string and number contactId share the same Block flag", async () => {
    const store = createTestStore({
      blocked: { blockedIds: { "12": true } },
    });
    const { getByTestId } = await renderWithProviders(
      <Probe contactId={12} />,
      { store }
    );
    expect(getByTestId("probe")).toHaveTextContent("blocked");
  });

  test("block() / unblock() dispatch via press", async () => {
    const store = createTestStore();
    const screen = await renderWithProviders(<Probe contactId="9" />, {
      store,
    });

    await fireEvent.press(screen.getByTestId("probe"));
    expect(await screen.findByText("blocked")).toBeTruthy();
    expect(store.getState().blocked.blockedIds["9"]).toBe(true);

    await fireEvent.press(screen.getByTestId("probe"));
    expect(await screen.findByText("unblocked")).toBeTruthy();
  });
});
