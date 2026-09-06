import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import {
  blockedStorage,
  getRawThemeMMKV,
  initBlockedStorage,
  themeStorage,
} from "./persist";

type MMKVMock = {
  createMMKV: jest.Mock;
  __clearAll?: () => void;
  __instances?: Map<string, Map<string, string>>;
};

function getMMKVMock(): MMKVMock {
  return jest.requireMock("react-native-mmkv") as unknown as MMKVMock;
}

type SecureStoreMock = typeof SecureStore & {
  __clear: () => void;
  __store: Map<string, string>;
};

const secureStoreMock = SecureStore as SecureStoreMock;

describe("initBlockedStorage", () => {
  beforeEach(() => {
    secureStoreMock.__clear();
    jest.clearAllMocks();
    getMMKVMock().__clearAll?.();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("generates hex key via Crypto.getRandomBytes when SecureStore is empty", async () => {
    await initBlockedStorage();

    expect(Crypto.getRandomBytes).toHaveBeenCalledWith(32);

    const stored = await SecureStore.getItemAsync("mmkv-key");
    expect(stored).toMatch(/^[0-9a-f]{64}$/);
    // Assert independently (not tautologically): setItem called with hex string.
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "mmkv-key",
      expect.stringMatching(/^[0-9a-f]{64}$/)
    );
  });

  test("wires encryptionKey into encrypted MMKV instance", async () => {
    const mmkvMock = getMMKVMock();
    const createSpy = jest.spyOn(mmkvMock, "createMMKV");

    await initBlockedStorage();

    const stored = await SecureStore.getItemAsync("mmkv-key");
    expect(stored).toMatch(/^[0-9a-f]{64}$/);
    expect(createSpy).toHaveBeenCalledWith({
      id: "blocked-mmkv-enc",
      encryptionKey: stored,
    });
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

  test("falls back to plain MMKV when encryption is unsupported", async () => {
    const mmkvMock = getMMKVMock();
    const createSpy = jest.spyOn(mmkvMock, "createMMKV");
    createSpy.mockImplementationOnce(() => {
      throw new Error("encryption not supported");
    });

    await initBlockedStorage();

    // First call (encrypted) throws, second call (plain) succeeds.
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: "blocked-mmkv-enc" })
    );
    expect(createSpy).toHaveBeenCalledWith({ id: "blocked-mmkv" });
  });

  test("falls back to plain MMKV when SecureStore throws", async () => {
    const getSpy = jest.spyOn(SecureStore, "getItemAsync");
    getSpy.mockRejectedValueOnce(new Error("secure store unavailable"));
    const createSpy = jest.spyOn(getMMKVMock(), "createMMKV");

    await initBlockedStorage();

    expect(createSpy).toHaveBeenCalledWith({ id: "blocked-mmkv" });
  });
});

describe("MMKV storage adapter corruption recovery", () => {
  beforeEach(() => {
    getMMKVMock().__clearAll?.();
  });

  test("clears corrupt JSON and resolves null", async () => {
    const raw = getRawThemeMMKV();
    raw.set("persist:theme", "{not-json");

    await expect(themeStorage.getItem("persist:theme")).resolves.toBeNull();
    expect(raw.getString("persist:theme")).toBeUndefined();
  });

  test("returns null (not throw) when underlying MMKV throws", async () => {
    const raw = getRawThemeMMKV();
    const getStringSpy = jest.spyOn(raw, "getString").mockImplementation(() => {
      throw new Error("mmkv read failed");
    });

    await expect(blockedStorage.getItem("persist:blocked")).resolves.toBeNull();

    getStringSpy.mockRestore();
  });
});
