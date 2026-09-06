import blockedReducer, {
  blockContact,
  isContactBlocked,
  unblockContact,
  type BlockedState,
} from "./blockedSlice";

describe("blockedSlice", () => {
  const empty: BlockedState = { blockedIds: {} };

  test("initial state is empty (all Contacts unblocked)", () => {
    expect(blockedReducer(undefined, { type: "@@init" })).toEqual(empty);
  });

  test("blockContact marks Contact blocked by string id", () => {
    const next = blockedReducer(empty, blockContact("7"));
    expect(isContactBlocked(next, "7")).toBe(true);
    expect(isContactBlocked(next, 7)).toBe(true);
  });

  test("blockContact accepts numeric contactId", () => {
    const next = blockedReducer(empty, blockContact(99));
    expect(next.blockedIds["99"]).toBe(true);
  });

  test("unblockContact clears Contact", () => {
    const blocked = blockedReducer(empty, blockContact("3"));
    const next = blockedReducer(blocked, unblockContact(3));
    expect(isContactBlocked(next, "3")).toBe(false);
    expect(next.blockedIds).toEqual({});
  });

  test("missing contactId is unblocked", () => {
    expect(isContactBlocked(empty, "1")).toBe(false);
    expect(isContactBlocked({ blockedIds: { "2": true } }, "1")).toBe(false);
  });
});
