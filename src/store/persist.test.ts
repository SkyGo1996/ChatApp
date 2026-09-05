import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import { initBlockedStorage } from "./persist";

type SecureStoreMock = typeof SecureStore & {
  __clear: () => void;
  __store: Map<string, string>;
};

const secureStoreMock = SecureStore as SecureStoreMock;

describe("initBlockedStorage", () => {
  beforeEach(() => {
    secureStoreMock.__clear();
    jest.clearAllMocks();
  });

  test("generates hex key via Crypto.getRandomBytes when SecureStore is empty", async () => {
    const mathSpy = jest.spyOn(Math, "random");

    await initBlockedStorage();

    expect(Crypto.getRandomBytes).toHaveBeenCalledWith(32);
    expect(mathSpy).not.toHaveBeenCalled();

    const stored = await SecureStore.getItemAsync("mmkv-key");
    expect(stored).toMatch(/^[0-9a-f]{64}$/);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("mmkv-key", stored);

    mathSpy.mockRestore();
  });

  test("reuses existing SecureStore key without regenerating", async () => {
    await SecureStore.setItemAsync("mmkv-key", "existing-key-do-not-rotate");
    jest.clearAllMocks();

    await initBlockedStorage();

    expect(Crypto.getRandomBytes).not.toHaveBeenCalled();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(await SecureStore.getItemAsync("mmkv-key")).toBe(
      "existing-key-do-not-rotate"
    );
  });
});
